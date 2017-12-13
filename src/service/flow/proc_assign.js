'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供工作流指派及权限处理的相关方法，对外提供统一归口的调用<br/>
 * @class flow.model.proc_assign
 */
const CMPage = require('../cmpage/page_mob.js');

module.exports = class extends CMPage {
    constructor() {
        super();
        this.connStr = 'cmpage';
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit() {
        let md = await super.pageEditInit();
        debug(this.mod.parmsUrl, 'proc_assign.pageEditInit - this.mod.parmsUrl');
        md.c_type = cmpage.enumProcAssignType.ALL; //默认是所有人
        md.c_proc = this.mod.parmsUrl.c_proc;

        debug(md, 'proc_assign.pageEditInit - md');
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
    async htmlGetEditInput(col, colValue, input) {
        let html = '';
        //增加模块编辑页面的操作逻辑，也可以配合页面js方法
        if (col.c_column === 'link_name') {
            let dataUrl = '';
            if (this.rec.c_type === cmpage.enumProcAssignType.DEPT) {
                dataUrl = '/admin/code/code_lookup?rootid=5&multiselect=false';
                colValue = await cmpage.service('admin/code').getNameById(this.rec.c_link);
            } else if (this.rec.c_type === cmpage.enumProcAssignType.ROLE) {
                dataUrl = '/admin/code/code_lookup?rootid=3&multiselect=false';
                colValue = await cmpage.service('admin/code').getNameById(this.rec.c_link);
            } else if (this.rec.c_type === cmpage.enumProcAssignType.TEAM) {
                dataUrl = '/admin/code/code_lookup?rootid=7&multiselect=false';
                colValue = await cmpage.service('admin/code').getNameById(this.rec.c_link);
            } else if (this.rec.c_type === cmpage.enumProcAssignType.USER) {
                dataUrl = '/cmpage/page/lookup?modulename=UserLookup&multiselect=false';
                colValue = await cmpage.service('admin/user').getNameById(this.rec.c_link);
            }
            if (think.isEmpty(dataUrl)) {
                input = `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="text" size="${col.c_width}" value="" readonly="readonly" />`;
            } else {
                input = `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="lookup" size="${col.c_width}" value="${colValue}"
                    data-width="800" data-height="600" data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${dataUrl}" readonly="readonly" />`;
            }
        } else if (col.c_column === 'c_type') {
            input = `<select id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" data-toggle="selectpicker" onchange="return actAssignChangeLink(this,'FwProcAssign');">`;
            col.c_default = colValue;
            input += await this.getOptions(col, false);
            input += '</select>';
        }

        return `<div id="field${this.mod.c_modulename + col.c_column}"  class="row-input">${input}</div>`;
    }


    /**
     * 根据模板ID和用户属性取该流程的按钮权限，供其他方法调用<br/>
     * @method  getAssignByUser
     * @return {object} 权限对象
     * @params {int} procID  流程模板ID
     * @params {object} user 用户对象
     */
    async getAssignByUser(procID, user) {
        let list = await this.getAssignsByProcId(procID);
        for (let md of list) {
            if (md.c_type === cmpage.enumProcAssignType.DEPT && md.c_link === user.c_dept ||
                md.c_type === cmpage.enumProcAssignType.ROLE && md.c_link === user.c_role ||
                md.c_type === cmpage.enumProcAssignType.USER && md.c_link === user.id ||
                md.c_type === cmpage.enumProcAssignType.TEAM && await cmpage.service('admin/teamuser').isTeamMember(md.c_link, user.id)) {
                return md;
            }
        }
        return {};
    }

    /**
     * 根据取流程指派记录的ID，取关联人的名称，一般用于页面模块配置中的‘替换’调用: flow/proc_assign:getLinkNameById
     * @method  getLinkNameById
     * @return {string}  模板名称
     * @param {int} id  模板ID
     */
    async getLinkNameById(id) {
        let md = await this.getAssignById(id);
        let ret = '';
        if (md.c_type === cmpage.enumProcAssignType.DEPT || md.c_type === cmpage.enumProcAssignType.ROLE || md.c_type === cmpage.enumProcAssignType.TEAM) {
            ret = await cmpage.service('admin/code').getNameById(md.c_link);
        } else if (md.c_type === cmpage.enumProcAssignType.USER) {
            ret = await cmpage.service('admin/user').getNameById(md.c_link);
        }
        return ret;
    }

    /**
     * 根据ID取任务的指派记录对象，供其他方法调用
     * @method  getAssignById
     * @return {object} 活动(流程节点)参数对象
     * @params {int} id 活动节点ID
     */
    async getAssignById(id) {
        let list = await this.getAssigns();
        for (let md of list) {
            if (md.id === id) {
                return md;
            }
        }
        return {};
    }

    /**
     * 根据ID和模板ID取任务的指派记录对象，供其他方法调用<br/>
     * 模板较多的时候，用本方法来改进性能
     * @method  getAssignByProcId
     * @return {object} 活动(流程节点)参数对象
     * @params {int} id 活动节点ID
     * @param {int} procID  流程模板ID
     */
    async getAssignByProcId(id, procID) {
        let list = await this.getAssignsByProcId(procID);
        for (let md of list) {
            if (md.id === id) {
                return md;
            }
        }
        return {};
    }

    /**
     * 取任务的指派记录列表，一般用于页面模块配置中的‘替换’调用: flow/proc_assign:getAssigns
     * @method  getAssigns
     * @return {Array}  活动节点列表
     */
    async getAssigns() {
        return await think.cache("procAssigns", () => {
            return this.query('select * from fw_proc_assign order by id ');
        });
    }
    /**
     * 根据流程模板ID取任务的指派记录列表，一般用于页面模块配置中的‘替换’调用: flow/proc_assign:getAssignsByProcId
     * @method  getAssignsByProcId
     * @return {Array}  活动节点列表
     * @param {int} procID  流程模板ID
     */
    async getAssignsByProcId(procID) {
        return await think.cache("procAssigns" + procID, () => {
            return this.query(`select * from fw_proc_assign where c_proc=${procID} order by id `);
        });
    }

}