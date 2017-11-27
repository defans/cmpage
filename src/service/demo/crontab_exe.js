'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const Base = require('../cmpage/base.js');

module.exports = class extends Base {
    
    async test(taskID){
        let msg = 'tttttttttttest___'+taskID;
        debug(msg);
        await this.addCrontabLog(taskID,msg,this.cmpage.enumStatusExecute.SUCCESS);

    }

    async addCrontabLog(cronID,msg,status){
        let md = {c_crontab:cronID, c_desc:msg, c_time:cmpage.datetime(), c_status:status, c_memo:'', c_group:0};
        await this.model('t_crontab_log').add(md);
    }

}
