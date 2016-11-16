'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


import CMPage from '../../cmpage/model/page_mob.js';

export default class extends CMPage {
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
        let parmsUrl =JSON.parse(this.mod.parmsUrl);

        let task = await model('flow/task').getTask(parmsUrl.taskID);
        md.c_status = parmsUrl.status;
        md.c_task = parmsUrl.taskID;
        md.c_link = task.c_link;
        md.c_link_type = task.c_link_type;
        md.c_task_act = parmsUrl.taskActID;
        //md.c_modulename 暂时不需要

        return md
    }

    /**
     * 编辑页面保存,<br/>
     * 保存后需要更新关联对象的状态
     * @method  pageSave
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms){
        await super.pageSave(parms);
        debug(this.rec,'appr.pageSave - this.rec');
        if(this.rec.id >0){
            let task = await this.model('flow/task').getTask(this.rec.c_task);
            let proc = await this.model('flow/proc').getProcById(task.c_proc);
            debug(proc,'appr.pageSave - proc');
            let linkModel = global.model(proc.c_link_model);
            if(linkModel){
                //更新关联对象的状态
                await linkModel.updateStatus(this.rec.c_link,this.rec.c_status);
                //当前流程节点继续往下执行
                let parmsUrl = JSON.parse(parms.parmsUrl);
                await model('flow/act').fwRun(parmsUrl.taskActID, this.mod.user, null,true);
            }
        }
    }

    /**
     * 增加审核状态记录,<br/>
     * 增加后需要更新关联对象的状态
     * @method  addStatus
     * @param  {object} taskAct 任务节点对象
     * @param  {object} act 流程模板节点对象
     * @param  {object} user 当前用户对象
     */
    async addStatus(taskAct,act,user){
        let md ={};
        let task = await model('flow/task').getTask(taskAct.c_task);
        debug(task,'appr.addStatus - task');
        md.c_status = act.c_domain_st;
        md.c_task = task.id;
        md.c_link = task.c_link;
        md.c_link_type = task.c_link_type;
        md.c_task_act = taskAct.id;
        md.c_user = user.id;
        md.c_time = think.datetime();
        md.c_group = user.groupID;
        await this.model('t_appr').add(md);

        let proc = await this.model('flow/proc').getProcById(task.c_proc);
        debug(proc,'appr.addStatus - proc');
        let linkModel = global.model(proc.c_link_model);
        if(linkModel){
            //更新关联对象的状态
            await linkModel.updateStatus(md.c_link, md.c_status);
        }
    }


}
