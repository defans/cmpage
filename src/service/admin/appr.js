'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 几种典型的业务模块演示，包括普通页面、主从页面、各种编辑类型、按钮调用方式及工作流的调用等

 @module demo.model
 */

/**
 * 通用的审核操作，把相关业务的审核记录到表 t_appr，并作相应逻辑实现
 * 通过工作流的状态变换进行流转，不产生任务记录
 * @class cmpage.service.appr
 */
const CMPage = require('../cmpage/page_mob.js');

module.exports = class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    //async getQueryWhere(){
    //    let where =await super.getQueryWhere();
    //    return where +' and c_status<>-1';
    //}

    /**
     * 审核页面初始化，从URL传入参数
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit(){
        let md =await super.pageEditInit();
        let parmsUrl =this.mod.parmsUrl;

        md.c_status = parmsUrl.status;
        md.c_act = parmsUrl.actID;
        md.c_link = parmsUrl.linkID;
        md.c_link_type = parmsUrl.linkType;
        md.c_modulename = parmsUrl.linkModulename;
        debug(md,'appr.pageEditInit - md');
        return md
    }

    /**
     * 取当前记录对象，用于新增和修改的编辑页面展示
     * @method  getDataRecord
     * @return {object} 当前记录对象
     */
    async getDataRecord(){
        let md = await super.getDataRecord();
        this.proc.c_link_type = md.c_link_type;
        this.proc.linkModulename = md.c_modulename;
        return md;
    }

    /**
     * 编辑页面保存,<br/>
     * 保存之前需要更新关联对象的状态
     * @method  pageSave
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms){
        let page = await cmpage.service('cmpage/module').getModuleByName(parms.c_modulename);     //打开界面的参数中来 parmsUrl.linkModulename
        page.user = this.mod.user;
        let linkModel = cmpage.service(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        linkModel.mod = page;        
        if(linkModel){
            await linkModel.initPage();
            //更新关联对象的状态
            let ret = await linkModel.updateStatus(parms.c_link, parms.c_act, parms.c_status, false);
            debug(ret,'appr.pageSave - linkModel.updateStatus.ret');
            if(ret.statusCode === 200){
                await super.pageSave(parms);
            }
            return ret;
        }
        return {statusCode:300, message:'操作失败!'};
    }

}
