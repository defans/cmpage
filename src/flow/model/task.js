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
    /**
     * 创建(启动)一个新的流程实例(任务)
     * @method  fwStart
     * @return {object}  流程实例对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程发起人
     */
    async fwStart(proc,user){

        let task ={c_no:this.getTaskNo(proc), c_proc:proc.id, c_status:global.enumTaskStatus.RUN, c_creater:user.id, c_time_create:think.datetime(),
               c_priority:global.enumTaskPriority.NOMAL, c_user:user.id, c_time:think.datetime(), c_memo:'', c_link:0 ,c_link_type:''};

        task = await this.fwInit(task,proc,user);

        if(task.c_status !== global.enumTaskStatus.INIT){
            await this.addTaskSt(task,user,'模板设置错误，流程终止');
            return task;
        }
        task.id = await this.model('fw_task').add(task);
        await this.addTaskSt(task,user);

        //console.log(task);

//        console.log(proc);
        //增加活动节点
        let acts = await this.model('act').getActsByProcId(proc.id);
//        console.log(acts);
        if(think.isEmpty(acts)){
            await this.addTaskSt(task,user,'流程模板的活动节点设置错误!');
            return task;
        }
        let taskActModel = this.model('fw_task_act');
        let taskActStartID = 0;
        for(let act of acts){
            let md = {c_task:task.id, c_act:act.id, c_status:global.enumTaskActStatus.NO_BEGIN, c_user:user.id, c_time_begin:think.datetime(),
                c_time:think.datetime(), c_memo:'', c_link:0, c_link_type:''};
            md.id = await taskActModel.add(md);
            if(act.c_type === global.enumActType.START){
                taskActStartID = md.id;
            }
        }
        task.c_status = global.enumTaskStatus.RUN;
        await this.updateTask(task);
        await this.addTaskSt(task,user);

        //从开始节点进行run
        await this.model('act').fwRun(taskActStartID,user);

        return task;
    }

    /**
     * 取某个任务的当前状态，当前节点存放于 task.currAct <br/>
     * 子类中重写本方法，可以增加任务的初始化逻辑，比如业务相关的逻辑
     * @method  getTaskWithStatus
     * @return {object}  流程实例对象
     * @params {object} task 流程实例对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程发起人
     */
    async getTaskWithCurrentAct(task,user){
        global.debug(task,'task.getTaskWithCurrentAct --- task');
        task.currAct = {id:0};
        if(task.c_status === global.enumTaskStatus.RUN){
            let taskActs = await this.model('task_act').getTaskActs(task.id);
            for(let ta of taskActs){
                //TODO: 可能要考虑user来进行区分
                //取当前节点
                if(ta.c_status === global.enumTaskActStatus.WAIT || ta.c_status === global.enumTaskActStatus.RUN || ta.c_status === global.enumTaskActStatus.SUSPEND){
                    task.currTaskAct = ta;
                    task.currAct = await this.model('act').getActByIdAndProcId(ta.c_act, task.c_proc);
                    if(ta.c_status === global.enumTaskActStatus.WAIT){
                        task.currAct.btn_style = think.isEmpty(task.currAct.c_btn_style) ? {label:task.currAct.c_name}:eval(`(${task.currAct.c_btn_style})`);
                        task.currAct.form = think.isEmpty(task.currAct.c_form) ? {opentype:'none'}:eval(`(${task.currAct.c_form})`);
                        //设置的前端需要用户操作的界面
                        let form = task.currAct.form;
                        task.currAct.form.opentype = think.isEmpty(form['opentype']) ? 'dialog':form['opentype'];
                        task.currAct.form.id = think.isEmpty(form['id']) ? 'fwForm'+task.currTaskAct.id:form['id'];
                        task.currAct.form.title = think.isEmpty(form['title']) ? task.currAct.c_name:form['title'];
                        if(!think.isEmpty(form['modulename'])){
                            task.currAct.form.url = `/cmpage/page/edit?modulename=${form['modulename']}&id=0&c_task=${task.id}`;
                        }
                        if(think.isEmpty(form['url'])){
                            task.currAct.form.opentype ='none';
                        }
                    }
                    break;
                }
            }
        }

        return task;
    }

    /**
     * 初始化一个的流程实例(任务)<br/>
     * 子类中重写本方法，可以增加任务的初始化逻辑，比如业务相关的逻辑
     * @method  fwInit
     * @return {object}  流程实例对象
     * @params {object} task 流程实例对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程发起人
     */
    async fwInit(task,proc,user){
        task.c_status = global.enumTaskStatus.INIT;
        //如果不满足启动条件，则重置任务状态为： TERMINATE

        return task;
    }

    /**
     * 根据编号规则生成任务编号<br/>
     * 子类中可以重写本方法，实现特殊的编号规则
     * @method  getTaskNo
     * @return {string}  新的任务编号
     * @params {object} proc 流程模板对象
     */
    getTaskNo(proc){
        let no ='';
        if(!think.isEmpty(proc.c_no_format)){
            no = global.datetime(new Date(),'yyMMddHHmmss')+global.getRandomNum(1,10);
        }else{

        }
        return no;
    }

    /**
     * 运行一个流程实例(任务)
     * @method  fwRun
     * @return {object}  流程实例对象
     * @params {object} task 任务对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程执行人
     */
    async fwRun(task,proc,user){
        if(task.c_status === global.enumTaskStatus.SUSPEND){
            task.c_status = global.enumTaskStatus.RUN;
            //让本实例被挂起的节点继续RUN
            let taskActs = await this.model('task_act').getTaskActs(task.id);
            let actModel =this.model('act');
            for(let taskAct of taskActs){
                    actModel.fwRun(taskAct.id,user,taskAct);
            }

            await this.updateTask(task);
            await this.addTaskSt(task,user);
        }
        return task;
    }

    /**
     * 挂起一个流程实例(任务)
     * @method  fwSuspend
     * @return {object}  流程实例对象
     * @params {object} task 任务对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程执行人
     */
    async fwSuspend(task,proc,user){
        if(task.c_status === global.enumTaskStatus.RUN){
            task.c_status = global.enumTaskStatus.SUSPEND;
            //当前活动节点挂起
            let taskActs = await this.model('task_act').getTaskActs(task.id);
            let actModel =this.model('act');
            for(let taskAct of taskActs){
                actModel.fwSuspend(taskAct.id,user,taskAct);
            }

            await this.updateTask(task);
            await this.addTaskSt(task,user);
        }
        return task;
    }

    /**
     * 终止一个流程实例(任务)
     * @method  fwTerminate
     * @return {object}  流程实例对象
     * @params {object} task 任务对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程执行人
     */
    async fwTerminate(task,proc,user){
        if(task.c_status === global.enumTaskStatus.RUN || task.c_status === global.enumTaskStatus.SUSPEND ){
            task.c_status = global.enumTaskStatus.TERMINATE;
            //当前活动节点终止
            let taskActs = await this.model('task_act').getTaskActs(task.id);
            let actModel =this.model('act');
            for(let taskAct of taskActs){
                actModel.fwTerminate(taskAct.id,user,taskAct);
            }

            await this.updateTask(task);
            await this.addTaskSt(task,user);
        }
        return task;
    }

    /**
     * 正常结束一个流程实例(任务)，一般在结束节点执行完成后调用
     * @method  fwEnd
     * @return {object}  流程实例对象
     * @params {object} task 任务对象
     * @params {object} proc 流程模板对象
     * @params {object} user 流程执行人
     */
    async fwEnd(task,proc,user){

        if(task.c_status !== global.enumTaskStatus.RUN || task.c_status === global.enumTaskStatus.SUSPEND ){
            task.c_status = global.enumTaskStatus.END;
            await this.updateTask(task);
            await this.addTaskSt(task,user);
        }
        return task;
    }

    /**
     * 增加流程实例的状态记录，记录流程示例发生状态改变的时间及当时状态
     * @method  addTaskSt
     * @return {int}  记录ID
     * @params {object} task 任务对象
     * @params {object} user 流程执行人
     * @params {string} [desc] 状态描述
     */
    async addTaskSt(task,user,desc){
       // console.log(task);
        if(task.id <=0){
            return 0;
        }
        let md = {c_proc:task.c_proc,c_act:0,c_task:task.id, c_task_act:0, c_time:task.c_time, c_user:user.id, c_status:task.c_status};
        //组成状态描述
        md.c_desc = think.isEmpty(desc) ?  '流程'+ (await this.model('cmpage/utils').getEnumName(task.c_status,'TaskStatus')) : desc;
        md.id = await this.model('fw_task_st').add(md);
        await this.model('fw_task_st_his').add(md);

        return md.id;
    }
    /**
     * 修改流程实例记录，此处可使用缓存机制改进性能
     * @method  updateTask
     * @return {object} 流程实例对象
     * @params {object} task 任务对象
     */
    async updateTask(task){
        await this.model('fw_task').where({id:task.id}).update(task);

        return task;
    }
    ///**
    // * 取流程实例对象，此处可使用缓存机制改进性能
    // * @method  getTask
    // * @return {object} 流程实例对象
    // * @params {object} task 任务对象
    // */
    //async getTask(taskID){
    //    return await this.model('fw_task').where({id:taskID}).find();
    //}
}
