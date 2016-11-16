'use strict';

/**
 * 提供工作流模板设计的URL接口<br/>
 * 提供工作流引擎的URL调用接口
 * @class flow.controller.task
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 启动一个新的流程实例, GET调用：/flow/task/start?procID=xxx
     * @method  start
     * @return {json}  流程实例对象
     */
    async startAction(){
        let procID = this.get('procID');
        let ret = {statusCode:300,message:'流程模板不存在或设置有错误!',task:{}};

        let procModel = this.model('proc');
        await procModel.fwInit(0,await this.session('user'),procID);
        await procModel.fwStart();

        let task = procModel.taskModel.task;
        let currAct = procModel.taskModel.currAct;
        let currTaskAct = procModel.taskModel.currTaskAct;
        if(think.isEmpty(task) || task.id ===0){
//            ret.message = task.message;
            return this.json(ret);
        }
        let utilsModel = this.model('cmpage/utils');
        ret = {statusCode:200,message:`流程已经${await utilsModel.getEnumName(task.c_status,'TaskStatus')}!`,task:task, currAct:currAct, currTaskAct:currTaskAct};
        if(task.c_status === global.enumTaskStatus.RUN){
            ret.message = `当前节点:${await this.model('act').getNameById(currAct.id)},
                            状态${await utilsModel.getEnumName(currAct.c_status,'TaskActStatus')}`;
            if(currTaskAct.c_status === global.enumTaskActStatus.WAIT && !think.isEmpty(currAct.c_form)){
                //根据设定弹出相关界面
                debug(currAct,'c:task.start - currAct - 弹出界面');
                currAct.form =eval("("+ currAct.c_form +")");  // JSON.parse(currAct.c_form);
                if(!think.isEmpty(currAct.form['modulename'])){
                    currAct.form.url = `/cmpage/page/edit?modulename=${currAct.form['modulename']}&id=0&taskID=${task.id}&taskActID=${currTaskAct.id}&status=${currAct.c_domain_st}`;
                }
                currAct.form.url = currAct.form.url.replace(/#taskID#/g,task.id).replace(/#taskActID#/g,currAct.id);
                currAct.form.opentype = think.isEmpty(currAct.form['opentype']) ? 'dialog':currAct.form['opentype'];
                currAct.form.id = think.isEmpty(currAct.form['id']) ? 'fwTaskAct'+currAct.id:currAct.form['id'];
                currAct.form.title = think.isEmpty(currAct.form['title']) ? currAct.c_name:currAct.form['title'];
                currAct.form.height = think.isEmpty(currAct.form['height']) ? 400:currAct.form['height'];
                currAct.form.mask = true;
                ret.task = task;
                ret.currAct = currAct;
            }
        }

        //TODO: 根据任务的当前状态分别处理,其他的让前端处理

        return this.json(ret);
    }

    /**
     * 重新运行一个流程实例, GET调用：/flow/task/run?task_id=xxx
     * @method  run
     * @return {json}  流程实例对象
     */
    async runAction(){
        let user = await this.session('user');
        let taskID = this.get('taskID');
        let procModel = this.model('proc');
        await procModel.fwInit(procID,await this.session('user'));

        let task = await this.model('proc').fwRun(taskID,user);

        return this.json({statusCode:200,message:'流程重新运行成功!',task:task});
    }

    /**
     * 挂起一个流程实例, GET调用：/flow/task/suspend?task_id=xxx
     * @method  suspend
     * @return {json}  流程实例对象
     */
    async suspendAction(){
        let user = await this.session('user');
        let taskID = this.get('taskID');

        let task = await this.model('proc').fwSuspend(taskID,user);

        return this.json({statusCode:200,message:'流程已成功挂起!',task:task});
    }

    /**
     * 终止一个流程实例, GET调用：/flow/task/terminate?task_id=xxx
     * @method  terminate
     * @return {json}  流程实例对象
     */
    async terminateAction(){
        let user = await this.session('user');
        let taskID = this.get('taskID');

        let task = await this.model('proc').fwTerminate(taskID,user);

        return this.json({statusCode:200,message:'流程已成功终止!',task:task});
    }

    /**
     * 自动执行, GET调用：/flow/task/auto_exec
     * @method  autoExec
     * @return {json}  状态消息
     */
    async autoExecAction(){
        if(!flow.autoExecuting){
            flow.autoExecuting =true;
            await this.model('act').fwAutoExec();
            flow.autoExecuting =false;
            return this.json({statusCode:200,message:'流程的自动执行操作成功!'});
        }
        return this.json({statusCode:200,message:'流程正在自动执行中......'});
    }

    flowAction(){
        let parms = this.get();
        this.assign('parms',parms);
        return this.display();
    }

    async flowMapAction(){
        let taskID = this.get("taskID");
        let flowMap = await this.model('task').getFlowMap(taskID);
        this.assign('flowMap',flowMap);

        return this.display();
    }
}