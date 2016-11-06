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
    act = {};  //当前流程模板的节点设置
    taskAct = {};  //当前流程实例节点
    user = {};  //当前用户
    fromTaskActs = [];   //来源节点列表
    toTaskActs = [];   //去向节点列表
    toPaths = [];   //去向路径列表

    /**
     * 是否可以运行一个流程实例的活动(流程节点)
     * @method  canRun
     * @return {boolean}  判断值
     */
    async canRun(){
        let taskAct = this.taskAct;
        let act = this.act;
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
                await this.save();
                return false;
            }else if(taskAct.c_from_rule === global.enumActFromRule.ORDER){
                return true;
            }else{
                let actCnt = await this.getFromTasksWithEnd();
                if(actCnt.cntEnd >0){
                    if(taskAct.c_from_rule === global.enumActFromRule.OR_JOIN || (actCnt.cnt === actCnt.cntEnd)
                    || (taskAct.c_from_rule === global.enumActFromRule.VOTES_JOIN && actCnt.cntEnd >= taskAct.c_votes)){
                        return true;
                    }else{
                        taskAct.c_status = global.enumTaskActStatus.PENDING;    //转 汇聚中
                        await this.save();
                        return false;
                    }
                }else{
                    taskAct.c_status = global.enumTaskActStatus.PENDING;    //转 汇聚中
                    await this.save();
                    return false;
                }
            }
        }else if(taskAct.c_status === global.enumTaskActStatus.PENDING){
            //根据汇聚情况判断
            let actCnt = await this.getFromTasksWithEnd();
            if(actCnt.cntEnd >0){
                return (taskAct.c_from_rule === global.enumActFromRule.OR_JOIN || (actCnt.cnt === actCnt.cntEnd)
                    || (taskAct.c_from_rule === global.enumActFromRule.VOTES_JOIN && actCnt.cntEnd >= taskAct.c_votes));
            }
        }
        return false;
    }

    /**
     * 自定义from规则，一般用于需要中断（等待）的操作完成后，调用本方法<br/>
     * 子类中可以重写本方法实现更多的控制逻辑
     * @method  defineFromRule
     */
    async defineFromRule(){
        if(this.taskAct.c_status ===global.enumTaskActStatus.WAIT){
            this.taskAct.c_status = global.enumTaskActStatus.RUN;
            await this.save();
        }
    }

    /**
     * 运行一个流程实例的活动(流程节点)
     * @method  fwRun
     */
    async fwRun(isPass){
        global.debug(isPass,'task_act.fwRun - isPass');
        if(think.isEmpty(isPass) && await this.canRun() ){
            this.taskAct.c_status = global.enumTaskActStatus.RUN;
            await this.save();
        }
        //执行本节点，子类中可以加入其他业务逻辑

        //结束本节点
        await this.fwEnd();
    }

    /**
     * 挂起一个流程实例的活动(流程节点)
     * @method  fwSuspend
     */
    async fwSuspend(){
        if(this.taskAct.c_status ===global.enumTaskActStatus.RUN || this.taskAct.c_status ===global.enumTaskActStatus.WAIT){
            this.taskAct.c_status = global.enumTaskActStatus.SUSPEND;
            await this.save();
        }
    }

    /**
     * 终止一个流程实例的活动(流程节点)
     * @method  fwTerminate
     */
    async fwTerminate(){
        if(this.taskAct.c_status !== global.enumTaskActStatus.TERMINATE && this.taskAct.c_status !== global.enumTaskActStatus.END
            && this.taskAct.c_status !== global.enumTaskActStatus.NO_BEGIN ){
            this.taskAct.c_status = global.enumTaskActStatus.TERMINATE;
            await this.save();
            //判断，如果当前节点都已经终止，则终止本流程实例，一般是自动终止的时候要检查，手动的话通过调用proc.fwTerminate来进行
            let taskActs = await this.getTaskActs(this.taskAct.c_task);
            let canTerminate = true;
            for(let ta of taskActs){
                if(ta.c_status !== global.enumTaskActStatus.TERMINATE && ta.c_status !== global.enumTaskActStatus.END
                    && ta.c_status !== global.enumTaskActStatus.NO_BEGIN){
                    canTerminate = false;
                }
            }
            if(canTerminate) {
                await this.model('proc').fwTerminate(this.taskAct.c_task, this.user);
            }
        }

    }


    /**
     * 正常结束一个流程实例的活动(流程节点)
     * @method  fwEnd
     */
    async fwEnd(){
        let taskAct = this.taskAct;
        if(taskAct.c_status ===global.enumTaskActStatus.RUN){
            taskAct.c_status = global.enumTaskActStatus.END;
            await this.save();
            if(this.act.c_type == global.enumActType.END){
                await this.model('proc').fwEnd(this.taskAct.c_task, this.user);
                global.debug(this.taskAct,'task_act.fwEnd - taskAct - 结束task');
            }else{
                //找去向节点,根据去向规则进行Run
                global.debug(taskAct,'task_act.fwEnd --- taskAct --- 此节点处，找去向节点');
                let toTaskActs = await this.getToTaskActs(taskAct);
                if(this.act.c_to_rule === global.enumActToRule.ORDER || this.act.c_to_rule === global.enumActToRule.AND_SPLIT ){
                    for(let ta of toTaskActs ){
                        await this.model('act').fwRun(ta.id,this.user);
                        global.debug(ta,'task_act.fwEnd --- toTaskActs.ta --- 此处直接往下');
                    }
                }else if(this.act.c_to_rule === global.enumActToRule.OR_SPLIT){
                    //或分支为条件分支，有一个满足条件则继续，没有分支能满足条件则任务终止，因此需要表单填写后先进行有效性的验证
                    //根据分支路径上的业务规则进行判断
                    this.toPaths = await this.model('act_path').getToActPaths(this.act.id,this.act.c_proc);
                    for(let path of this.toPaths ){
                        if(await this.defineOrSplit(path)){
                            for(let ta of toTaskActs){
                                if(ta.c_act === path.c_to){
                                    await this.model('act').fwRun(ta.id,this.user);
                                    global.debug(ta,'task_act.fwEnd --- toTaskActs.ta --- 或分支往下');
                                    return;
                                }
                            }
                        }
                    }
                    //let rand = global.getRandomNum(0,toTaskIds.length -1);
                    //this.model('act').fwRun(toTaskIds[rand],user);
                }else{
                    await this.defineToRule();
                }
            }
        }

    }
    /**
     * 当节点去向规则为 或分支 的时候，通过本方法判断取哪一条路径继续 <br/>
     * 子类中可以重写本方法实现具体的判断逻辑，可以在路径中事先设置条件值，便于调整
     * @method  defineOrSplit
     * @return {boolean}  是否通过该路径
     * @params {object} path 去向的某一个路径
     */
    async defineOrSplit(path){
        await this.domainGetData();

        //此处实现了常规的条件判断处理
        if(!think.isEmpty(path.c_domain)){
            let rule = eval("("+path.c_domain+")");
            if(!think.isEmpty(rule['fn'])){      //通过某个模块的某个方法来判断是否可以通过改路径
                let fnModel = global.model(rule['model']);
                if(think.isFunction(fnModel[ rule['fn'] ])){
                    return await fnModel[  rule['fn'] ](this.taskAct, this.act, user);
                }
            }else if(think.isArray(rule)){      //形如： [{field:"c_days",op:">",value:1},{field:"c_days",op:"<=",value:3}]
                let where = [];
                for(let item of rule){
                    where.push(`(${ this.taskAct.domainData[ item['field'] ] } ${item['op']} ${item['value']})`);
                }
                global.debug(where.join(' && '),'task_act.defineOrSplit - to path where');
                return  eval("("+ where.join(' && ') +")");
            }
        }

        return false;
    }

    /**
     * 取当前节点的业务相关数据，存放于 taskAct.domainData 中 <br/>
     * 子类中可以重写本方法实现具体的取业务数据方法
     * @method  domainGetData
     * @return {object}  增加业务对象数据后的节点对象
     */
    async domainGetData(){
        this.taskAct.domainData = {};
        let task = await this.model('task').getTask(this.taskAct.c_task);
        global.debug(task,'task_act.deomainGetData - task');
        if(!think.isEmpty(task.c_link_type)){
            this.taskAct.domainData =  await this.model(task.c_link_type).where({id:task.c_link}).find();
        }
        global.debug(this.taskAct.domainData,'task_act.domainGetData - this.taskAct.domainData');

        //子类中可以增加其他业务规则
    }
    /**
     * 自定义to规则，一般用于需要中断（等待）的操作完成后，调用本方法<br/>
     * 子类中可以重写本方法实现更多的控制逻辑
     * @method  defineToRule
     * @return {object}  任务节点对象
     */
    async defineToRule(){
        if(think.isEmpty(this.toTaskActs)){
            this.toTaskActs = await this.getToTaskActs(this.taskAct);
        }
        //子类中增加自定义规则
    }

    /**
     * 保存任务的活动(流程节点), taskAct结构来自于vw_task_act<br/>
     * 子类中可以重写本方法来增加其他逻辑，比如保存其他业务表数据等, 此处可以改用缓存机制
     * @method  save
     */
    async save(){
        let md = global.objPropertysFromOtherObj({},this.taskAct,['id','c_task','c_act','c_status','c_user',
                    'c_time_begin','c_time','c_memo','c_link','c_link_type']);
        if(!think.isEmpty(md)){
            await this.model('fw_task_act').where({id:this.taskAct.id}).update(md);
            await this.addTaskSt();
        }
    }

    /**
     * 增加流程实例的活动节点状态记录，记录某个活动(流程节点)发生的时间及当时状态<br/>
     * 子类中重写本方法可以定制流程状态的记录方式，如在具体业务状态表中增加记录等
     * @method  addTaskSt
     * @params {string} desc 状态描述
     */
    async addTaskSt( desc){
        let taskAct = this.taskAct;
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
     * @return {int} 来源的任务节点的完成数
     * @params {object} taskAct 任务节点对象
     */
    async getFromTasksWithEnd(){
        global.debug(this.taskAct,'task_act.getFromTasksWithEnd - taskAct');
        if(think.isEmpty(this.fromTaskActs)){
            this.fromTaskActs = await this.getFromTaskActs(this.taskAct);
        }
        //global.debug(list);
        let cntEnd =0;
        for(let md of this.fromTaskActs){
            if (md.c_status === global.enumTaskActStatus.END) {
                cntEnd += 1;
            }
        }
        return cntEnd;
    }

    /**
     * 根据任务节点ID取汇聚来源任务节点ID的列表，供其他方法调用
     * @method  getFromTaskActs
     * @return {Array} 来源的任务节点的列表
     * @params {object} taskAct 任务节点对象
     */
    async getFromTaskActs(taskAct){
        global.debug(taskAct,'task_act.getFromTaskIds')
        let fromArr =await this.model('act_path').getFromActIds(taskAct.c_act, taskAct.c_proc);
        let list = await this.model('fw_task_act').where({c_task:taskAct.c_task}).select();
        let ret =[];
        for(let md of list){
            for(let fromID of fromArr) {
                if (md.c_act === fromID) {
                    ret.push(md);
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
    }


    /**
     * 取流程实例（任务）的活动节点对象，此处可使用缓存机制改进性能
     * @method  getTaskAct
     * @return {object} 流程实例的节点对象
     * @params {object} taskActID 任务对象的节点ID
     */
    async getTaskAct(taskActID){
        return await this.model('vw_task_act').where({id:taskActID}).find();
    }

}
