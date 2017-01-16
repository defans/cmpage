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
    async getQueryWhere(){
        let where =await super.getQueryWhere();
        return where +' and c_status<>-1';
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit(){
        let md =await super.pageEditInit();
        md.c_user = this.mod.user.id;
        md.c_status = 1192;     //系统参数 -- 工作流参数 -- 业务模块状态 -- 请假状态 -- 待申请
        //c_task 是通过URL参数传过来的，也就是说已经启动了新的流程实例，本新增页面是由流程来调用的
        //当然也可以用常规的‘新增’页面，保存的时候判断如果没有启动流程实例，则启动新的实例，不过这个需要修改流程模板了
        md.c_task = this.mod.parmsUrl.taskID;

        return md
    }

    /**
     * 删除记录,<br/>
     * @method  pageDelete
     * @return {object} 记录对象
     * @param  {object} page 页面对象，包括前端传过来的参数和当前的用户信息等
     */
    async pageDelete(){
        let ret={statusCode:200,message:'删除成功！',data:{}};

        let model = this.model('t_leave');
        let md = await model.where({id:this.mod.recID}).find();
        //删除相应的工作流任务
        await this.query(`update fw_task set c_status=-1 where id=${md.c_task}`);
        await model.where({id: this.mod.recID}).update({c_status:-1});

        return ret;
    }

    /**
     * 编辑页面保存,<br/>
     * 如果是多个表的数据产生的编辑页，则根据存在于this.mod.c_table中的列更新表，一般需要在子类中继承，例如： admin/user:pageSave
     * @method  pageSave
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms){
        await super.pageSave(parms);
        cmpage.debug(this.rec,'leave.pageSave - this.rec');
        if(parms.id ==0 && this.rec.id >0){
            let parmsUrl = JSON.parse(parms.parmsUrl);
            //cmpage.debug(parmsUrl,'leave.pageSave - parmsUrl');
            //增加审核状态
            let appr = {c_link:this.rec.id, c_link_type:'t_leave', c_modulename:'Leave', c_task:this.rec.c_task,
                c_task_act:parmsUrl.taskActID, c_status:this.rec.c_status, c_user:this.mod.user.id, c_time:think.datetime(),c_group:this.mod.user.groupID};
            appr.id = await this.model('t_appr').add(appr);
            //流程实例表中更新关联ID
            if(appr.id >0){
                let taskModel = this.model('flow/task');
                taskModel.task = await taskModel.getTask(this.rec.c_task);
                taskModel.task.c_link = this.rec.id;
                taskModel.task.c_link_type = 't_leave';
                await taskModel.save();
            }
        }
    }

    /**
     * 条件判断，一般供流程节点调用以判断是否可以继续往下执行,<br/>
     * 此处逻辑较简单，可以直接在流程模板的路径节点中设置，本方法是为了演示而写 <br />
     * taskAct.domainData 是t_leave的一条记录
     * @method  isApprLevel3
     * @return {boolean} 是否可以通过
     * @params {object} taskAct 活动节点的实例
     * @params {object} act 活动节点的模板
     * @params {object} user 流程执行人
     */
    async isApprLevel3(taskAct, act, user){
        let rec = taskAct.domainData;
        cmpage.debug(taskAct.domainData,'leave.isApprLevel3 - taskAct.domainData');
        if(!think.isEmpty(rec)){
            return rec.c_days >3;
        }
        return false;
    }

    /**
     * 修改记录的状态,<br/>
     * 一般供 appr.js 调用
     * @method  updateStatus
     * @return {object} 记录对象
     * @param  {object} apprMd t_appr的记录对象
     */
    async updateStatus(apprMd){
        debug(apprMd,'leave.updateStatus - apprMd');
        let md = {c_status:apprMd.c_status};
        if(apprMd.c_status == 1195){
            md.c_person_appr = apprMd.c_user;
            md.c_time_appr = apprMd.c_time;
        }
        await this.model('t_leave').where({id:apprMd.c_link}).update(md);
    }

    /**
     * 销假动作，供流程节点调用，执行成功后继续往下执行,<br/>
     * @method  finishLeave
     * @return {boolean} 是否可以通过
     * @params {object} taskAct 活动节点的实例
     * @params {object} act 活动节点的模板
     * @params {object} user 流程执行人
     */
    async finishLeave(taskAct, user){
        let rec = taskAct.domainData;
        debug(taskAct.domainData,'leave.finishLeave - taskAct.domainData');
        if(!think.isEmpty(rec)){
            if(cmpage.datetime(rec.c_time_end) < cmpage.datetime() && taskAct.c_domain_st >0){
                //增加状态记录
                let md ={};
                md.c_status = taskAct.c_domain_st;
                md.c_task = taskAct.c_task;
                md.c_link = taskAct.task_link;
                md.c_link_type = taskAct.task_link_type;
                md.c_task_act = taskAct.id;
                md.c_user = user.id;
                md.c_time = think.datetime();
                md.c_group = user.groupID;
                md.id = await this.model('t_appr').add(md);
                await this.updateStatus(md);
                return true;
            }
        }
        return false;
    }

    /**
     * 终止动作，供流程终止时调用，名称固定 <br/>
     * @method  fwTerminate
     * @params {object} task 流程实例对象
     * @params {object} user 流程执行人
     */
    async fwTerminate(task, user){
        debug(task,'leave.fwTerminate - task');
        if(!think.isEmpty(task) && task.c_link >0){
            //增加状态记录
            let md ={};
            md.c_status = 1199;
            md.c_task = task.id;
            md.c_link = task.c_link;
            md.c_link_type = task.c_link_type;
            md.c_task_act = 0;
            md.c_user = user.id;
            md.c_time = think.datetime();
            md.c_group = user.groupID;
            md.id = await this.model('t_appr').add(md);
            await this.updateStatus(md);
        }
    }

    ///**
    // * 生成列表每一行的内容
    // */
    //async mobHtmlGetListRow(row,pageCols) {
    //    return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
    //            <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label> </p>
    //            <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    //}

    /**
     * 取流程节点相关的按钮设置，组合按钮的HTML输出</br>
     * @method  htmlGetActBtns
     * @return {string} HTML页面片段
     */
    async htmlGetTaskActBtns(rec) {
        //debug(rec,'leave.htmlGetActBtns - rec');
        if(rec.hasOwnProperty('id') && rec.c_status !== 1197){
            return await super.htmlGetTaskActBtns(rec);
        }else{
            return '';      //如果是新增页面，则不显示流程按钮
        }
    }


}
