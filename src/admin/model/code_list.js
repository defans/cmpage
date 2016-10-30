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
     */
    async getQueryWhere(){
        let where =await super.getQueryWhere();
        //global.debug(where);
        let parmsUrl =JSON.parse(this.mod.parmsUrl);
        return where +' and c_pid='+parmsUrl.c_pid;
    }
    /**
     * 重写父类的 pageEditInit 方法，对初始化编辑页面的值进行修改
     * @method  pageEditInit
     * @return {string}  where条件子句
     */
    async pageEditInit(){
        let md = await super.pageEditInit();

        let parmsUrl = JSON.parse(this.mod.parmsUrl);
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
     * @param {Object} parms  编辑页面传回的FORM参数
     */
    async pageSave(parms){
        let ret = await super.pageSave( parms);
        this.model('code').clearCodeCache();

        return ret;
    }

    /**
     * 取顶部按钮的设置，分靠左和靠右两块，组合成HTML输出
     * @method  htmlGetBtnHeader
     * @return {string}  HTML片段
     */
    async htmlGetBtnHeader(){
        let parmsUrl =JSON.parse(this.mod.parmsUrl);
        for(let btn of this.modBtns){
            if(btn.c_object.indexOf('.Edit') >0){
                btn.c_url +='&target='+parmsUrl.target;
            }
        }
        return super.htmlGetBtnHeader();
    }


}