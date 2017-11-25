'use strict';

module.exports = class extends think.Controller {
  /**
   * some base method in here
   */
  constructor(ctx){
    super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
    // 其他额外的操作
    this.cmpage = require('../service/cmpage.js');
  }
}