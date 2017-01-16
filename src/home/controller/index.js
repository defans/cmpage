'use strict';

import Base from './base.js';

export default class extends Base {

    //用户登录界面
    async loginAction(){
        let vb ={msg:'请选择您有权限登录的账套。'};
        if(this.method() == 'get'){
            vb.loginName='';
            vb.action='index';
            cmpage.debug(vb);
        }else{
            let user = await this.model('user').getUserByLogin(this.post('loginName'),this.post('loginPwd'));
            cmpage.debug(user);
            if(!think.isEmpty(user)){
                if(user.c_status != 0){
                    vb.loginName = this.post('loginName');
                    vb.msg = '请等候管理员审核，谢谢！';
                    this.assign('vb',vb);
                    return this.display();
                }
                //判断是否有权限登录所选择的账套
                let groups = this.model('groupuser').getLoginGroups(this.post('loginGroup'), user.id);
                if(think.isEmpty(groups)){
                    vb.loginName = this.post('loginName');
                    vb.msg = '对不起，您不能登录该账套！';
                    this.assign('vb',vb);
                    return this.display();
                }else {
                    user.ip = this.ip();
                    user.urlLast = '/admin/index/index';
                    user.groupID = this.post('loginGroup');
                    user.groupName = this.model('code').getNameById(this.post('loginGroup'));

                    await this.model('login').addLogin(user);
                    await this.session('user', user);
                    return this.redirect('/admin/index/index');
                }
            }else{
                vb.loginName = this.post('loginName');
                vb.msg = '用户名或密码错误！';
                this.assign('vb',vb);
                return this.display();
            }
        }
        this.assign('vb',vb);
        return this.display();
    }

    async exitLoginAction(){
        await this.model('login').exitLogin(await this.session('user'));
        await this.session('user',null);
        return this.redirect('/admin/index/login');
    }

  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
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