
'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../../cmpage/service/page_mob.js');

module.exports = class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(){
        //通过父类的方法取查询列设置解析后的where子句
        let where =await super.getQueryWhere();
        //此处增加额外的条件
        where += ' and c_status<>-1';      //也可以在查询列设置一条 ‘固定’类型的查询列，备注中填： c_status<>-1

        return where;
    }

    /**
     * 根据ID取名称，一般用于页面模块配置中的‘替换’调用: demo/crontab:getNameById
     * @method  getNameById
     * @return {string}  客户名称
     * @param {int} id  客户ID
     */
    async getNameById(id){
        let md = await this.query(`select * from t_crontab where c_id=${id}`);
        if(think.isEmpty(md)) return '';
        return md.c_name;
    }

     /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit(){
        let md = await super.pageEditInit();
        md.c_time_end = '2030-01-01 01:00:00';

        //debug(md,'crotab.pageEditInit - md');
        return md;
    }

    async addCrontabLog(cronID,msg,status){
        let md = {c_crontab:cronID, c_desc:msg, c_time:new Date(), c_status:status || cmpage.enumStatusExecute.SUCCESS, c_memo:''};
        await this.model('t_crontab_log').add(md);
    }
    
     /**
     * 根据编号取任务设置
     * @method  getCrontabByNo
     * @return {object}  任务对象
     * @param {string} no  任务编号
     */
    async getCrontabByNo(no){
        let list = await this.getCrontabList();
        for (const md of list) {
            if(md.c_no === no){
                return md;
            }
        }
        return null;
    }

    /**
     * 取t_crontab记录，缓存
     * @method  getCodes
     * @return {Array}  t_code记录列表
     */
    async getCrontabList(){
        return await think.cache("crontabs", () => {
            return this.query(`select * from t_crontab where c_status=1 and c_time_start <'${cmpage.datetime()} 23:59:59' and c_time_end >'${cmpage.datetime()}' `);
        });
    }

    //  /** 重新配置任务列表
    //  * @method  setConfig
    //  */    
    // async setConfig(){
    //     let crontabList = await this.query(`select * from t_crontab where c_status=1 and c_time_start <'${cmpage.datetime()} 23:59:59' and c_time_end >'${cmpage.datetime()}' `);
    //     let cronConfig = [];  
    //     for(let md of crontabList){
    //         if(think.isEmpty(md.c_cycle_role) || think.isEmpty(md.c_exe_role)){
    //             continue;
    //         }
    //         let task={
    //             cron: md.c_cycle_role,
    //             immediate: true,
    //             handle: () => {
    //                 cmpage.service('demo/crontab_exe').run(md.c_exe_role);
    //             }
    //           };
    //           cronConfig.push(task);
    //     }
    //     debug(cronConfig);
    //     debug(await think.config(''),'old crontab');
    //     await think.config('crontab',cronConfig);
    // }

}
