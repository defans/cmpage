'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
    //auto render template file index_index.html
    let user = await this.session('user');
     // console.log(user);
    let vb={groupName:user.groupName,version:'V0.8',userName:user.c_name,title:'cmpage by defans'};
    let menus = await this.model('code').getTreeList(1);

    vb.navList=[];  //主菜单
    vb.itemList=[]; //二级导航菜单
    vb.menuList=[];//叶子菜单
    menus.forEach(function(rec){
        if(rec.c_type==='N'){
            if(rec.c_pid===1){
                if(vb.navList.length===0){
                    rec.liStyle="class=active";
                }
                vb.navList.push(rec);
            }else{
                vb.itemList.push(rec);
            }
        }else{
            if(rec.c_type=='M'){
              vb.menuList.push(rec);
            }
        }
    });

    // global.debug(vb.itemList);
    this.assign('vb',vb);
    return this.display();
  }

    //用户登录界面
    async loginAction(){
        let vb ={msg:'请选择您有权限登录的账套。'};
        vb.groups = await this.model('code').getGroups();
        if(this.method() == 'get'){
            vb.loginName='';
            global.debug(vb);
        }else{
            let user = await this.model('user').getUserByLogin(this.post('loginName'),this.post('loginPwd'));
            global.debug(user);
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
                    user.groupID = parseInt(this.post('loginGroup'));
                    user.groupName = await this.model('code').getNameById(user.groupID);

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

    async exitLoginAction(){
        await this.model('login').exitLogin(await this.session('user'));
        await this.session('user',null);
        return this.redirect('/admin/index/login');
    }

    homeAction(){
    return this.display();
  }
  gitAction(){
    return this.display();
  }

    async loginPwdEditAction(){
        if(this.method() === 'get'){
            return this.display();
        }else{
            let user = await this.session('user');
            await this.model('t_user').where({id:user.id}).update({c_login_pwd:think.md5(this.post('newPwd'))});
            await this.cache("users",null);  //清除users缓存
            return this.json({statusCode:200, message:'密码已修改，请牢记！'});
        }
    }



}