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
 * 移动端APP的admin模块的RUL接口，包括用户登录、取菜单、版本信息等
 * 由于移动端和PC端的表现方式和功能有所差别，因此部分URL接口单独实现
 * @class admin.controller.mob
 */
const Base = require('./base.js');

module.exports = class extends Base {
     /**
     *  取APP的版本信息，用户比较APP的版本，并自动更新资源包
     * @method getVersion
     * @return {json} 版本信息，包括新版资源包的URL
     */
    async get_versionAction(){
        let md = await this.model('code').getCodeById(345);
        return this.json({version:md.c_desc, url:md.c_object,memo :md.c_memo});
    }

    /**
     * 取账套列表
     * @method getGroups
     * @return {json}   HTML片段，用于下拉选择登陆账套等
     */
    async get_groupsAction(){
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
     * 取APP菜单和按钮的列表
     * @method getMenus
     * @return {json}  备注中设置'btn'的为按钮，其他为菜单
     */
    async get_menusAction(){
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
                        nav.modules.push({title:item.c_name, modulename:item.c_object.replace('mob.',''), parmsUrl:item.c_other,
                            url: think.isEmpty(item.c_desc) ? '../cmpage/cmpage-list.html' : item.c_desc });
                    }
                }
                navs.push(nav);
            }else if(menu.c_type === 'M' && menu.c_memo === 'btn' && k <3  && menu.isAllow){
                k ++;
                btns.push({title:menu.c_name, modulename:menu.c_object.replace('mob.',''), parmsUrl:menu.c_other,
                    url: think.isEmpty(menu.c_desc) ? '../cmpage/cmpage-list.html' : menu.c_desc });
            }
        }

        return this.json({menus:navs, btns:btns});
    }

  /**
   * 用户登录,包括验证账套、角色等
   * @method    login
   * @return {json}
   */
    async loginAction(){
        //let vb ={msg:'请选择您有权限登录的账套。'};
        let vb ={msg:'演示用户：defans  密码：123456'};
        vb.groups = await this.model('code').getGroups();

        let user = await this.model('user').getUserByLogin(this.post('loginName'),this.post('loginPwd'),true);
        //cmpage.debug(user);
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

    /**
     * 退出登录,同时注销session 设置
     * @method    exitLogin
     * @return {json}
     */
    async exit_loginAction(){
        await this.model('login').exitLogin(await this.session('user'));
        await this.session('user',null);
        return this.redirect('/admin/index/login');
    }

    /**
     * 修改用户密码
     * @method   loginPwdEdit
     * @return {json}
     */
    async login_pwd_editAction(){
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
