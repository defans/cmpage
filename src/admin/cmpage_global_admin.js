'use strict';

/**
 @module cmpage.model
 */

/**
 * cmpage的全局方法和变量设置，置入（Object.assign）thinkjs 的 global 中
 * admin用户及权限相关部分
 * @class cmpage.cmpage_global_flow
 */

    /**
     * cmpage的全局变量初始化，如enum等
     * 值>0 ,是为了和数据库中其他的参数值设置方式保持一致
     */
     //用户状态
     cmpage.enumUserStatus = {
        NORMAL:1,   NORMAL_name:'正常',
        NOAUDIT:2,  NOAUDIT_name:'待审核',
        FREEZE:8,   FREEZE_name:'冻结',
        DELETED:-1,  DELETED_name:'删除'
    };


    //题型
    cmpage.enumQuestionWay = {
        SINGLE:1,   SINGLE_name:'单选题',
        MULTIPLE:2,  MULTIPLE_name:'多选题',
        JUDGE:3,   JUDGE_name:'判断题',
        ANSWER:4,   ANSWER_name:'问答题'
    };
    //考生考试状态
    cmpage.enumExamStudentStatus = {
        NODO:1,   NODO_name:'待考试',
        DONE:2,  DONE_name:'已考试',
        MARKED:3,   MARKED_name:'已阅卷',
        DELETED:-1,  DELETED_name:'删除'
    };


