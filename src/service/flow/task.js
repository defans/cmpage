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
const Base = require('../cmpage/base.js');
module.exports = class extends Base {

    constructor() {
        super();
        this.connStr = 'cmpage';
        this.proc = {}; //当前流程模板
        this.task = {}; //当前流程实例
        this.user = {}; //当前用户
        this.currAct = {}; //当前节点设置
        this.currTaskAct = {}; //当前节点实例
    }

    /**
     * 创建(启动)一个新的流程实例(任务)
     * @method  fwStart
     */
    async fwStart() {

        this.task = {
            c_no: this.getTaskNo(),
            c_proc: this.proc.id,
            c_status: cmpage.enumTaskStatus.RUN,
            c_creater: this.user.id,
            c_time_create: think.datetime(),
            c_priority: cmpage.enumTaskPriority.NOMAL,
            c_user: this.user.id,
            c_time: think.datetime(),
            c_memo: '',
            c_link: 0,
            c_link_type: this.proc.c_link_type
        };

        await this.fwInit();

        if (this.task.c_status !== cmpage.enumTaskStatus.INIT) {
            await this.addTaskSt('模板设置错误，流程终止');
            return;
        }
        await this.save();

        //console.log(task);

        //        console.log(proc);
        let actModel = cmpage.service('flow/act');
        //取该流程模板的节点
        let acts = await actModel.getActsByProcId(this.proc.id);
        //        console.log(acts);
        if (think.isEmpty(acts)) {
            await this.addTaskSt('未找到该流程模板的活动节点!');
            return;
        }
        //按流程走向排序后加入任务节点
        let actsOrder = await actModel.getActsOrder(this.proc.id, acts);
        debug(actsOrder, 'task.fwStart - actsOrder');
        let taskActModel = this.model('fw_task_act');
        let taskActStartID = 0;
        for (let act of actsOrder) {
            let md = {
                c_task: this.task.id,
                c_act: act.id,
                c_status: cmpage.enumTaskActStatus.NO_BEGIN,
                c_user: this.user.id,
                c_time_begin: think.datetime(),
                c_time: think.datetime(),
                c_memo: '',
                c_link: 0,
                c_link_type: ''
            };
            md.id = await taskActModel.add(md);
            if (act.c_type === cmpage.enumActType.START) {
                taskActStartID = md.id;
            }
        }

        this.task.c_status = cmpage.enumTaskStatus.RUN;
        await this.save();

        //从开始节点进行run
        return await actModel.fwRun(taskActStartID, this.user);

    }

    /**
     * 取某个任务的当前状态，当前节点存放于 task.currAct <br/>
     * 子类中重写本方法，可以增加任务的初始化逻辑，比如业务相关的逻辑
     * @method  getTaskWithStatus
     * @return {object} 当前节点的模板对象
     */
    async getTaskWithCurrentAct(task) {
        if (think.isEmpty(this.task)) {
            this.task = task;
        }
        //debug(this.task,'task.getTaskWithCurrentAct --- this.task');
        this.currAct = {
            id: 0
        };
        if (this.task.c_status === cmpage.enumTaskStatus.RUN) {
            let taskActs = await cmpage.service('flow/task_act').getTaskActs(this.task.id);
            let actModel = cmpage.service('flow/act');
            for (let ta of taskActs) {
                //TODO: 可能要考虑user来进行区分
                //取当前节点
                if (ta.c_status === cmpage.enumTaskActStatus.WAIT || ta.c_status === cmpage.enumTaskActStatus.RUN || ta.c_status === cmpage.enumTaskActStatus.SUSPEND) {
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
    async fwInit() {
        this.task.c_status = cmpage.enumTaskStatus.INIT;
        //如果不满足启动条件，则重置任务状态为： TERMINATE

    }

    /**
     * 根据编号规则生成任务编号<br/>
     * 子类中可以重写本方法，实现特殊的编号规则
     * @method  getTaskNo
     * @return {string}  新的任务编号
     */
    getTaskNo() {
        let no = '';
        if (!think.isEmpty(this.proc.c_no_format)) {
            no = cmpage.datetime(new Date(), 'yyMMddHHmmss') + cmpage.getRandomNum(1, 10);
        } else {

        }
        return no;
    }

    /**
     * 运行一个流程实例(任务)
     * @method  fwRun
     */
    async fwRun() {
        if (this.task.c_status === cmpage.enumTaskStatus.SUSPEND) {
            this.task.c_status = cmpage.enumTaskStatus.RUN;
            //让本实例被挂起的节点继续RUN
            let taskActs = await cmpage.service('flow/task_act').getTaskActs(this.task.id);
            for (let taskAct of taskActs) {
                if (taskAct.c_status === cmpage.enumTaskActStatus.SUSPEND) {
                    await cmpage.service('flow/act').fwRun(taskAct.id, this.user, taskAct);
                }
            }
            await this.save();
        }
    }

    /**
     * 挂起一个流程实例(任务)
     * @method  fwSuspend
     */
    async fwSuspend() {
        if (this.task.c_status === cmpage.enumTaskStatus.RUN) {
            this.task.c_status = cmpage.enumTaskStatus.SUSPEND;
            //当前活动节点挂起
            if (think.isEmpty(this.currTaskAct)) {
                await this.getTaskWithCurrentAct();
            }
            await cmpage.service('flow/act').fwSuspend(this.currTaskAct.id, user, this.currTaskAct);
            await this.save();
        }
    }

    /**
     * 终止一个流程实例(任务)
     * @method  fwTerminate
     */
    async fwTerminate() {
        if (this.task.c_status === cmpage.enumTaskStatus.RUN || this.task.c_status === cmpage.enumTaskStatus.SUSPEND) {
            this.task.c_status = cmpage.enumTaskStatus.TERMINATE;
            //当前活动节点终止
            //if(think.isEmpty(this.currTaskAct)){
            //    await this.getTaskWithCurrentAct();
            //}
            //await this.model('act').fwTerminate(this.currTaskAct.id,user,this.currTaskAct);
            let taskActs = await cmpage.service('flow/task_act').getTaskActs(this.task.id);
            for (let ta of taskActs) {
                if (ta.c_status !== cmpage.enumTaskActStatus.TERMINATE && ta.c_status !== cmpage.enumTaskActStatus.END &&
                    ta.c_status !== cmpage.enumTaskActStatus.NO_BEGIN) {
                    await this.model('fw_task_act', cmpage).where({
                        id: ta.id
                    }).update({
                        c_status: enumTaskActStatus.TERMINATE,
                        c_time: think.datetime(),
                        c_user: this.user.id
                    });
                }
            }
            //调用主关联业务模块的终止函数
            if (!think.isEmpty(this.proc.c_link_model)) {
                let fnModel = cmpage.service(this.proc.c_link_model);
                if (think.isFunction(fnModel['fwTerminate'])) {
                    await fnModel['fwTerminate'](this.task, this.user);
                }
            }
            await this.save();
        }
    }

    /**
     * 正常结束一个流程实例(任务)，一般在结束节点执行完成后调用
     * @method  fwEnd
     */
    async fwEnd() {
        if (this.task.c_status !== cmpage.enumTaskStatus.RUN || this.task.c_status === cmpage.enumTaskStatus.SUSPEND) {
            this.task.c_status = cmpage.enumTaskStatus.END;
            await this.save();
        }
    }

    /**
     * 增加流程实例的状态记录，记录流程示例发生状态改变的时间及当时状态
     * @method  addTaskSt
     * @params {string} [desc] 状态描述
     */
    async addTaskSt(desc) {
        // console.log(task);
        let task = this.task;
        if (task.id <= 0) {
            return 0;
        }
        let md = {
            c_proc: task.c_proc,
            c_act: 0,
            c_task: task.id,
            c_task_act: 0,
            c_time: task.c_time,
            c_user: this.user.id,
            c_status: task.c_status
        };
        //组成状态描述
        md.c_desc = think.isEmpty(desc) ? '流程' + (await cmpage.service('cmpage/utils').getEnumName(task.c_status, 'TaskStatus')) : desc;
        md.id = await this.model('fw_task_st').add(md);
        await this.model('fw_task_st_his').add(md);

        return md.id;
    }
    /**
     * 保存程实例记录，此处可使用缓存机制改进性能
     * @method  save
     */
    async save() {
        if (this.task.id > 0) {
            await this.model('fw_task').where({
                id: this.task.id
            }).update(this.task);
        } else {
            this.task.id = await this.model('fw_task').add(this.task);
        }
        await this.addTaskSt();
    }

    /**
     * 取流程实例对象，此处可使用缓存机制改进性能
     * @method  getTask
     * @return {object} 流程实例对象
     * @params {int} taskID 任务对象ID
     */
    async getTask(taskID) {
        return await this.model('fw_task').where({
            id: taskID
        }).find();
    }

    /**
     * 取流程实例的创建用户对象，供没有特定用户，如自动执行等操作调用
     * @method  getUserFromTask
     * @return {object} 流程实例的用户对象
     * @params {int} taskID 任务对象ID
     */
    async getUserFromTask(taskID) {
        let task = await this.model('fw_task').where({
            id: taskID
        }).find();
        let user = await cmpage.service('admin/user').getUserById(task.c_user);
        user.groupID = task.c_group;

        return user;
    }

    /**
     * 取流程实例对象的轨迹图,<br/>
     * 先取流程模板的图片数据，然后修改当前节点和执行路径的属性值
     * @method  getFlowMap
     * @return {string} 流程图形的字符串
     * @params {int} taskID 任务对象ID
     */
    async getFlowMap(taskID) {
        let task = await this.getTask(taskID);
        let proc = await this.model('fw_proc').where({
            id: task.c_proc
        }).find();
        if (think.isEmpty(proc.c_map)) {
            return '{states:{},paths:{},props:{props:{}}}';
        }
        let flowMap = cmpage.objFromString(proc.c_map);
        let taskActs = await this.query(`select A.*,B.c_map_id from fw_task_act A, fw_act B where A.c_act=B.id and A.c_task=${taskID}`);

        for (let k in flowMap.paths) {
            flowMap.paths[k].votes = 0;
        }
        for (let ta of taskActs) {
            if (ta.c_status === cmpage.enumTaskActStatus.WAIT || ta.c_status === cmpage.enumTaskActStatus.SUSPEND ||
                ta.c_status === cmpage.enumTaskActStatus.END || ta.c_status === cmpage.enumTaskActStatus.PENDING) {
                //执行路径
                for (let k in flowMap.paths) {
                    if (flowMap.paths[k].from === ta.c_map_id || flowMap.paths[k].to === ta.c_map_id) {
                        flowMap.paths[k].votes += 1;
                    }
                }
            }
            if (ta.c_status === cmpage.enumTaskActStatus.WAIT || ta.c_status === cmpage.enumTaskActStatus.SUSPEND || ta.c_status === cmpage.enumTaskActStatus.PENDING) {
                //当前节点
                debug(ta, 'task.getFlowMap - ta-current');
                debug(flowMap.states[ta.c_map_id], 'task.getFlowMap - flowMap.states[ta.c_map_id]');
                if (flowMap.states[ta.c_map_id]) {
                    flowMap.states[ta.c_map_id].attr.stroke = '#ff0000';
                }
            } else if (ta.c_status === cmpage.enumTaskActStatus.END) {
                //历史节点
                if (flowMap.states[ta.c_map_id]) {
                    flowMap.states[ta.c_map_id].attr.stroke = '#e87e38';
                }
            } else if (ta.c_status === cmpage.enumTaskActStatus.TERMINATE) {
                //被终止节点
                if (flowMap.states[ta.c_map_id]) {
                    flowMap.states[ta.c_map_id].attr.stroke = '#000000';
                }
            }
        }
        for (let k in flowMap.paths) {
            if (flowMap.paths[k].votes === 2) { //执行路径
                flowMap.paths[k].attr = {
                    path: {
                        stroke: '#ff6600'
                    },
                    arrow: {
                        stroke: '#ff6600',
                        fill: "#ffb584"
                    }
                };
            }
        }

        debug(flowMap.states, 'task.getFlowMap - flowMap.states');
        return cmpage.objToString(flowMap);
    }

}