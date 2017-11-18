'use strict';

/**
 @module cmpage.service
 */

/**
 * cmpage的全局方法和变量设置，置入（Object.assign）thinkjs 的 global 中
 * flow工作流相关部分
 * @class cmpage.cmpage_global_flow
 */

 /**
     * cmpage的全局变量初始化，如enum等
     * 值>0 ,是为了和数据库中其他的参数值设置方式保持一致
     */
    //工作流相关参数
    cmpage.enumProcType = {
        NORMAL:1, NORMAL_name:'常规类型',
        APPROVE:2, APPROVE_name:'审核类型',
        STATUSCHANGE:8, STATUSCHANGE_name:'状态流转'
    };
    cmpage.enumProcWayCreate = {
        MAN:1, MAN_name:'手动执行',
        TRIGGER:2, TRIGGER_name:'自动触发',
        DEFINE:9, DEFINE_name:'自定义'
    };
    cmpage.enumProcAssignType = {
        ALL:1, ALL_name:'所有人',
        DEPT:2, DEPT_name:'部门',
        ROLE:3, ROLE_name:'角色',
        TEAM:4, TEAM_name:'团队',
        USER:5, USER_name:'用户',
        SELF:6, SELF_name:'发起人',
        DEFINE:9, DEFINE_name:'自定义'
    };
    cmpage.enumActType = {
        NORMAL_MAN:1, NORMAL_MAN_name:'人为参与',
        NORMAL_AUTO:2, NORMAL_AUTO_name:'自动执行',
        START:3, START_name:'开始节点',
        DUMMY:4, DUMMY_name:'哑活动',
        END:9, END_name:'结束节点'
    };
    cmpage.enumActFromRule = {
        ORDER:1, ORDER_name:'顺序',
        AND_JOIN:2, AND_JOIN_name:'与汇聚',
        OR_JOIN:3, OR_JOIN_name:'或汇聚',
        VOTES_JOIN:4, VOTES_JOIN_name:'投票汇聚',
        DEFINE:9, DEFINE_name:'自定义'
    };
    cmpage.enumActToRule = {
        ORDER:1, ORDER_name:'顺序',
        AND_SPLIT:2, AND_SPLIT_name:'与分支',
        OR_SPLIT:3, OR_SPLIT_name:'或分支',
        DEFINE:9, DEFINE_name:'自定义'
    };
    cmpage.enumActCcRule = {
        NO:1, NO_name:'不通知',
        MAN:2, MAN_name:'手动通知',
        AUTO:3, AUTO_name:'自动发送',
        MAN_AND_AUTO:4, MAN_AND_AUTO_name:'手动和自动',
        DEFINE:9, DEFINE_name:'自定义'
    };
    cmpage.enumActAssignType = {
        DEPT:2, DEPT_name:'部门',     //可以考虑加入岗位等类型
        ROLE:3, ROLE_name:'角色',
        TEAM:4, TEAM_name:'团队',
        USER:5, USER_name:'用户',
        SELF:6, SELF_name:'发起人',
        PREV:7, PREV_name:'上一步执行者',
        DEFINE:9, DEFINE_name:'自定义'
    };
    cmpage.enumActAssignWay = {
        ALL:1, ALL_name:'所有人',
        LEAST_WORKING_LIST:2, LEAST_WORKING_LIST_name:'最少工作量',   //任务将分配给指定群体中的工作量最少的人员，工作量的多少可以通过TO_DO_TASK_LIST的统计数据得到
        FCFA:3, FCFA_name:'先来先分配',   //（First Coming First Assigning）
        PRIORITY:4, PRIORITY_name:'优先数大者',   //基于优先数分配（c_type==ROLE），每个角色中的人员都有一个优先数，数大者得
        ROUND_ROBIN:5, ROUND_ROBIN_name:'令牌轮转',    //轮转法（c_type==ROLE），ROUND_ROBIN_TOKEN为轮转令牌，任务将分配给携有轮转令牌的人员
        SELECT:6, SELECT_name:'提供选择',   //，上一个活动的执行人来选择
        MANAGER:7, MANAGER_name:'主管'
    };
    cmpage.enumActAssignTypeExe = {
        EXE:1, EXE_name:'执行并无通知',
        EXE_AND_BEFORE_CC:2, EXE_AND_BEFORE_CC_name:'执行并事前通知',
        AFTER_CC:3, AFTER_CC_name:'执行并事后通知'
    };
    cmpage.enumTaskStatus = {
        INIT:1, INIT_name:'初始化',
        RUN:2, RUN_name:'运行中',
        SUSPEND:3, SUSPEND_name:'挂起',
        TERMINATE:4, TERMINATE_name:'终止',
        END:9, END_name:'完成'
    };
    cmpage.enumTaskPriority = {
        NOMAL:1, NOMAL_name:'一般',
        HIGH:2, HIGH_name:'高',
        HIGHER:3, HIGHER_name:'很高',
        HIGHEST:4, HIGHEST_name:'最高',
        LOW:5, LOW_name:'低',
        LOWER:6, LOWER_name:'很低',
        LOWEST:7, LOWEST_name:'最低'
    };
    cmpage.enumTaskActStatus = {
        NO_BEGIN:1, NO_BEGIN_name:'未开始',
        INIT:2, INIT_name:'初始化',
        WAIT:3, WAIT_name:'等待中',
        RUN:4, RUN_name:'运行中',
        SUSPEND:5, SUSPEND_name:'挂起',
        PENDING:6, PENDING_name:'汇聚中',
        TERMINATE:7, TERMINATE_name:'终止',
        END:9, END_name:'完成'
    };

    cmpage.flow = {
        autoExecuting:false
    };

        //暂时不考虑回退和跳转，如有必要，可继承task, task_act来实现具体的某一类业务流程模板
        //cmpage.enumActJumpRule = {
        //    NO: {id:1, c_name:'不能跳转'},
        //    FORWARD: {id:2, c_name:'向前跳转'},
        //    BACK: {id:3, c_name:'向后跳转'},
        //    ANY: {id:4, c_name:'任意跳转'},
        //    DEFINE: {id:9, c_name:'自定义'}
        //};
        //cmpage.enumActBackRule = {
        //    NO: {id:1, c_name:'不能回退'},
        //    PREV: {id:2, c_name:'退到上一步'},
        //    ANY: {id:4, c_name:'退到任意步'},
        //    DEFINE: {id:9, c_name:'自定义'}
        //};

