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
     * get version action 取APP版本信息
     * @return {json}
     */
    async getVersionAction(){
        let md = await this.model('code').getCodeById(345);
        return this.json({version:md.c_desc, url:md.c_object,memo :md.c_memo});
    }

    /**
     * get groups action 取账套列表
     * @return {json}
     */
    async getGroupsAction(){
        let list = await this.model('code').getGroups();
        let html =[];
        html.push('<select id="group">');
        for(let md of list){
            html.push(`<option value="${md.id}">${md.c_name}</option>`);
        }

        html.push('</select>');
        let ret =  html.join('');
        //console.log(ret);
        return this.success(ret);
    }

    /**
     * get version action 取APP版本信息
     * @return {json}
     */
    async getMenusAction(){
        let user = await this.session('user');
         //console.log(user);
        let menuList = await this.model('privilege').userGetPrivilegeTree(user.id,user.c_role, 1147);
        let btns = [];
        let navs = [];
        let k =0;
        for(let menu of menuList){
            if(menu.c_type === 'N' && menu.isAllow){
                let nav ={id:menu.id, title:menu.c_name, modules:[]};
                for(let item of menuList){
                    if(item.c_pid === nav.id && item.c_type === 'M'  && (menu.c_memo !== 'btn' || k >=3 )){
                        nav.modules.push({title:item.c_name, modulename:item.c_object, parmsUrl:item.c_other, url:item.c_desc});
                    }
                }
                navs.push(nav);
            }else if(menu.c_type === 'M' && menu.c_memo === 'btn' && k <3  && menu.isAllow){
                k ++;
                btns.push({title:menu.c_name, modulename:menu.c_object, parmsUrl:menu.c_other, url:menu.c_desc});
            }
        }

        return this.json({menus:navs, btns:btns});
    }

  /**
   * login action 用户登录
   * @return {json}
   */
    async loginAction(){
        //let vb ={msg:'请选择您有权限登录的账套。'};
        let vb ={msg:'演示用户：defans  密码：123456'};
        vb.groups = await this.model('code').getGroups();

        let user = await this.model('user').getUserByLoginWithMd5(this.post('loginName'),this.post('loginPwd'));
        //global.debug(user);
        if(!think.isEmpty(user)){
            if(user.c_status != 0){
                return this.json({ id :0, msg : "请等候管理员审核，谢谢！" });
            }
            //判断是否有权限登录所选择的账套
            let groups = this.model('groupuser').getLoginGroups(this.post('loginGroup'), user.id);
            if(think.isEmpty(groups)){
                return this.json({ id :0, msg : "对不起，您不能登录该账套！" });
            }else {
                user.ip = this.ip();
                user.urlLast = '/admin/mob/index';
                user.groupID = parseInt(this.post('loginGroup'));
                user.groupName = await this.model('code').getNameById(user.groupID);
                user.groups = groups;
                await this.model('login').addLogin(user);
                await this.session('user', user);
                return this.json(user);
            }
        }else{
            return this.json({ id :0, msg : "用户名或密码错误！" });
        }
    }

    async exitLoginAction(){
        await this.model('login').exitLogin(await this.session('user'));
        await this.session('user',null);
        return this.redirect('/admin/index/login');
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