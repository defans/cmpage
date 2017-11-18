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
    await this.cache('crontabs',null);
    return this.success();
  }
}