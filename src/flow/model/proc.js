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
    /**
     * 一个新的流程实例
     * @method  fwStart
     * @return {object}  流程实例对象
     * @params {int} procID 流程模板ID
     * @params {object} [user] 流程发起人
     */
    async fwStart(procID,user){
        if(think.isEmpty(user)){
            user = await think.session('user');
        }
        let proc =await this.getProcById(procID);

        //console.log(proc);
        if(think.isEmpty(proc)){
            return {id:0, message:'流程模板不存在或设置有错误!'};
        }

        let taskModel = this.model(proc.c_class);

        let task = await taskModel.fwStart(proc,user);
        global.debug(task,'proc.fwStart --- task');
        if(think.isEmpty(task)){
            return {id:0, message:'启动新任务失败!'};
        }

        //取当前节点
        task = await taskModel.getTaskWithCurrentAct(task,user);

        return task;

    }

    /**
     * 运行一个流程实例(任务)
     * @method  fwRun
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwRun(taskID,user){
        let parms = await this.fwGetProcParms(taskID,user);
        let taskModel = this.model(parms[1].c_class);
        return await taskModel.fwRun(...parms);
    }

    /**
     * 挂起一个流程实例(任务)
     * @method  fwSuspend
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwSuspend(taskID,user){
        let parms = await this.fwGetProcParms(taskID,user);
        let taskModel = this.model(parms[1].c_class);
        return await taskModel.fwSuspend(...parms);
    }

    /**
     * 终止一个流程实例(任务)
     * @method  fwTerminate
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwTerminate(taskID,user){
        let parms = await this.fwGetProcParms(taskID,user);
        let taskModel = this.model(parms[1].c_class);
        return await taskModel.fwTerminate(...parms);
    }

    /**
     * 正常结束一个流程实例(任务)
     * @method  fwEnd
     * @return {object}  流程实例对象
     * @params {int} taskID 任务对象ID
     * @params {object} user 流程执行人
     */
    async fwEnd(taskID,user){
        let parms = await this.fwGetProcParms(taskID,user);
        let taskModel = this.model(parms[1].c_class);
        return await taskModel.fwEnd(...parms);
    }

    /**
     * 取流程模板的参数，供其他方法调用
     * @method  fwGetActParms
     * @return {Array} 其他方法调用的参数列表
     * @params {int} taskID 模板实例（任务）ID
     * @params {object} user 流程执行人
     */
    async fwGetProcParms(taskID,user){
        if(think.isEmpty(user)){
            user = await think.session('user');
        }
        let task = this.model('fw_task').where({id:taskID}).find();
        let proc =await this.getProcById(task.c_proc);

        return [task,proc,user];
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
            return this.query('select id,c_name,c_desc,c_type,c_class,c_no_format,c_way_create,c_time_from,c_time_to,c_status,c_user,c_time,c_group  ' +
                'from fw_proc  where c_status=0 order by id');
        });
    }

    async clearCache(){
        let procs = await this.query('select id from fw_proc where c_status=0 ');
        for(let proc of procs){
            await think.cache(`procActs${proc.id}`,null);
            await think.cache(`procActPaths${proc.id}`,null);
        }
        await think.cache('procProcs', null);
    }

}
