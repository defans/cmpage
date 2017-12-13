'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
 @module admin.service
 */

/**
 * 代码于参数设置的页面展示及操作类，单层的CRUD，配合 cmpage/controller/page.js 中的相关调用，继承自 cmpage/model/page.js
 * @class admin.service.code_list
 */
const CMPage = require('../cmpage/page.js');
module.exports = class extends CMPage {

    /**
     * 重写父类的 pageEditInit 方法，对初始化编辑页面的值进行修改
     * @method  pageEditInit
     * @return {string}  where条件子句
     */
    async pageEditInit() {
        let md = await super.pageEditInit();

        let pCode = await cmpage.service('admin/code').getCodeById(parseInt(this.mod.parmsUrl.c_pid));
        md.c_pid = pCode.id;
        md.c_root = pCode.c_root;
        md.c_type = 'N';

        //console.log(md);
        return md;
    }
    /**
     * 重写父类的 pageSave 方法，保存参数后清除code表的缓存
     * @method  pageSave
     * @return {Object}  保存的数据表记录的对象
     * @param {Object} parms  编辑页面传回的FORM参数
     */
    async pageSave(parms) {
        //如果是菜单或者按钮，不允许c_object 重复
        let rec = parms;
        rec.id = think.isEmpty(parms.id) ? 0 : parms.id;
        if (rec.c_root == 1 && !think.isEmpty(rec.c_object)) {
            let codes = await cmpage.service('admin/code').getCodes();
            for (let md of codes) {
                if (md.c_root === 1 && md.c_object === rec.c_object && rec.id != md.id) {
                    return cmpage.error('对象代码(c_object)设置重复，保存失败！', rec);
                }
            }
        }
        let ret = await super.pageSave(parms);
        await cmpage.service('admin/code').clearCodeCache();

        return ret;
    }
    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete() {
        let rec = await cmpage.service('admin/code').getCodeById(this.mod.recID);
        //debug(rec,'code_list.pageDelete - rec');
        if (rec.c_pid == 705) {
            //物料分类
            let cnt = await cmpage.service('docu/goods').model('t_goods').where({
                c_class: rec.id
            }).count();
            if (cnt > 0) return {
                statusCode: 300,
                message: '请先删除该分类下的物料资料！',
                data: {}
            };
        }

        return await super.pageDelete();
    }
}