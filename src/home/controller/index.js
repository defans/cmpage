'use strict';

const Base = require('./base.js');

module.exports = class extends Base {


    async exitLoginAction(){
        await this.model('login').exitLogin(await this.session('user'));
        await this.session('user',null);
        return this.redirect('/admin/index/login');
    }

  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
      let vb={action:'index'};
      this.assign('vb',vb);
    return this.display();
  }
  logAction(){
      let vb={action:'log'};
      this.assign('vb',vb);
      return this.display();
  }
    docAction(){
        let vb={action:'doc'};
        this.assign('vb',vb);
        return this.display();
    }
    faqAction(){
        let vb={action:'faq'};
        this.assign('vb',vb);
        return this.display();
    }

  async codeAction(){

    let model = this.model('pagetest');
    let list =await model.getTreeList(1);

    return this.success(list);
  }
}