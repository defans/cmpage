'use strict';

/**
 * 提供工作流模板设计的URL接口<br/>
 * 提供工作流引擎的URL调用接口
 * @class flow.controller.task_act
 */
import Base from './base.js';

export default class extends Base {

    /**
     * 重新运行一个流程实例的某个节点, GET调用：/flow/task_act/run?taskActID=xxx
     * @method  run
     * @return {json}  流程实例对象
     */
    async runAction(){
        let isPass = !think.isEmpty(this.get('isPass'));
        await this.model('act').fwRun(this.get('taskActID'),await this.session('user'),null, isPass);
        return this.json({statusCode:200,message:'本次操作成功!'});
    }

    /**
     * 挂起一个流程实例, GET调用：/flow/proc/suspend?taskActID=xxx
     * @method  suspend
     * @return {json}  流程实例对象
     */
    async suspendAction(){
        await this.model('act').fwSuspend(this.get('taskActID'),await this.session('user') );
        return this.json({statusCode:200,message:'本次操作已成功挂起!'});
    }

    /**
     * 终止一个流程实例, GET调用：/flow/proc/terminate?taskActID=xxx
     * @method  terminate
     * @return {json}  流程实例对象
     */
    async terminateAction(){
        await this.model('act').fwTerminate(this.get('taskActID'),await this.session('user') );
        return this.json({statusCode:200,message:'本次操作已成功终止!'});
    }

}