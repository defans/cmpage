'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供审核类工作流的活动节点运转的相关方法，业务相关，供flow/model/act.js的方法进行调用，在act配置的时候可以设置<br/>
 * 具体的业务相关的工作流活动的子类也可以继承本类，来增加定制的业务逻辑
 * @class flow.model.task_act_appr
 */
export default class extends think.model.base {

    /**
     * 运行一个流程实例的活动(流程节点)
     * @method  fwRun
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async fwRun(taskAct,act,user){
        if(await this.canRun(taskAct,act,user)){
            taskAct.c_status = global.enumTaskActStatus.RUN;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);

            //如果有状态设置，一般会弹出FORM填写批示等
            //if(act.c_domain_st >0){
            //    let appr = {}
            //}cd

            //结束本节点
            await this.fwEnd(taskAct,act,user);
        }

        return taskAct;
    }

    /**
     * 取当前节点的业务相关数据，存放于 taskAct.domainData 中 <br/>
     * 子类中可以重写本方法实现具体的取业务数据方法
     * @method  domainGetData
     * @return {object}  增加业务对象数据后的节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async domainGetData(taskAct,act,user){
        let dta = taskAct;
        dta.domainData = {id:0};
        dta.link =  await this.model(dta.c_link_type).where({id:dta.c_link}).find();        //t_appr, 二级连接
        if(dta.link){
            let link = dta.link;
            dta.domainData = await this.model(link.c_link_type).where({id:link.c_link}).find();     //例如： t_leave
        }

        return dta;
    }
}
