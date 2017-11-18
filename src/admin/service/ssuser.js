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
 * 用户中心的用户相关的接口调用类
 * @class admin.service.ssuser
 */
const Base =require('../../cmpage/service/base.js');

 module.exports = class extends Base {
    /**
     * constructor
     * @param  {[type]} name   [description]
     * @param  {Object} config [description]
     * @return {[type]}        [description]
     */
    constructor(name, config = {}) {
        super();
        this.to_url = `http://${think.config().ssuser_ip}/api/user${think.config().ssuser_version}`;

    }
    async requestApiUrl(api_name, parms){
        if(think.isObject(parms))   parms = cmpage.parmsToUrl(parms);
        let url = `${this.to_url}/${api_name}?${parms}&sub_system=${think.config().ssuser_sub_system}`;
        try{
            let fnApi = think.promisify(request.get, request);
            let ret = await fnApi({url:url});
            return JSON.parse(ret.body);
        }catch(e){
            return {statusCode:500, message:'URL通讯错误!', data:{}};
        }

    }

    /**
     * 用户登录，调用：/api/v1/sso_login?login_name=xxx&login_pwd=xxxx&ip=xxx&sub_system=xxx&memo=xxx  <br/>
     * 其中 login_pwd 需要MD5加密
     * @method  ssoLogin
     * @return {object}  登录状态对象，{statusCode:xxx, message:xxx, data:{guid:xxx, token:xxx }}
     * @param {object} login  登录信息 {login_name:xxx, login_pwd:xxx, ip:xxx, memo:xxx}
     */
    async ssoLogin(login){
        return await this.requestApiUrl('sso_login',login);
    }

    /**
    * 子系统用token值校验，调用：/api/v1/login_verify?token=xxxx&ip=xxx&subSystem=xxx
    * 其中 loginPwd 需要MD5加密
    * @method  loginVerify
    * @return {json} 登录状态对象，{statusCode:xxx, message:xxx, data:{guid:xxx, token:xxx }}
    */
    async loginVerify(token){
        return await this.requestApiUrl('login_verify',{token:token});
    }

    /**
    * 增加用户信息， 调用：/api/v1/add_user?login_name=xxx&phone=xxx&name=xxx&login_pwd=xxx
    * @method  addUser
    * @return {json} 返回状态 {statusCode:xxx, message:xxx, data:user}
    * @param {object} user  用户信息 {login_name:xxx, login_pwd:xxx, name:xxx, phone:xxx}
    */
    async addUser(user){
        return await this.requestApiUrl('add_user',user);
    }

    /**
    * 修改用户信息， 调用：/api/v1/update_user?guid=xxx&login_name=xxx&name=xxx&phone=xxx
    * @method  updateUser
    * @return {json} 返回修改状态 {statusCode:xxx, message:xxx, data:user}
    * @param {object} user  用户信息 {guid:xxx, login_name:xxx, name:xxx, phone:xxx}
    */
    async updateUser(user){
        return await this.requestApiUrl('update_user',user);
    }

    /**
    * 初始化用户密码， 调用：/api/user1/init_user_pwd?guid=xxx
    * @method  initUserPwd
    * @return {json} 返回修改状态 {statusCode:xxx, message:xxx, data:{guid:xxx, login_pwd:xxx}}}
    */
    async initUserPwd(guid){
        return await this.requestApiUrl('init_user_pwd',{guid:guid});
    }

    /**
    * 更新用户密码， 调用：/api/v1/update_user_pwd?guid=xxx&old_pwd=xxx&new_pwd=xxx
    * 其中 old_pwd,new_pwd 需要MD5加密
    * @method  updateUserPwd
    * @return {json} 返回修改状态 {statusCode:xxx, message:xxx, data:{guid:xxx, old_pwd:xxx, new_pwd:xxx}}}
    * @param {object} user  用户信息 {guid:xxx, old_pwd:xxx, new_pwd:xxx}
    */
    async updateUserPwd(user){
        return await this.requestApiUrl('update_user_pwd',user);
    }

    /**
    * 发送手机验证码， 调用：/api/v1/send_captcha?phone=xxx
    * @method  sendCaptcha
    * @return {json} 返回手机号及验证码 {statusCode:xxx, message:xxx, data:{phone:xxx, catpcha:xxx}}}
    */
    async sendCaptcha(phone){
        return await this.requestApiUrl('send_captcha',{phone:phone});
    }

}
