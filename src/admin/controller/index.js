'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
import Base from './base.js';
import request from 'request';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
    //auto render template file index_index.html
    let user = await this.session('user');
     // console.log(user);
      let codeMd =await this.model('code').getCodeById(344);    //系统版本
    let vb={groupName:user.groupName,version:codeMd.c_desc,userName:user.c_name,title:'CmPage by defans'};
    let menus = await this.model('privilege').userGetPrivilegeTree(user.id,user.c_role);

    vb.navList=[];  //主菜单
    vb.itemList=[]; //二级导航菜单
    vb.menuList=[];//叶子菜单
    menus.forEach(function(rec){
        if(rec.c_type==='N' && rec.isAllow){
            if(rec.c_pid===1){
                if(vb.navList.length===0){
                    rec.liStyle="class=active";
                }
                vb.navList.push(rec);
            }else{
                vb.itemList.push(rec);
            }
        }else{
            if(rec.c_type=='M' && rec.isAllow){
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
        //let vb ={msg:'请选择您有权限登录的账套。'};
        let vb ={msg:'演示用户：defans  密码：123456'};
        vb.groups = await this.model('code').getGroups();
        if(this.method() == 'get'){
            vb.loginName='';
           // global.debug(vb);
        }else{
            let user = await this.model('user').getUserByLogin(this.post('loginName'),this.post('loginPwd'));
            //global.debug(user);
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
                    user.groups = groups;
                    //console.log(user);
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

    async keepConnectDbAction(){
        let cnt = await this.model('t_code').count();
        if(cnt >0){
            return this.json({statusCode:200, message:'DB is openning '})
        }else{
            return this.json({statusCode:200, message:'DB has closed '})
        }

    }
    //开始定时器
    timerStartAction(){
        if(this.ip() != "127.0.0.1"){
            return this.json({statusCode:300,message:"timer is not start! "+this.ip()});
        }
        if(!think.isObject(global.timer)){
            global.timer = setInterval(function() {
                request('http://127.0.0.1:8300/admin/index/keep_connect_db', function (error, response, body) {
                    if (!error) {
                        console.log(body);
                    } else {
                        //console.log("error: " + error);
                    }
                });
            }, 600000);
            return this.json({statusCode:200,message:"timer is start! "+this.ip()});
        }
        return this.json({statusCode:200,message:"timer has be started! "+this.ip()});
    }

    //停止定时器
    timerStopAction(){
        if(this.ip() != "127.0.0.1"){
            return this.json({statusCode:300,message:"timer is not stop! "+this.ip()});
        }
        if(think.isObject(global.timer)){
            clearInterval(global.timer);
            global.timer = null;
            return this.json({statusCode:200,message:"timer is stop! "+this.ip()});
        }
        return this.json({statusCode:300,message:"timer is not exist! "+this.ip()});
    }


}