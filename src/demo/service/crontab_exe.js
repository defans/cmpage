'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const Base = require('../../cmpage/service/base.js');

module.exports = class extends Base {
    /**
     * 调度
     * @method  run
     */
    async run(exeRoleStr){
        let exeRole = eval('('+exeRoleStr+')');
        debug(exeRole,'rontab_exe.run - exeRole');
        if(exeRole.url){
            //fetch url 
            const json = await this.fetch(url).then(res => res.json());
            await this.addCrontabLog(md.id, JSON.stringify(json), cmpage.enumStatusExecute.SUCCESS);
        }else{
            //exe function
            if(think.isFunction( this[exeRole.fn] ) ){
                await this[exeRole.fn]();
            }
        }
    }

    async test(){
        debug('tttttttttttest');

    }

    async addCrontabLog(cronID,msg,status){
        let md = {c_crontab:cronID, c_desc:msg, c_time:cmpage.datetime(), c_status:status, c_memo:''};
        await this.model('t_crontab_log').add(md);
    }

}
