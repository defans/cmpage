'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供工作流控制的相关方法，业务相关，供flow/model/proc.js的方法进行调用<br/>
 * 具体的业务相关的工作流子类可以继承本类，来增加定制的业务逻辑
 * @class flow.model.task
 */
export default class extends think.model.base {
    proc = {};  //当前流程模板
    task = {};  //当前流程实例
    user = {};  //当前用户
    currAct = {};   //当前节点设置
    currTaskAct = {};   //当前节点实例

    /**
     * 创建(启动)一个新的流程实例(任务)
     * @method  fwStart
     */
    async fwStart(){

        this.task ={c_no:this.getTaskNo(), c_proc:this.proc.id, c_status:global.enumTaskStatus.RUN, c_creater:this.user.id, c_time_create:think.datetime(),
               c_priority:global.enumTaskPriority.NOMAL, c_user:this.user.id, c_time:think.datetime(), c_memo:'', c_link:0 ,c_link_type:''};

        await this.fwInit();

        if(this.task.c_status !== global.enumTaskStatus.INIT){
            await this.addTaskSt('模板设置错误，流程终止');
            return;
        }
        await this.save();

        //console.log(task);

//        console.log(proc);
        let actModel = this.model('act');
        //增加活动节点
        let acts = await actModel.getActsByProcId(this.proc.id);
//        console.log(acts);
        if(think.isEmpty(acts)){
            await this.addTaskSt('流程模板的活动节点设置错误!');
            return;
        }
        let taskActModel = this.model('fw_task_act');
        let taskActStartID = 0;
        for(let act of acts){
            let md = {c_task:this.task.id, c_act:act.id, c_status:global.enumTaskActStatus.NO_BEGIN, c_user:this.user.id, c_time_begin:think.datetime(),
                c_time:think.datetime(), c_memo:'', c_link:0, c_link_type:''};
            md.id = await taskActModel.add(md);
            if(act.c_type === global.enumActType.START){
                taskActStartID = md.id;
            }
        }
        this.task.c_status = global.enumTaskStatus.RUN;
        await this.save();

        //从开始节点进行run
        return await actModel.fwRun(taskActStartID,this.user);

    }

    /**
     * 取某个任务的当前状态，当前节点存放于 task.currAct <br/>
     * 子类中重写本方法，可以增加任务的初始化逻辑，比如业务相关的逻辑
     * @method  getTaskWithStatus
     */
    async getTaskWithCurrentAct(task){
        if(think.isEmpty(this.task)){
            this.task = task;
        }
        global.debug(this.task,'task.getTaskWithCurrentAct --- this.task');
        this.currAct = {id:0};
        if(this.task.c_status === global.enumTaskStatus.RUN){
            let taskActs = await this.model('task_act').getTaskActs(this.task.id);
            let actModel = this.model('act');
            for(let ta of taskActs){
                //TODO: 可能要考虑user来进行区分
                //取当前节点
                if(ta.c_status === global.enumTaskActStatus.WAIT || ta.c_status === global.enumTaskActStatus.RUN || ta.c_status === global.enumTaskActStatus.SUSPEND){
                    this.currTaskAct = ta;
                    this.currAct = await actModel.getActByIdAndProcId(ta.c_act, this.task.c_proc);
                    break;
                }
            }
        }
        return this.currAct;
    }

    /**
     * 初始化一个的流程实例(任务)<br/>
     * 子类中重写本方法，可以增加任务的初始化逻辑，比如业务相关的逻辑
     * @method  fwInit
     */
    async fwInit(){
        this.task.c_status = global.enumTaskStatus.INIT;
        //如果不满足启动条件，则重置任务状态为： TERMINATE

    }

    /**
     * 根据编号规则生成任务编号<br/>
     * 子类中可以重写本方法，实现特殊的编号规则
     * @method  getTaskNo
     * @return {string}  新的任务编号
     */
    getTaskNo(){
        let no ='';
        if(!think.isEmpty(this.proc.c_no_format)){
            no = global.datetime(new Date(),'yyMMddHHmmss')+global.getRandomNum(1,10);
        }else{

        }
        return no;
    }

    /**
     * 运行一个流程实例(任务)
     * @method  fwRun
     */
    async fwRun(){
        if(this.task.c_status === global.enumTaskStatus.SUSPEND){
            this.task.c_status = global.enumTaskStatus.RUN;
            //让本实例被挂起的节点继续RUN
            let taskActs = await this.model('task_act').getTaskActs(this.task.id);
            for(let taskAct of taskActs){
                if(taskAct.c_status === global.enumTaskActStatus.SUSPEND){
                    await this.model('act').fwRun(taskAct.id,this.user,taskAct);
                }
            }
            await this.save();
        }
    }

    /**
     * 挂起一个流程实例(任务)
     * @method  fwSuspend
     */
    async fwSuspend(){
        if(this.task.c_status === global.enumTaskStatus.RUN){
            this.task.c_status = global.enumTaskStatus.SUSPEND;
            //当前活动节点挂起
            if(think.isEmpty(this.currTaskAct)){
                await this.getTaskWithCurrentAct();
            }
            await this.model('act').fwSuspend(this.currTaskAct.id,user,this.currTaskAct);
            await this.save();
        }
    }

    /**
     * 终止一个流程实例(任务)
     * @method  fwTerminate
     */
    async fwTerminate(){
        if(this.task.c_status === global.enumTaskStatus.RUN || this.task.c_status === global.enumTaskStatus.SUSPEND ){
            this.task.c_status = global.enumTaskStatus.TERMINATE;
            //当前活动节点终止
            if(think.isEmpty(this.currTaskAct)){
                await this.getTaskWithCurrentAct();
            }
            await this.model('act').fwTerminate(this.currTaskAct.id,user,this.currTaskAct);
            await this.save();
        }
    }

    /**
     * 正常结束一个流程实例(任务)，一般在结束节点执行完成后调用
     * @method  fwEnd

     */
    async fwEnd(){
        if(this.task.c_status !== global.enumTaskStatus.RUN || this.task.c_status === global.enumTaskStatus.SUSPEND ){
            this.task.c_status = global.enumTaskStatus.END;
            await this.save();
        }
    }

    /**
     * 增加流程实例的状态记录，记录流程示例发生状态改变的时间及当时状态
     * @method  addTaskSt
     * @params {string} [desc] 状态描述
     */
    async addTaskSt(desc){
       // console.log(task);
        let task = this.task;
        if(task.id <=0){
            return 0;
        }
        let md = {c_proc:task.c_proc,c_act:0,c_task:task.id, c_task_act:0, c_time:task.c_time, c_user:this.user.id, c_status:task.c_status};
        //组成状态描述
        md.c_desc = think.isEmpty(desc) ?  '流程'+ (await this.model('cmpage/utils').getEnumName(task.c_status,'TaskStatus')) : desc;
        md.id = await this.model('fw_task_st').add(md);
        await this.model('fw_task_st_his').add(md);

        return md.id;
    }
    /**
     * 保存程实例记录，此处可使用缓存机制改进性能
     * @method  save
     * @return {object} 流程实例对象
     * @params {object} task 任务对象
     */
    async save(){
        if(this.task.id >0){
            await this.model('fw_task').where({id:this.task.id}).update(this.task);
        }else{
            this.task.id = await this.model('fw_task').add(this.task);
        }
        await this.addTaskSt();
    }

    /**
     * 取流程实例对象，此处可使用缓存机制改进性能
     * @method  getTask
     * @return {object} 流程实例对象
     * @params {object} task 任务对象
     */
    async getTask(taskID){
        return await this.model('fw_task').where({id:taskID}).find();
    }
}
