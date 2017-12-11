'use strict';

module.exports = class extends think.Controller {
  /**
   * some base method in here
   */
  indexAction(){
      this.ctx.redirect('/admin/index/index');
  }
}