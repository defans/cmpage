'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供工作流的活动节点运转的相关方法，业务相关，供flow/model/act.js的方法进行调用<br/>
 * 具体的业务相关的工作流活动的子类可以继承本类，来增加定制的业务逻辑
 * @class flow.model.task_act
 */
export default class extends think.model.base {
    /**
     * 是否可以运行一个流程实例的活动(流程节点)
     * @method  canRun
     * @return {boolean}  判断值
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async canRun(taskAct,act,user){
        global.debug(taskAct,'task_act.canRun --- taskAct --- 根据节点状态判断');
        global.debug(act,'task_act.canRun --- act --- 根据节点状态判断');
        if(act.c_type === global.enumActType.START  || act.c_type === global.enumActType.DUMMY
            || (taskAct.c_status === global.enumTaskActStatus.SUSPEND && taskAct.c_from_rule !== global.enumActFromRule.DEFINE) ){
            return true;
        }else if(taskAct.c_status === global.enumTaskActStatus.NO_BEGIN || taskAct.c_status === global.enumTaskActStatus.SUSPEND){
            //根据汇聚类型判断
            if(taskAct.c_from_rule === global.enumActFromRule.DEFINE || act.c_type === global.enumActType.NORMAL_MAN){
                //等待自定义的方法被调用后继续往下走, 人为参与的节点类似
                global.debug(taskAct,'task_act.canRun --- taskAct --- 等待...');
                taskAct.c_status = global.enumTaskActStatus.WAIT;
                await this.fwSave(taskAct);
                await this.addTaskSt(taskAct,user);
                return false;
            }else if(taskAct.c_from_rule === global.enumActFromRule.ORDER){
                return true;
            }else{
                let actCnt = await this.getFromTasksWithEnd(taskAct);
                if(actCnt.cntEnd >0){
                    if(taskAct.c_from_rule === global.enumActFromRule.OR_JOIN || (actCnt.cnt === actCnt.cntEnd)
                    || (taskAct.c_from_rule === global.enumActFromRule.VOTES_JOIN && actCnt.cntEnd >= taskAct.c_votes)){
                        return true;
                    }else{
                        taskAct.c_status = global.enumTaskActStatus.PENDING;    //转 汇聚中
                        await this.fwSave(taskAct);
                        await this.addTaskSt(taskAct,user);
                        return false;
                    }
                }else{
                    taskAct.c_status = global.enumTaskActStatus.PENDING;    //转 汇聚中
                    await this.fwSave(taskAct);
                    await this.addTaskSt(taskAct,user);
                    return false;
                }
            }
        }else if(taskAct.c_status === global.enumTaskActStatus.PENDING){
            //根据汇聚情况判断
            let actCnt = await this.getFromTasksWithEnd(taskAct);
            if(actCnt.cntEnd >0){
                if(taskAct.c_from_rule === global.enumActFromRule.OR_JOIN || (actCnt.cnt === actCnt.cntEnd)
                    || (taskAct.c_from_rule === global.enumActFromRule.VOTES_JOIN && actCnt.cntEnd >= taskAct.c_votes)){
                    return true;
                }else{
                    return false;
                }
            }
        }
        return false;
    }

    /**
     * 自定义from规则，一般用于需要中断（等待）的操作完成后，调用本方法<br/>
     * 子类中可以重写本方法实现更多的控制逻辑
     * @method  defineFromRule
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async defineFromRule(taskAct,act,user){
        if(taskAct.c_status ===global.enumTaskActStatus.WAIT){
            taskAct.c_status = global.enumTaskActStatus.RUN;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);
        }

        return taskAct;
    }

    /**
     * 运行一个流程实例的活动(流程节点)
     * @method  fwRun
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     * @params {boolean} canRun 是否可以执行，为true时跳过判断函数
     */
    async fwRun(taskAct,act,user){
        if(await this.canRun(taskAct,act,user) ){
            taskAct.c_status = global.enumTaskActStatus.RUN;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);
            //执行本节点，子类中可以加入其他业务逻辑

            //结束本节点
            await this.fwEnd(taskAct,act,user);
        }

        return taskAct;
    }

    /**
     * 挂起一个流程实例的活动(流程节点)
     * @method  fwSuspend
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async fwSuspend(taskAct,act,user){
        if(taskAct.c_status ===global.enumTaskActStatus.RUN || taskAct.c_status ===global.enumTaskActStatus.WAIT){
            taskAct.c_status = global.enumTaskActStatus.SUSPEND;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);
        }

        return taskAct;
    }

    /**
     * 终止一个流程实例的活动(流程节点)
     * @method  fwTerminate
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async fwTerminate(taskAct,act,user){
        if(taskAct.c_status !== global.enumTaskActStatus.TERMINATE && taskAct.c_status !== global.enumTaskActStatus.END
            && taskAct.c_status !== global.enumTaskActStatus.NO_BEGIN ){
            taskAct.c_status = global.enumTaskActStatus.TERMINATE;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);
            //判断，如果当前节点都已经终止，则终止本流程实例，一般是自动终止的时候要检查，手动的话通过调用proc.fwTerminate来进行
            let taskActs = await this.getTaskActs(taskAct.c_task);
            let canTerminate = true;
            for(let ta of taskActs){
                if(ta.c_status !== global.enumTaskActStatus.TERMINATE && ta.c_status !== global.enumTaskActStatus.END
                    && ta.c_status !== global.enumTaskActStatus.NO_BEGIN){
                    canTerminate = false;
                }
            }
            if(canTerminate){
                await this.model('proc').fwTerminate(taskAct.c_task,user);
        }

        }
        return taskAct;
    }


    /**
     * 正常结束一个流程实例的活动(流程节点)
     * @method  fwEnd
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async fwEnd(taskAct,act,user){
        if(taskAct.c_status ===global.enumTaskActStatus.RUN){
            taskAct.c_status = global.enumTaskActStatus.END;
            await this.fwSave(taskAct);
            if(act.c_type == global.enumActType.END){
                await this.model('proc').fwEnd(taskAct.c_task, user);
                global.debug(taskAct,'task_act.fwEnd --- taskAct --- 结束整个流程');
            }else{
                //找去向节点,根据去向规则进行Run
                global.debug(taskAct,'task_act.fwEnd --- taskAct --- 此节点处，找去向节点');
                let toTaskActs = await this.getToTaskActs(taskAct);
                if(act.c_to_rule === global.enumActToRule.ORDER || act.c_to_rule === global.enumActToRule.AND_SPLIT ){
                    for(let ta of toTaskActs ){
                        await this.model('act').fwRun(ta.id,user);
                        global.debug(ta,'task_act.fwEnd --- toTaskActs.ta --- 此处直接往下');
                    }
                }else if(act.c_to_rule === global.enumActToRule.OR_SPLIT){
                    //或分支为条件分支，有一个满足条件则继续，没有分支能满足条件则任务终止，因此需要表单填写后先进行有效性的验证
                    //根据分支路径上的业务规则进行判断
                    let toPaths = await this.model('act_path').getToActPaths(act.id,act.c_proc);
                    for(let path of toPaths ){
                        if(await this.defineOrSplit(taskAct,act,user,path)){
                            for(let ta of toTaskActs){
                                if(ta.c_act === path.c_to){
                                    await this.model('act').fwRun(ta.id,user);
                                    global.debug(ta,'task_act.fwEnd --- toTaskActs.ta --- 或分支往下');
                                    break;
                                }
                            }
                        }
                    }
                    //let rand = global.getRandomNum(0,toTaskIds.length -1);
                    //this.model('act').fwRun(toTaskIds[rand],user);
                }else{
                    await this.defineToRule(taskAct,act,user,toTaskIds);
                }
            }
        }

        return taskAct;
    }
    /**
     * 当节点去向规则为 或分支 的时候，通过本方法判断取哪一条路径继续 <br/>
     * 子类中可以重写本方法实现具体的判断逻辑，可以在路径中事先设置条件值，便于调整
     * @method  defineOrSplit
     * @return {boolean}  是否通过该路径
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     * @params {object} actPath 去向的某一个路径
     */
    async defineOrSplit(taskAct,act,user,actPath){
        let dta = await this.domainGetData(taskAct,act,user);

        //此处实现了常规的条件判断处理
        if(!think.isEmpty(actPath.c_domain)){
            let rule = eval("("+actPath.c_domain+")");
            if(!think.isEmpty(rule['fn'])){      //通过某个模块的某个方法来判断是否可以通过改路径
                let fnModel = global.model(rule['model']);
                if(think.isFunction(fnModel[ rule['fn'] ])){
                    return await fnModel[  rule['fn'] ](dta, act, user);
                }
            }else if(think.isArray(rule)){      //形如： [{field:"c_days",op:">",value:1},{field:"c_days",op:"<=",value:3}]
                let where = [];
                for(let item of rule){
                    where.push(`(${ dta.domainData[ item['field'] ] } ${item['op']} ${item['value']})`);
                }
                return  eval("("+ where.join(' && ') +")");
            }
        }

        return true;
    }

    /**
     * 取当前节点的业务相关数据，存放于 taskAct.domainData 中 <br/>
     * 子类中可以重写本方法实现具体的取业务数据方法
     * @method  domainGetData
     * @return {object}  增加业务对象数据后的节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async domainGetData(taskAct,act,user){
        let dta = taskAct;
        dta.domainData = {id:0};

        return dta;
    }
    /**
     * 自定义to规则，一般用于需要中断（等待）的操作完成后，调用本方法<br/>
     * 子类中可以重写本方法实现更多的控制逻辑
     * @method  defineToRule
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     * @params {Array} 去向的任务节点ID的列表
     */
    async defineToRule(taskAct,act,user,toTaskIds){

        return taskAct;
    }

    /**
     * 保存任务的活动(流程节点), taskAct结构来自于vw_task_act<br/>
     * 子类中可以重写本方法来增加其他逻辑，比如保存其他业务表数据等, 此处可以改用缓存机制
     * @method  fwSave
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} user 流程执行人
     */
    async fwSave(taskAct,act,user){
        let md = global.objPropertysFromOtherObj({},taskAct,['id','c_task','c_act','c_status','c_user',
                    'c_time_begin','c_time','c_memo','c_link','c_link_type']);
        if(!think.isEmpty(md)){
            await this.model('fw_task_act').where({id:taskAct.id}).update(taskAct);
        }
        return taskAct;
    }

    /**
     * 增加流程实例的活动节点状态记录，记录某个活动(流程节点)发生的时间及当时状态<br/>
     * 子类中重写本方法可以定制流程状态的记录方式，如在具体业务状态表中增加记录等
     * @method  addTaskSt
     * @return {int}  记录ID
     * @params {object} taskAct 任务节点对象
     * @params {object} user 流程执行人
     * @params {string} desc 状态描述
     */
    async addTaskSt(taskAct,user, desc){
        let md = {c_proc:taskAct.c_proc,c_act:taskAct.c_act,c_task:taskAct.c_task, c_task_act:taskAct.id,
            c_time:taskAct.c_time, c_user:taskAct.c_user};
        //组成状态描述
        if(taskAct.c_status === global.enumActType.NORMAL_MAN || taskAct.c_status === global.enumActType.NORMAL_AUTO ){
            md.c_desc = think.isEmpty(desc) ? `节点(${await this.model('act').getNameById(taskAct.c_act)})
                    ${this.model('cmpage/utils').getEnumName(md.c_status,'TaskStatus')}` : desc;
            md.id = await this.model('fw_task_st').add(md);
            await this.model('fw_task_st_his').add(md);
            return md.id;
        }
        return 0;
    }

    /**
     * 根据任务节点ID统计汇聚来源任务节点的完成数，供其他方法调用
     * @method  getFromTasksWithEnd
     * @return {object} 来源的任务节点的完成数, 形如：{cnt:3, cntEnd:3}
     * @params {object} taskAct 任务节点对象
     */
    async getFromTasksWithEnd(taskAct){
        global.debug(taskAct,'task_act.getFromTasksWithEnd')
        let fromArr =await this.model('act_path').getFromActIds(taskAct.c_act, taskAct.c_proc);
        global.debug(fromArr,'task_act.getFromTasksWithEnd---fromArr')
        let list = await this.query(`select * from fw_task_act where c_task=${taskAct.c_task} `);
        //global.debug(list);
        let cntEnd =0;
        for(let md of list){
            for(let fromID of fromArr) {
                if (md.c_act === fromID) {
                    cntEnd += 1;
                }
            }
        }
        return {cnt:fromArr.length, cntEnd:cntEnd};
    }

    /**
     * 根据任务节点ID取汇聚来源任务节点ID的列表，供其他方法调用
     * @method  getFromTaskIds
     * @return {Array} 来源的任务节点ID的列表
     * @params {object} taskAct 任务节点对象
     */
    async getFromTaskIds(taskAct){
        global.debug(taskAct,'task_act.getFromTaskIds')
        let fromArr =await this.model('act_path').getFromActIds(taskAct.c_act, taskAct.c_proc);
        let list = await this.model('fw_task_act').where({c_task:taskAct.c_task}).select();
        let ret =[];
        for(let md of list){
            for(let fromID of fromArr) {
                if (md.c_act === fromID) {
                    ret.push(md.id);
                }
            }
        }
        return ret;
    }

    /**
     * 根据任务节点ID取分支去向的任务节点ID的列表，供其他方法调用
     * @method  getToTaskIds
     * @return {Array} 去向的任务节点的列表
     * @params {object} taskAct 任务节点对象
     */
    async getToTaskActs(taskAct){
        global.debug(taskAct,'task_act.getToTaskActs ---- taskAct');
        let toArr =await this.model('act_path').getToActIds(taskAct.c_act, taskAct.c_proc);
        let list = await this.query(`select * from fw_task_act where c_task=${taskAct.c_task}`);
        let ret =[];
        for(let md of list){
            for(let toID of toArr) {
                if (md.c_act === toID) {
                    ret.push(md);
                }
            }
        }
        return ret;
    }

    /**
     * 根据任务ID取任务节点的列表，供其他方法调用
     * @method  getTaskActs
     * @return {Array} 任务节点ID的列表
     * @params {int} taskID 任务ID
     */
    async getTaskActs(taskID){
        return await this.query(`select * from fw_task_act where c_task=${taskID}`);
        //let list = await this.model('fw_task_act').where({c_task:taskID}).select();
        //let ret =[];
        //for(let md of list){
        //    if (md.c_task === taskID) {
        //        ret.push(md);
        //    }
        //}
        //return ret;
    }


    ///**
    // * 取流程实例（任务）的活动节点对象，此处可使用缓存机制改进性能
    // * @method  getTaskAct
    // * @return {object} 流程实例的节点对象
    // * @params {object} task 任务对象
    // */
    //async getTaskAct(taskActID){
    //    return await this.model('fw_task_act').where({id:taskActID}).find();
    //}

}
