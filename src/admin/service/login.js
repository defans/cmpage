'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module admin.service
 */

/**
 * 登录用户的操作类，提供一些操作t_user,vw_user的方法
 * @class admin.service.login
 */
const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {
    /**
     * 重写父类的 getQueryWhere 方法，增加页面模块的条件设置，组合成新的Where子句, 取当前用户的登录信息
     * @method  getQueryWhere
     * @return {string}  where条件子句
     * @param {Object} page  页面设置主信息
     */
    async getQueryWhere(){
        let where =await super.getQueryWhere();
        where += ` and c_user=${this.mod.user.id}`;

        return where ;
    }

    /**
     * 增加某个用户的登录信息
     * @method  addLogin
     * @return {int}  登录记录ID
     * @param {object} user  登录用户对象
     */
    async addLogin(user){
        //先保存t_login
        //let user = await think.session('user');
        let login ={c_user:user.id, c_ip:user.ip,c_time_login:think.datetime(), c_time_last:think.datetime(), c_url_last:user.urlLast };
        await this.model('t_login').where({c_user:user.id}).delete();
        login.id = await this.model('t_login').add(login);

        //再保存t_login_his
        let loginHis = cmpage.objPropertysFromOtherObj({},login,['c_user','c_ip','c_time_login','c_time_last','c_url_last']);
        loginHis.c_login = login.id;
        await this.model('t_login_his').add(loginHis);
        return login.id;
    }

    /**
     * 某个用户的退出登录信息
     * @method  addLogin
     * @param {object} user  登录用户对象
     */
    async exitLogin(user){
        //let user = await think.session('user');
        let login =  await this.model('t_login').where({c_user:user.id}).find();
        if(login){
            await this.model('t_login_his').where({c_login:login.id}).update({c_time_last:think.datetime(), c_url_last:user.urlLast });
        }
        await this.model('t_login').where({c_user:user.id}).delete();
    }

}