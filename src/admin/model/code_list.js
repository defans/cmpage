'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
 @module admin.model
 */

/**
 * 代码于参数设置的页面展示及操作类，单层的CRUD，配合 cmpage/controller/page.js 中的相关调用，继承自 cmpage/model/page.js
 * @class admin.model.code_list
 */
import CMPage from '../../cmpage/model/page.js';
export default class extends CMPage {
    /**
     * 重写父类的 getQueryWhere 方法，增加页面模块的条件设置，组合成新的Where子句
     * @method  getQueryWhere
     * @return {string}  where条件子句
     * @param {Object} page  页面设置主信息
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        //global.debug(where);
        let parmsUrl =JSON.parse(page.parmsUrl);
        return where +' and c_pid='+parmsUrl.c_pid;
    }
    /**
     * 重写父类的 pageEditInit 方法，对初始化编辑页面的值进行修改
     * @method  pageEditInit
     * @return {string}  where条件子句
     * @param {Object} pageEdits  编辑页面的设置信息
     * @param {Object} page  页面设置主信息
     */
    async pageEditInit(pageEdits,page){
        let md = await super.pageEditInit(pageEdits,page);

        let parmsUrl = JSON.parse(page.parmsUrl);
        let pCode = await this.model('code').getCodeById(parseInt(parmsUrl.c_pid));
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
     * @param {Object} page  页面设置主信息
     * @param {Object} parms  编辑页面传回的FORM参数
     */
    async pageSave(page,parms){
        let ret = await super.pageSave(page, parms);
        this.model('code').clearCodeCache();

        return ret;
    }
}