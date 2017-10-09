'use strict';

const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
      let user = await this.session('user');
      if(think.isEmpty(user)){
          return this.redirect('/dtalk/index/login');
      } 
      return  this.redirect('/dtalk/index/menu');
  }
  async loginAction(){
    await this.session('index_name','dtalk');
    let vb ={msg:'演示账号：defans，密码：123456'};
    let user = await this.session('user');
    if(think.isEmpty(user)){
        vb.loginName = 'defans';
        vb.loginPwd = '123456';
    }else{
        vb.loginName = user.c_login_name;
        vb.loginPwd = '';
    }
    this.assign('vb',vb);
    return this.display();
  }

  async menuAction(){
        let user = await this.session('user');        
        let rootID = 1254;
        let menus = await cmpage.model('admin/privilege').userGetPrivilegeTree(user.id,user.c_role,rootID);
        //debug(menus,'admin.index.getMenuAction - menus');
        let menuHtml =[];
        let navs = [];
        for(let menu of menus){
            if(menu.c_type === 'N' && menu.c_pid == rootID){
                navs.push(menu);
            }
        }
        for(let nav of navs ){
          menuHtml.push(`<div class="mui-card">
                <div class="mui-card-header">${nav.c_name}</div>
                <div class="mui-card-content">
                     <ul class="mui-table-view mui-grid-view mui-grid-9">`);
            for(let menu of menus){
                if(menu.c_pid === nav.id  && menu.c_type === 'M' && menu.isAllow){
                    menuHtml.push(`<li class="mui-table-view-cell mui-media mui-col-xs-4 mui-col-sm-3"><a href="${menu.c_desc}">
				                    <span class="mui-icon mui-icon-chatboxes mui-active"></span>
				                    <div class="mui-media-body">${menu.c_name}</div></a></li>`);
                }
            }
            menuHtml.push('</div>	</div>');
        }
        //debug(menuHtml);
        this.assign('menuHtml',menuHtml.join(''));
        return this.display();    
  }

  async department_listAction(){
      //let ret = await cmpage.model('dtalk/ddserver').postDtalkApi('department/create',{},{name:'testDept', parentid:1});
      let ret = await cmpage.model('dtalk/ddserver').getDtalkApi('department/list');
      //let ret = await cmpage.model('dtalk/ddserver').getDtalkApi('user/simplelist',{department_id:1});
      //debug(ret, 'dserver.getDtalkApi - ret');
      return this.json(ret);

  }
}
