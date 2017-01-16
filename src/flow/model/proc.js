'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供工作流控制的相关方法，对外提供统一归口的调用<br/>
 * 根据流程模板中的实现类设置，调用具体业务相关的类来实现具体功能
 * @class flow.model.proc
 */
export default class extends think.model.base {
    taskModel = null;   //当前流程实例的对象

    /**
     * 开始一个新的流程实例</br>
     * 调用前先初始化 fwInit
     * @method  fwStart
     * @return {object}  流程实例对象
     * @params {int} procID 流程模板ID
     * @params {object} [user] 流程发起人
     */
    async fwStart(procID,user){
        if(think.isEmpty(this.taskModel)){
            await this.fwInit(0,user,procID);
        }
        if(!think.isEmpty(this.taskModel)){
            await this.taskModel.fwStart();
            cmpage.debug(this.taskModel.task,'proc.fwStart --- this.taskModel.task');
            if(!think.isEmpty(this.taskModel.task)){
                //取当前节点
                await this.taskModel.getTaskWithCurrentAct();
                cmpage.debug(this.taskModel.currAct,'proc.fwStart - taskModel.currAct');
            }
        }
    }

    /**
     * 运行一个流程实例(任务)
     * @method  fwRun
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwRun(taskID,user){
        if(think.isEmpty(this.taskModel)){
            await this.fwInit(taskID,user);
        }
        await this.taskModel.fwRun();
    }

    /**
     * 挂起一个流程实例(任务)
     * @method  fwSuspend
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwSuspend(taskID,user){
        if(think.isEmpty(this.taskModel)){
            await this.fwInit(taskID,user);
        }
        await this.taskModel.fwSuspend();
    }

    /**
     * 终止一个流程实例(任务)
     * @method  fwTerminate
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwTerminate(taskID,user){
        if(think.isEmpty(this.taskModel)){
            await this.fwInit(taskID,user);
        }
        await this.taskModel.fwTerminate();
    }

    /**
     * 正常结束一个流程实例(任务)
     * @method  fwEnd
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwEnd(taskID,user){
        if(think.isEmpty(this.taskModel)){
            await this.fwInit(taskID,user);
        }
        await this.taskModel.fwEnd();
    }

    /**
     * 取流程模板的参数，供其他方法调用
     * @method  fwGetActParms
     * @return {Array} 其他方法调用的参数列表
     * @params {int} taskID 模板实例（任务）ID
     * @params {object} user 流程执行人
     * @params {int} [procID] 模板ID,当 taskID===0 时，取procID的值
     */
    async fwInit(taskID,user,procID){
        let task = taskID >0 ? await this.model('fw_task').where({id:taskID}).find() : {};
        let proc = await this.getProcById(taskID >0 ? task.c_proc : procID);
        this.taskModel = this.model(think.isEmpty(proc.c_class) ? 'flow/task' : proc.c_class);
        this.taskModel.proc = proc;
        this.taskModel.task = task;
        this.taskModel.user = think.isEmpty(user) ? await think.session('user') : user;
    }

    /**
     * 根据ID取流程模板的设置，供其他方法调用，子类不需要重写
     * @method  getActById
     * @return {object} 流程模板对象
     * @params {int} id 流程模板ID
     */
    async getProcById(id){
        let list =await this.getProcs();
        for(let md of list){
            if(md.id == id){
                return md;
            }
        }
        return {};
    }

    /**
     * 根据ID取流程模板的名称，一般用于页面模块配置中的‘替换’调用: flow/proc:getNameById
     * @method  getNameById
     * @return {string}  模板名称
     * @param {int} id  模板ID
     */
    async getNameById(id){
        let list =await this.getProcs();
        for(let md of list){
            if(md.id == id){
                return md.c_name;
            }
        }
        return '';
    }
    async getProcs(){
        return await think.cache("procProcs", () => {
            return this.query('select id,c_name,c_desc,c_type,c_class,c_no_format,c_way_create,c_time_from,c_time_to,c_status,' +
                'c_user,c_time,c_group,c_link_model,c_link_type,c_act_start  from fw_proc  where c_status=0 order by id');
        });
    }

    async clearCache(){
        let procs = await this.query('select id from fw_proc where c_status=0 ');
        for(let proc of procs){
            await think.cache(`procActs${proc.id}`,null);
            await think.cache(`procActPaths${proc.id}`,null);
            await think.cache(`procAssigns${proc.id}`,null);
        }
        let acts = await this.query('select id from fw_act where c_status=0 ');
        for(let act of acts){
            await think.cache(`actAssigns${act.id}`,null);
        }

        await think.cache('procProcs', null);
        await think.cache('procActs', null);
        await think.cache('procActPaths', null);
        await think.cache('procAssigns', null);
        await think.cache('actAssigns', null);
    }


}
