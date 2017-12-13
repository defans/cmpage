'use strict';

const Base = require('../base.js');

module.exports = class extends Base {


    //   async refresh_crontabAction(){    
    //     let crontabApp = cmpage.service('demo/crontab');
    //     await crontabApp.setConfig();
    //     return this.success_bjui_doajax("执行成功，定时任务已经重新配置!");
    //   }
    async __before() {
        // 如果不是定时任务调用，则拒绝
        if (!this.isCli) {
            return false;
        }
    }

    async testAction() {
        const crontabApp = this.cmpage.service('demo/crontab');
        let cron = await crontabApp.getCrontabByNo('001');
        if (cron) {
            // debug('tttttttttttttttttest');
            // cronApp.addCrontabLog(cron.id, 'tttttttttttttttest');
            return this.success();
        }
        return this.fail();
    }

    //刷新任务列表的缓存
    async refresh_crontabAction() {
        await think.cache("crontabs", null);
        return this.success_bjui_doajax("执行成功，定时任务的缓存已经刷新!");
    }

}