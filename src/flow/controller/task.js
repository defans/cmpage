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
        let user = await this.session('user');
        let procID = this.get('proc_id');
        let ret = {statusCode:300,message:'流程模板不存在或设置有错误!',task:{}};

        let task = await this.model('proc').fwStart(procID,user);
        if(task.id ===0){
            ret.message = task.message;
            return this.json(ret);
        }
        let utilsModel = this.model('cmpage/utils');
        ret = {statusCode:200,message:`流程已经${await utilsModel.getEnumName(task.c_status,'TaskStatus')}!`,task:task};
        if(task.c_status === global.enumTaskStatus.RUN){
            ret.message = `当前节点:${await this.model('act').getNameById(task.currAct.c_act)},
                            状态${await utilsModel.getEnumName(task.currAct.c_status,'TaskActStatus')}`;
            if(task.currAct.c_status === global.enumTaskActStatus.WAIT){
                //根据设定弹出相关界面
                if(task.currAct.form['modulename']){
                    task.currAct.form.url = `/cmpage/page/list?modulename=${task.currAct.form['modulename']}`;
                }
                task.currAct.form.opentype = think.isEmpty(task.currAct.form['opentype']) ? 'dialog':task.currAct.form['opentype'];
                task.currAct.form.id = think.isEmpty(task.currAct.form['id']) ? 'fwTaskAct'+task.currAct.id:task.currAct.form['id'];
                task.currAct.form.title = think.isEmpty(task.currAct.form['title']) ? task.currAct.c_name:task.currAct.form['title'];
            }
        }

        //TODO: 根据任务的当前状态分别处理,其他的让前端处理

        return this.json(ret);
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

        return this.json({statusCode:200,message:'流程重新运行成功!',task:task});
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

        return this.json({statusCode:200,message:'流程已成功挂起!',task:task});
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

        return this.json({statusCode:200,message:'流程已成功终止!',task:task});
    }

}