'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供工作流节点的指派及权限处理的相关方法，对外提供统一归口的调用<br/>
 * @class flow.model.proc_assign
 */
const CMPage = require('../cmpage/page_mob.js');

module.exports = class extends CMPage {
    constructor() {
        super();
        this.connStr='cmpage';
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit(){
        let md =await super.pageEditInit();
        md.c_type = cmpage.enumActAssignType.ROLE;    //默认是角色
        md.c_act = this.mod.parmsUrl.c_act;

        return md
    }

    /**
     * 改变某些编辑列的样式，子类中可以重写本方法类增加模块编辑页面的操作逻辑
     * @method  htmlGetEditInput
     * @return {string} Edit页面的Input的HTML片段
     * @params {object} col Edit页面的当前编辑列设置
     * @params {string} colValue Input的值
     * @params {string} input Edit页面的Input的HTML片段
     */
    async htmlGetEditInput(col,colValue,input) {
        let html = '';
        //增加模块编辑页面的操作逻辑，也可以配合页面js方法
        if(col.c_column ==='link_name'){
            let dataUrl = '';
            if(this.rec.c_type === cmpage.enumActAssignType.DEPT){
                dataUrl ='/admin/code/code_lookup?rootid=5&multiselect=false';
                colValue = await cmpage.service('admin/code').getNameById(this.rec.c_link);
            }else if(this.rec.c_type === cmpage.enumActAssignType.ROLE){
                dataUrl ='/admin/code/code_lookup?rootid=3&multiselect=false';
                colValue = await cmpage.service('admin/code').getNameById(this.rec.c_link);
            }else if(this.rec.c_type === cmpage.enumActAssignType.TEAM){
                dataUrl ='/admin/code/code_lookup?rootid=7&multiselect=false';
                colValue = await cmpage.service('admin/code').getNameById(this.rec.c_link);
            }else if(this.rec.c_type === cmpage.enumActAssignType.USER){
                dataUrl ='/cmpage/page/lookup?modulename=UserLookup&multiselect=false';
                colValue = await cmpage.service('admin/user').getNameById(this.rec.c_link);
            }
            if(think.isEmpty(dataUrl)){
                input = `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="text" size="${col.c_width}" value="" readonly="readonly" />`;
            }else{
                input =  `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="lookup" size="${col.c_width}" value="${colValue}"
                    data-width="800" data-height="600" data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${dataUrl}" readonly="readonly" />`;
            }
        }else if(col.c_column === 'c_type'){
            input = `<select id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" data-toggle="selectpicker" onchange="return actAssignChangeLink(this,'FwActAssign');">`;
            col.c_default = colValue;
            input += await this.getOptions(col,false);
            input += '</select>';
        }

        return `<div id="field${this.mod.c_modulename + col.c_column}"  class="row-input">${input}</div>`;
    }

    /**
     * 根据模板节点ID和用户属性取该节点的权限，供其他方法调用<br/>
     * @method  getAssignByUser
     * @return {object} 权限对象
     * @params {int} actID  流程模板的节点ID
     * @params {object} user 用户对象
     * @params {int} createrID  发起人ID
     * @params {int} prevUserID  上一步执行者ID
     */
    async getAssignByUser(actID,user,createrID,prevUserID){
        //debug(actID,'act_assign.getAssignByUser - actID');
        //debug(user,'act_assign.getAssignByUser - user');
        let list =await this.getAssignsByActId(actID);
        for(let md of list){
            //if(actID == 19){  debug(md,'act_assign.getAssignByUser - md');     }
            if(md.c_type == cmpage.enumActAssignType.DEPT && md.c_link == user.c_dept ||
                md.c_type == cmpage.enumActAssignType.ROLE && md.c_link == user.c_role ||
                md.c_type == cmpage.enumActAssignType.USER && md.c_link == user.id ||   //特定用户
                md.c_type == cmpage.enumActAssignType.TEAM && await cmpage.service('admin/teamuser').isTeamMember(md.c_link, user.id) ){
                    //debug(md,'act_assign.getAssignByUser - md');
                return md;
            }else if (md.c_type == cmpage.enumActAssignType.SELF) {
                if(md.c_way == cmpage.enumActAssignWay.ALL && createrID == user.id) return md;  //发起人自己
                if(md.c_way == cmpage.enumActAssignWay.MANAGER){                                //发起人的上级主管
                    let tmp = await cmpage.service('admin/user').getUserById(createrID);
                    if(!think.isEmpty(tmp) && tmp.c_manager == user.id)  return md;
                }
            }else if (md.c_type == cmpage.enumActAssignType.PREV) {
                if(md.c_way == cmpage.enumActAssignWay.ALL && prevUserID == user.id) return md;     //上一步执行者
                if(md.c_way == cmpage.enumActAssignWay.MANAGER){                                    //上一步执行者的上级主管
                    let tmp = await cmpage.service('admin/user').getUserById(prevUserID);
                    debug(tmp,'act_assign.getAssignByUser - tmpUser');
                    if(!think.isEmpty(tmp) && tmp.c_manager == user.id)  return md;
                }
            }
        }
        return {};
    }

    /**
     * 根据取流程节点指派记录的ID，取关联人的名称，一般用于页面模块配置中的‘替换’调用: flow/act_assign:getLinkNameById
     * @method  getLinkNameById
     * @return {string}  关联名称
     * @param {int} id  关联ID
     */
    async getLinkNameById(id, linkType){
        let ret ='';
        //debug(id,'act_assign.getLinkNameById - id');
        //debug(linkType,'act_assign.getLinkNameById - linkType');
        if (linkType == cmpage.enumProcAssignType.DEPT || linkType == cmpage.enumProcAssignType.ROLE || linkType == cmpage.enumProcAssignType.TEAM){
            ret = await cmpage.service('admin/code').getNameById(id);
        }else if (linkType == cmpage.enumProcAssignType.USER ){
            ret = await cmpage.service('admin/user').getNameById(id);
        }
        return ret;
    }

    /**
     * 根据ID取活动(流程节点)的指派记录对象，供其他方法调用
     * @method  getAssignById
     * @return {object} 活动(流程节点)参数对象
     * @params {int} id 活动节点ID
     */
    async getAssignById(id){
        let list =await this.getAssigns();
        for(let md of list){
            if(md.id == id){
                return md;
            }
        }
        return {};
    }

    /**
     * 根据ID和模板节点ID取活动(流程节点)的指派记录对象，供其他方法调用<br/>
     * 模板较多的时候，用本方法来改进性能
     * @method  getAssignByActId
     * @return {object} 活动(流程节点)参数对象
     * @params {int} id 活动节点ID
     * @param {int} actID  流程模板的节点ID
     */
    async getAssignByActId(id,actID){
        let list =await this.getAssignsByActId(actID);
        for(let md of list){
            if(md.id == id){
                return md;
            }
        }
        return {};
    }

    /**
     * 取活动节点的指派对象列表，一般用于页面模块配置中的‘替换’调用: flow/act_assign:getAssigns
     * @method  getAssigns
     * @return {Array}  活动节点列表
     */
    async getAssigns(){
        return await think.cache("actAssigns", () => {
            return this.query('select * from fw_act_assign order by id ');
        });
    }
    /**
     * 根据流程模板节点ID取活动节点的指派记录列表，一般用于页面模块配置中的‘替换’调用: flow/act_assign:getAssignsByActId
     * @method  getAssignsByActId
     * @return {Array}  活动节点列表
     * @param {int} actID  流程模板ID
     */
    async getAssignsByActId(actID){
        return await think.cache("actAssigns"+actID, () => {
            return this.query(`select * from fw_act_assign where c_act=${actID} order by id `);
        });
    }

}
