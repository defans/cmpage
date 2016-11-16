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

    /**
     * 检查任务列表的所有当前节点，如果是自动执行的节点，则执行之
     * @method  fwAutoExec
     */
    async fwAutoExec(){
        //如果被调用函数需要，可在以下SQL语句中增加 fw_act 的字段
        let taskActs = await this.query(`select A.*,B.c_form,B.c_domain_st from vw_task_act A,fw_act B where A.c_act = B.id and A.c_status in(3,6) and B.c_type=2 `);
        for(let ta of taskActs){
            if(!think.isEmpty(ta.c_form)){
                let form = objFromString(ta.c_form);
                let fnModel = model(form.model);
                if (think.isFunction(fnModel[ form.fn ])) {
                    if(!think.isEmpty(ta.task_link_type)){
                        ta.domainData =  await this.model(ta.task_link_type).where({id:ta.task_link}).find();
                    }
                    let user = await this.model('task').getUserFromTask(ta.id);
                    if(await fnModel[form.fn](ta,user)){
                        //如果执行成功，则继续往下
                        await this.fwRun(ta.id,user,ta,true);
                    }
                }

            }
        }
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
     * 把节点根据路径走向排序，供其他方法调用
     * @method  getActsOrder
     * @return {Array} 流程节点的对象数组
     * @params {int} procID 流程模板ID
     */
    acts = [];
    async getActsOrder(procID, acts){
        this.acts = think.isEmpty(acts) ? await this.getActsByProcId(procID) : acts;
        let actPaths = await this.model('act_path').getActPathsByProcId(procID);
        //把节点根据路径走向排序
        let order = [];
        let actStart = {}, actEnd = {};
        for(let act of this.acts){
            if(act.c_type === global.enumActType.START){
                actStart =act;
            }else if(act.c_type === global.enumActType.END){
                actEnd = act;
            }
        }
        if(think.isEmpty(actEnd)){ return [];  }       //没有结束节点
        debug(actStart,'act.getActsOrder - actStart');
        order.push(actStart.id);
        actStart.isOrder =true;
        let sub = this.getActsOrder_toActs(actStart.id,actPaths,1);
        for(let a of sub){
            order.push(a);
        }

        order = global.arrGetUnique(order);
        let ret = [];
        for(let id of order){
            for(let a of this.acts){
                if(a.id === id){
                    ret.push(a);
                    break;
                }
            }
        }

        return ret;
    }
    //layer: 递归层数
    getActsOrder_toActs(actID,paths,layer){
        let toActIDs = [];
        layer += 1;
        if(layer > 50){ return [];  }

        for(let path of paths){
            if(path.c_from === actID){
                for(let act of this.acts){
                    if(act.id === path.c_to ){
//                        debug(act,'act.getActsOrder_toActs - act');
                        if(think.isEmpty(act.isOrder)){     //如果去向节点已经排序，则返回
                            act.isOrder =true;
                            toActIDs.push(act.id);
                            break;
                        }
                    }
                }
            }
        }
//        if(think.isEmpty(toActIDs)){ return []; }

        debug(toActIDs,'act.getActsOrder_toActs - toActIDs');

        //加入去向节点
        let order = [];
        order = toActIDs;
        for(let toActID of toActIDs){
            //继续往下
            let sub = this.getActsOrder_toActs(toActID,paths,layer);
            for(let a of sub){
                order.push(a);
            }
        }
        return order;
    }

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
