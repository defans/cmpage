'use strict';

const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
    //auto render template file index_index.html
    return this.display();
  }
  
  async refresh_crontabAction(){    
    let crontabApp = cmpage.service('demo/crontab');
    await crontabApp.setConfig();
    return this.success_bjui_doajax("执行成功，定时任务已经重新配置!");
  }
}