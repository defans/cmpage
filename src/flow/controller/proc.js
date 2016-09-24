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


    /**
     * 流程模板的图形和活动节点的设置
     */
    async designAction(){
        let page = await global.model('cmpage/module').getModuleByName('FwProcList');
        page.parmsUrl = JSON.stringify(this.get());
        page.editID = this.get("id");
        page.user = await this.session('user');
        //global.debug(page);
        let model = this.model('proc_list');
        let procEditHtml =await model.htmlGetEdit(page);
        this.assign('procEditHtml',procEditHtml);
        this.assign('page',model.getPageOther(page));

        let pageAct = await global.model('cmpage/module').getModuleByName('FwAct');
        pageAct.parmsUrl= '{}';
        pageAct.editID =0;
        pageAct.user = page.user;
        let actEditHtml = await this.model('cmpage/page').htmlGetEdit(pageAct);
        this.assign('actEditHtml','<tbody>'+actEditHtml+'</tbody>');

        let flowMap = await model.getFlowMap(page.editID);
        this.assign('flowMap',flowMap);

        return this.display();
    }
    /**
     * 图形化设置流程模板， 调用： /flow/proc/desing
     * @method  design
     * @return {promise}
     */
    async flowMapAction(){
        let procID = this.get("proc_id");
        let flowMap = await this.model('proc_list').getFlowMap(procID);
        this.assign('flowMap',flowMap);
        this.assign('procID',procID)

        return this.display();
    }

    /**
     * 保存流程模板的图形信息，如果某个节点和路径的data_id==0，则增加相应记录 POST调用： /flow/proc/save_map
     * @method  saveMap
     * @return {json}
     */
    async saveMapAction(){
        let parms =this.post();
        await this.model('proc_list').saveFlowMap(parms);

        return this.json({statusCode:200,message:'保存图形成功!'});
    }

}