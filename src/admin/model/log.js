'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 操作日志 model
 */
import CMPage from '../../cmpage/model/page.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        //global.debug(where);
        //where += ` and c_user=${page.user.id}`;

        return where ;
    }

    /**
     * 增加操作日志
     */
    async addLog(user,msg,moduleID,linkID,logStatus,logType){
        //let user = await think.session('user');
        msg = (msg.length >3800 ? msg.substr(0,3800):msg);
        msg  = think.isObject(msg) ? JSON.stringify(msg).replace(/\"/g,'').replace(/\\/g,'').replace(/,/g,',  ') : msg;
        let md ={c_desc:msg, c_group:user.groupID, c_user:user.id, c_time:think.datetime(),c_module:moduleID,
            c_type:(think.isEmpty(logType) ? 0: logType),c_status:(think.isEmpty(logStatus) ? 0: logStatus),c_link:(think.isEmpty(linkID) ? 0: linkID)};

        return await this.model('t_log').add(global.checksql(md));
    }


}