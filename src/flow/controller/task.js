'use strict';

/**
 * 提供工作流模板设计的URL接口<br/>
 * 提供工作流引擎的URL调用接口
 * @class flow.controller.proc
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 启动一个新的流程实例, GET调用：/flow/proc/start?proc_id=xxx
     * @method  start
     * @return {json}  流程实例对象
     */
    async startAction(){
        let user = await think.session('user');
        let procID = this.get('proc_id');

        let task = await this.model('proc').fwStart(procID,user);

        //根据任务的当前状态分别处理

        return this.json({statusCode:200,message:'流程启动成功!',task:task});
    }

    /**
     * 重新运行一个流程实例, GET调用：/flow/proc/run?task_id=xxx
     * @method  run
     * @return {json}  流程实例对象
     */
    async runAction(){
        let user = await think.session('user');
        let taskID = this.get('task_id');

        let task = await this.model('proc').fwRun(taskID,user);

        return this.json({statusCode:200,message:'流程启动成功!',task:task});
}

    /**
     * 挂起一个流程实例, GET调用：/flow/proc/suspend?task_id=xxx
     * @method  suspend
     * @return {json}  流程实例对象
     */
    async suspendAction(){
        let user = await think.session('user');
        let taskID = this.get('task_id');

        let task = await this.model('proc').fwSuspend(taskID,user);

        return this.json({statusCode:200,message:'流程启动成功!',task:task});
    }

    /**
     * 终止一个流程实例, GET调用：/flow/proc/terminate?task_id=xxx
     * @method  terminate
     * @return {json}  流程实例对象
     */
    async terminateAction(){
        let user = await think.session('user');
        let taskID = this.get('task_id');

        let task = await this.model('proc').fwTerminate(taskID,user);

        return this.json({statusCode:200,message:'流程启动成功!',task:task});
    }

}