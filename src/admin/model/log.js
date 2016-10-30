'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module admin.model
 */

/**
 * 系统操作的日志模块
 * @class admin.model.log
 */
import CMPage from '../../cmpage/model/page.js';

export default class extends CMPage {
    /**
     * 重写父类的 getQueryWhere 方法，增加页面模块的条件设置，剔除已经加入该账套的用户，组合成新的Where子句
     * @method  getQueryWhere
     * @return {string}  where条件子句
     * @param {Object} page  页面设置主信息
     */
    async getQueryWhere(){
        let where =await super.getQueryWhere();
        //global.debug(where);
        //where += ` and c_user=${page.user.id}`;

        return where ;
    }

    /**
     * 增加操作日志
     * @method  addLog
     * @return {int}  日志记录ID
     * @param {int} user  用户对象
     * @param {string} msg 日志内容
     * @param {int} moduleID  业务模块ID
     * @param {int} [linkID]  关联的记录ID
     * @param {int} [logStatus]  日志状态， global.enum
     * @param {int} [logType]  日志类型，global.enum
     */
    async addLog(user,msg,moduleID,linkID,logStatus,logType){
        //global.debug(logStatus,'log.addlog -- logStatus');
        msg = (msg.length >3800 ? msg.substr(0,3800):msg);
        msg  = think.isObject(msg) ? JSON.stringify(msg).replace(/"/g,'').replace(/\\/g,'').replace(/,/g,',  ') : msg;
        let md ={c_desc:msg, c_group:user.groupID, c_user:user.id, c_time:think.datetime(),c_module:moduleID,
            c_type:(think.isEmpty(logType) ? 0: logType),c_status:(think.isEmpty(logStatus) ? 0: logStatus),c_link:(think.isEmpty(linkID) ? 0: linkID)};

        return await this.model('t_log').add(global.checksql(md));
    }


}