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
        let parmsUrl =JSON.parse(this.mod.parmsUrl);
        md.c_user = this.mod.user.id;
        md.c_status = 1192;     //系统参数 -- 工作流参数 -- 业务模块状态 -- 请假状态 -- 待申请
        //c_task 是通过URL参数传过来的，也就是说已经启动了新的流程实例，本新增页面是由流程来调用的
        //当然也可以用常规的‘新增’页面，保存的时候判断如果没有启动流程实例，则启动新的实例，不过这个需要修改流程模板了
        md.c_task = parmsUrl.taskID;

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
        global.debug(this.rec,'leave.pageSave - this.rec');
        if(parms.id ==0 && this.rec.id >0){
            let parmsUrl = JSON.parse(parms.parmsUrl);
            //global.debug(parmsUrl,'leave.pageSave - parmsUrl');
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
     * 编辑页面保存,<br/>
     * 如果是多个表的数据产生的编辑页，则根据存在于this.mod.c_table中的列更新表，一般需要在子类中继承，例如： admin/user:pageSave
     * @method  updateStatus
     * @return {object} 记录对象
     * @param  {int} id 记录ID
     * @param  {int} status 状态ID,一般在t_code表中设置
     */
    async updateStatus(id,status){
        await this.model('t_leave').where({id:id}).update({c_status:status});
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
        global.debug(taskAct.domainData,'leave.isApprLevel3 - taskAct.domainData');
        if(!think.isEmpty(rec)){
            return rec.c_days >3;
        }
        return false;
    }

    ///**
    // * 生成列表每一行的内容
    // */
    //async mobHtmlGetListRow(row,pageCols) {
    //    return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
    //            <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label> </p>
    //            <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    //}



}
