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
     * @return {bool}  判断值
     * @params {object} taskAct 任务节点对象
     * @params {object} act 流程节点对象
     * @params {object} user 流程执行人
     */
    async canRun(taskAct,act,user){
        //根据节点状态判断
        if(act.c_type === global.enumActType.START  || act.c_type === global.enumActType.DUMMY
            || (taskAct.c_status === global.enumTaskActStatus.SUSPEND && taskAct.c_from_rule !== global.enumActFromRule.DEFINE) ){
            return true;
        }else if(taskAct.c_status === global.enumTaskActStatus.NO_BEGIN || taskAct.c_status === global.enumTaskActStatus.SUSPEND){
            //根据汇聚类型判断
            if(taskAct.c_from_rule === global.enumActFromRule.ORDER){
                return true;
            }else if(taskAct.c_from_rule === global.enumActFromRule.DEFINE){
                //等待自定义的方法被调用后继续往下走
                taskAct.c_status = global.enumTaskActStatus.WAIT;
                await this.fwSave(taskAct);
                await this.addTaskSt(taskAct,user);
                return false;
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
     */
    async fwRun(taskAct,act,user){
        if(await this.canRun(taskAct,act,user)){
            taskAct.c_status = global.enumTaskActStatus.RUN;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);
            //执行本节点

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

        if(taskAct.c_status !==global.enumTaskActStatus.TERMINATE && taskAct.c_status !==global.enumTaskActStatus.END){
            taskAct.c_status = global.enumTaskActStatus.TERMINATE;
            await this.fwSave(taskAct);
            await this.addTaskSt(taskAct,user);
            //判断
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
                //结束整个流程
                await this.model('proc').fwEnd(taskAct.c_task, user);
            }else{
                //找去向节点执行
                let toTaskIds = this.getToTaskIds(taskAct);
                for(let taskID of toTaskIds ){
                    this.model('act').fwRun(taskID,user);       //此处直接往下，没有 await, 待验证
                }
            }
        }

        return taskAct;
    }

    /**
     * 保存任务的活动(流程节点), taskAct结构来自于vw_task_act<br/>
     * 子类中可以重写本方法来增加其他逻辑，比如保存其他业务表数据等
     * @method  fwSave
     * @return {object}  任务节点对象
     * @params {object} taskAct 任务节点对象
     * @params {object} user 流程执行人
     */
    async fwSave(taskAct,act,user){
        let md = global.objPropertysFromOtherObj({},taskAct,['id','c_task','c_act','c_status','c_user',
                    'c_time_begin','c_time','c_memo','c_link','c_link_type']);
        if(!think.isEmpty(md)){
            await this.model('fw_task_act').where({id:md.id}).update(md);
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
        let fromArr =await this.model('act_path').getFromActIDs(taskAct.c_act, taskAct.c_proc);
        let list = await this.model('fw_task_act').where({c_task:taskAct.c_task}).select();
        let cntEnd =0;
        for(let md of list){
            for(let fromID of fromArr) {
                if (md.c_act === fromID) {
                    cntEnd += 1;
                }
            }
        }
        return {cnt:fromArr.length(), cntEnd:cntEnd};
    }

    /**
     * 根据任务节点ID取汇聚来源任务节点ID的列表，供其他方法调用
     * @method  getFromTaskIds
     * @return {Array} 来源的任务节点ID的列表
     * @params {object} taskAct 任务节点对象
     */
    async getFromTaskIds(taskAct){
        let fromArr =await this.model('act_path').getFromActIDs(taskAct.c_act, taskAct.c_proc);
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
     * @return {Array} 来源的任务节点ID的列表
     * @params {object} taskAct 任务节点对象
     */
    async getToTaskIds(taskAct){
        let toArr =await this.model('act_path').getToActIDs(taskAct.c_act, taskAct.c_proc);
        let list = await this.model('fw_task_act').where({c_task:taskAct.c_task}).select();
        let ret =[];
        for(let md of list){
            for(let toID of toArr) {
                if (md.c_act === toID) {
                    ret.push(md.id);
                }
            }
        }
        return ret;
    }


}
