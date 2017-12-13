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
const TaskAct = require('./task_act.js');

module.exports = class extends TaskAct {
    constructor() {
        super();
        this.connStr = 'cmpage';
    }

    /**
     * 运行一个流程实例的活动(流程节点)
     * @method  fwRun
     * @return {object}  任务节点对象
     */
    //async fwRun(isPass){
    //    cmpage.debug(isPass,'task_act.fwRun - isPass');
    //    if(!think.isEmpty(isPass) || await this.canRun() ){
    //        this.taskAct.c_status = cmpage.enumTaskActStatus.RUN;
    //        await this.save();
    //    }
    //    //执行本节点，子类中可以加入其他业务逻辑
    //    if(think.isEmpty(this.act)){
    //        this.act = cmpage.service('flow/act').getActById(this.taskAct.c_act);
    //    }
    //
    //
    //    //结束本节点
    //    await this.fwEnd();
    //}

    /**
     * 取当前节点的业务相关数据，存放于 taskAct.domainData 中 <br/>
     * 子类中可以重写本方法实现具体的取业务数据方法
     * @method  domainGetData
     */
    //async domainGetData(){
    //
    //}

}