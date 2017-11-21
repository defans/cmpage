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
  
    //刷新任务列表的缓存
    async refresh_crontabAction(){    
      // await think.cache("crontabs",null);
      let crontabConfig = `module.exports =[{cron:"*/3 * * * * *",handle:()=>{
        const cronApp = think.service('crontab_exe','demo');
        cronApp.test('888888888888888');
      
      }}]`;

      const fs = require('fs');
      fs.writeFileSync(`${think.ROOT_PATH}/src/demo/config/crontab.js`,`module.exports =${crontabConfig}`);
      return this.success_bjui_doajax("执行成功，定时任务列表已经刷新!");
  }

}