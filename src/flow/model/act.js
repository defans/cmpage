'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
 流程模板配置和引擎调用接口的逻辑实现类

 注意点 :
 1. 工作流方法调用统一归口到proc.js 和 act.js ;
 2. 根据流程模板设置的实现类，proc.js 和 act.js 会调用该类
 3. 具体的业务逻辑实现类可以继承并扩展 task.js 和 task_act.js等 来实现增加标准以外的业务逻辑
 4. 可以根据具体的业务模块选择适当基类，例如审核类:flow/model/task_act_appr.js
 5. 原则上：业务无关的流程控制逻辑放于 proc.js 和 act.js ，业务相关的流程控制放于task_xxx.js 中

 @module flow.model
 */

/**
 * 提供工作流的活动节点运转的相关方法，对外提供统一归口的调用<br/>
 * 根据活动节点中的实现类设置，调用具体业务相关的类来实现节点的具体功能
 * @class flow.model.act
 */
export default class extends think.model.base {
    taskActModel = null;    //当前任务节点的实例对象

    /**
     * 是否可以运行一个活动(流程节点)，对外提供调用
     * @method  canRun
     * @return {bool}  判断值
     * @params {int} taskActID 活动节点ID
     * @params {object} user 流程执行人
     * @params {object} [taskAct] 活动节点对象
     */
    async canRun(taskActID,user,taskAct){
        if(think.isEmpty(this.taskActModel)){
            await this.fwInit(taskActID,user,taskAct);
        }
        return await this.taskActModel.canRun();
    }

    /**
     * 运行一个活动(流程节点)<br/>
     * canRun的判断在具体的业务task_act中调用
     * @method  fwRun
     * @params {int} taskActID 活动节点ID
     * @params {object} user 流程执行人
     * @params {object} [taskAct] 活动节点对象
     */
    async fwRun(taskActID,user,taskAct,isPass){
        if(think.isEmpty(this.taskActModel)){
            await this.fwInit(taskActID,user,taskAct);
            //global.debug(this.taskActModel.taskAct,'act.fwRun - this.taskActModel.taskAct');
        }
        await this.taskActModel.fwRun(isPass);
    }

    /**
     * 挂起一个活动(流程节点)，
     * @method  fwSuspend
     * @params {int} taskActID 活动节点ID
     * @params {object} user 流程执行人
     * @params {object} [taskAct] 活动节点对象
     */
    async fwSuspend(taskActID,user,taskAct){
        if(think.isEmpty(this.taskActModel)){
            await this.fwInit(taskActID,user,taskAct);
        }
        await this.taskActModel.fwSuspend();
    }

    /**
     * 终止一个活动(流程节点)，
     * @method  fwTerminate
     * @params {int} taskActID 活动节点ID
     * @params {object} user 流程执行人
     * @params {object} [taskAct] 活动节点对象
     */
    async fwTerminate(taskActID,user,taskAct){
        if(think.isEmpty(this.taskActModel)){
            await this.fwInit(taskActID,user,taskAct);
        }

        await this.taskActModel.fwTerminate();
    }

    /**
     * 正常结束一个活动(流程节点)，
     * @method  fwEnd
     * @params {int} taskActID 活动节点ID
     * @params {object} user 流程执行人
     * @params {object} [taskAct] 活动节点对象
     */
    async fwEnd(taskActID,user,taskAct){
        if(think.isEmpty(this.taskActModel)){
            await this.fwInit(taskActID,user,taskAct);
        }

        await this.taskActModel.fwEnd();
    }

    /**
     * 取活动(流程节点)参数，供其他方法调用
     * @method  fwGetActParms
     * @params {int} actID 活动节点ID
     * @params {object} user 流程执行人
     * @params {object} [taskAct] 活动节点对象
     */
    async fwInit(taskActID,user,taskAct){
        taskAct = think.isEmpty(taskAct) ? await this.model('vw_task_act').where({id:taskActID}).find() : taskAct;
        global.debug(taskAct,'act.fwInit - taskAct');
        let act =await this.getActByIdAndProcId(taskAct.c_act, taskAct.c_proc);
        global.debug(act,'act.fwInit - act');
        this.taskActModel = this.model(think.isEmpty(act.c_class) ? 'flow/task_act': act.c_class);
        this.taskActModel.taskAct = taskAct;
        this.taskActModel.act = act;
        this.taskActModel.user = think.isEmpty(user) ? await think.session('user') : user;
    }


    ///**
    // * 根据ID取汇聚去向节点的列表，供其他方法调用
    // * @method  getToActs
    // * @return {Array} 来源节点的列表
    // * @params {int} actID 活动节点ID
    // * @params {int} procID 流程模板ID
    // */
    //async getToActs(actID,procID){
    //    let toArr =await this.model('act_path').getToActs(actID,procID);
    //    let list = await this.getActsByProcId(procID);
    //    let ret =[];
    //    for(let md of list){
    //        for(let toID of toArr) {
    //            if (md.id === toID) {
    //                ret.push(md)
    //            }
    //        }
    //    }
    //    return ret;
    //}


    /**
     * 根据ID取活动(流程节点)参数，供其他方法调用
     * @method  getActById
     * @return {object} 活动(流程节点)参数对象
     * @params {int} id 活动节点ID
     */
    async getActById(id){
        let list =await this.getActs();
        for(let md of list){
            if(md.id === id){
                return md;
            }
        }
        return {};
    }

    /**
     * 根据ID和模板ID取活动(流程节点)参数，供其他方法调用<br/>
     * 模板较多的时候，用本方法来改进性能
     * @method  getActByIdAndProcId
     * @return {object} 活动(流程节点)参数对象
     * @params {int} id 活动节点ID
     */
    async getActByIdAndProcId(id,procID){
        let list =await this.getActsByProcId(procID);
        for(let md of list){
            if(md.id === id){
                return md;
            }
        }
        return {};
    }

    /**
     * 根据ID取活动节点的名称，一般用于页面模块配置中的‘替换’调用: flow/act:getNameById
     * @method  getNameById
     * @return {string}  活动名称
     * @param {int} id  活动节点ID
     */
    async getNameById(id){
        let list =await this.getActs();
        for(let md of list){
            if(md.id === id){
                return md.c_name;
            }
        }
        return '';
    }
    async getActs(){
        let acts = await this.getActsCache();
        for(let act of acts){
            act.domain = think.isEmpty(act.c_domain) ? {}: eval(`(${act.c_domain})`);
        }
        return acts;
    }
    async getActsByProcId(procID){
        let acts = await this.getActsByProcIdCache(procID);
        for(let act of acts){
            act.domain = think.isEmpty(act.c_domain) ? {}: eval(`(${act.c_domain})`);
        }
        return acts;
    }

    async getActsCache(){
        return await think.cache("procActs", () => {
            return this.query('select * from fw_act order by id ');
        });
    }

    async getActsByProcIdCache(procID){
        return await think.cache("procActs"+procID, () => {
            return this.query(`select * from fw_act where c_proc=${procID} order by id `);
        });
    }


}
