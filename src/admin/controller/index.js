'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
    @module admin.controller
 */

/**
 * admin.controller的index类，提供了PC端后台管理系统的用户登录、菜单显示等URL接口
 * @class admin.controller.index
 */
import Base from './base.js';
import request from 'request';

export default class extends Base {
  /**
   * 系统首页，加载符合权限的菜单、加载前端BJUI框架等
   * @method  index
   * @return {Promise}
   */
  async indexAction(){
    //auto render template file index_index.html
    let user = await this.session('user');
     // console.log(user);
      let codeMd =await this.model('code').getCodeById(344);    //系统版本
    let vb={groupName:user.groupName,version:codeMd.c_desc,userName:user.c_name,title:'CmPage by defans'};
    let menus = await this.model('privilege').userGetPrivilegeTree(user.id,user.c_role);

      //取主菜单
      let menuHtml = [];
      let firstMenu = true;
      for(let menu of menus){
          if(menu.c_type === 'N' && menu.c_pid ===1 ){
              menuHtml.push(`<li ${firstMenu ? 'class="active"':''}><a href="/admin/index/get_menu?root_id=${menu.id}" data-toggle="sidenav"
                     data-tree-options="{onClick:MainMenuClick}" data-id-key="targetid">${menu.c_name}</a></li>`)
              firstMenu = false;
          }
      }
      vb.menuHtml = menuHtml;

    // cmpage.debug(vb.itemList);
    this.assign('vb',vb);
    return this.display();
  }
    /**
     * 用户密码修改页面，get方式显示编辑页面，post方式执行密码修改
     * @method  loginPwdEdit
     * @return {Promise}
     */
    async getMenuAction(){
        let user = await this.session('user');
        let rootID = this.get('root_id');
        let menus = await this.model('privilege').userGetPrivilegeTree(user.id,user.c_role,rootID);
        let ret =[];
        let nav = [];
        for(let menu of menus){
            if(menu.c_pid === rootID && menu.c_type === 'M'){
                menu.external = (menu.c_object === 'Module');
                nav.push({id:`page${menu.c_object.split('.').join('')}`, name:menu.c_name, target:'navtab',
                    url:menu.c_desc, external:menu.external});
            }
        }
        if(nav.length >0){
            ret.push({name:await this.model('code').getNameById(rootID), children:nav});
        }
        let navs = [];
        for(let menu of menus){
            if(menu.c_type === 'N'){
                navs.push(menu);
            }
        }
        for(let n of navs ){
            nav = [];
            for(let menu of menus){
                if(menu.c_pid === n.id  && menu.c_type === 'M'){
                    menu.external = (menu.c_object === 'Module');
                    nav.push({id:`page${menu.c_object.split('.').join('')}`, name:menu.c_name, target:'navtab',
                        url:menu.c_desc, external:menu.external});
                }
            }
            if(nav.length >0){
                ret.push({name:n.c_name, children:nav});
            }
        }

        return this.json(ret);
    }

    /**
     * 用户登录界面，get方式显示登录页面，post方式执行用户登录，如果成功则将用户信息写入session并引导到index页面,
     * 期间判断是否有权限登录所选择的账套
     * @method  login
     * @return {Promise}
     */
    async loginAction(){
        //let vb ={msg:'请选择您有权限登录的账套。'};
        let vb ={msg:'演示用户：defans  密码：123456'};
        vb.groups = await this.model('code').getGroups();
        if(this.method() == 'get'){
            vb.loginName='';
           // cmpage.debug(vb);
        }else{
            let user = await this.model('user').getUserByLogin(this.post('loginName'),this.post('loginPwd'));
            //cmpage.debug(user);
            if(!think.isEmpty(user)){
                if(user.c_status != 0){
                    vb.loginName = this.post('loginName');
                    vb.msg = '请等候管理员审核，谢谢！';
                    this.assign('vb',vb);
                    return this.display();
                }
                //判断是否有权限登录所选择的账套
                let groups = await this.model('groupuser').getLoginGroups(this.post('loginGroup'), user.id);
                if(think.isEmpty(groups)){
                    vb.loginName = this.post('loginName');
                    vb.msg = '对不起，您不能登录该账套！';
                    this.assign('vb',vb);
                    return this.display();
                }else {
                    user.ip = this.ip();
                    user.urlLast = '/admin/index/index';
                    user.groupID = parseInt(this.post('loginGroup'));
                    user.groupName = await this.model('code').getNameById(user.groupID);
                    user.groups = groups;
                    let width = think.isEmpty(this.post('clientWidth')) ? 1200 : this.post('clientWidth');
                    user.listColumns = width >=1200 ? cmpage.ui.enumListColumns.MAX : (width >=970 ? cmpage.ui.enumListColumns.MIDDLE :
                        (width >=768 ? cmpage.ui.enumListColumns.SMALL : cmpage.ui.enumListColumns.MOBILE ));
                    user.listBtns = width >=1200 ? cmpage.ui.enumListBtns.MAX : (width >=970 ? cmpage.ui.enumListBtns.MIDDLE :
                        (width >=768 ? cmpage.ui.enumListBtns.SMALL : cmpage.ui.enumListBtns.MOBILE ));
                    user.queryColumns = width >=1200 ? cmpage.ui.enumQueryColumns.MAX : (width >=970 ? cmpage.ui.enumQueryColumns.MIDDLE :
                        (width >=768 ? cmpage.ui.enumQueryColumns.SMALL : cmpage.ui.enumQueryColumns.MOBILE ));

                    debug(user,'admin.index.C.login - user');
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
        vb.msgCount = 0;
        this.assign('vb',vb);
        return this.display();
    }

    /**
     * 用户登出，清除session中的用户信息并引导至用户登录页面
     * @method  exitLogin
     * @return {Promise}
     */
    async exitLoginAction(){
        await this.model('login').exitLogin(await this.session('user'));
        await this.session('user',null);
        return this.redirect('/admin/index/login');
    }

    /**
     * 用户密码修改页面，get方式显示编辑页面，post方式执行密码修改
     * @method  loginPwdEdit
     * @return {Promise}
     */
    async loginPwdEditAction(){
        if(this.method() === 'get'){
            return this.display();
        }else{
            let user = await this.session('user');
            await this.model('t_user').where({id:user.id}).update({c_login_pwd:think.md5(this.post('newPwd'))});
            await this.cache("users",null);  //清除users缓存
            return this.json({statusCode:200, message:'密码已修改，请牢记！',closeCurrent:true});
        }
    }

    async setClientWidthAction(){
        let user = await this.session('user');
        let width = think.isEmpty(this.get('width')) ? 1200 : this.get('width');
        user.listColumns = width >=1200 ? cmpage.ui.enumListColumns.MAX : (width >=970 ? cmpage.ui.enumListColumns.MIDDLE :
            (width >=768 ? cmpage.ui.enumListColumns.SMALL : cmpage.ui.enumListColumns.MOBILE ));
        user.listBtns = width >=1200 ? cmpage.ui.enumListBtns.MAX : (width >=970 ? cmpage.ui.enumListBtns.MIDDLE :
            (width >=768 ? cmpage.ui.enumListBtns.SMALL : cmpage.ui.enumListBtns.MOBILE ));
        user.queryColumns = width >=1200 ? cmpage.ui.enumQueryColumns.MAX : (width >=970 ? cmpage.ui.enumQueryColumns.MIDDLE :
            (width >=768 ? cmpage.ui.enumQueryColumns.SMALL : cmpage.ui.enumQueryColumns.MOBILE ));
        await this.session('user', user);
        return this.json({statusCode:200, message:''});
    }

    //开始定时器
    autoExecOpenAction(){
        if(this.ip() != "127.0.0.1"){
            return this.json({statusCode:300,message:"timer is not start, ! "+this.ip()});
        }
        if(!think.isObject(cmpage.autoExecTimer)){
            cmpage.autoExecTimer = setInterval(function() {
                request('http://127.0.0.1:8300/flow/task/auto_exec', function (error, response, body) {
                    if (!think.isEmpty(error)) {
                        //console.log(body);
                        debug(body,'admin.C.autoExecOpen - error');
                    } else {
                        //console.log("error: " + error);
                    }
                    cmpage.flow.autoExecuting =false;
                });
            }, 3000);
            return this.json({statusCode:200,message:"timer is start! "+this.ip()});
        }
        return this.json({statusCode:200,message:"timer has be started! "+this.ip()});
    }

    //停止定时器
    autoExecCloseAction(){
        if(this.ip() != "127.0.0.1"){
            return this.json({statusCode:300,message:"timer is not stop! "+this.ip()});
        }
        if(think.isObject(cmpage.autoExecTimer)){
            clearInterval(cmpage.autoExecTimer);
            cmpage.autoExecTimer = null;
            return this.json({statusCode:200,message:"timer is stop! "+this.ip()});
        }
        return this.json({statusCode:300,message:"timer is not exist! "+this.ip()});
    }

    installAction(){
        if(this.ip() != "127.0.0.1"){
            return this.json({statusCode:300,message:"You should install on localhost! "+this.ip()});
        }
        return this.display();
    }

    homeAction(){
        return this.display();
    }
    gitAction(){
        return this.display();
    }

}
