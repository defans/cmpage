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
 * @class admin.service.user
 */
const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {
    /**
     * 重写父类的 getQueryWhere 方法，增加页面模块的条件设置，组合成新的Where子句, c_linktype==1表示关联的是集团用户: c_link = t_emp.id
     * @method  getQueryWhere
     * @return {string}  where条件子句
     * @param {Object} page  页面设置主信息
     */
    async getQueryWhere(){
        let where =await super.getQueryWhere();
        //cmpage.debug(where);
        return where +' and c_status<>-1 and c_linktype=1';
    }
    /**
     * 重写父类的 pageSave 方法，保存参数后清除user的缓存
     * @method  pageSave
     * @return {Object}  保存的数据表记录的对象
     * @param {Object} page  页面设置主信息
     * @param {Object} parms  编辑页面传回的FORM参数
     */
    async pageSave(parms){
        //先保存t_emp
        let md =cmpage.objPropertysFromOtherObj({},parms,['c_name','c_sex','c_phone','c_email','c_qq','c_address','c_memo','c_birthday','c_dept',
            'c_user','c_time','c_group','c_province','c_city','c_country','c_manager']);
        //checkbox类型的值为false时，前端不传值，因此特殊处理
        md.c_sex = think.isEmpty(md.c_sex) ? false: md.c_sex;
        let userMd = { c_role:parms.c_role, c_login_name:parms.c_login_name, c_linktype:1, c_status:1 };
        if(parms.id ==0 ){
            md.id = await this.model('t_emp').add(cmpage.checksql(md));
            userMd.c_link = md.id;
            userMd.c_login_pwd = think.md5('123456');
            userMd.c_guid =think.uuid(32);
            userMd.id = await this.model('t_user').add(cmpage.checksql(userMd));
        }else {
            console.log(md);
            await this.model('t_emp').where({id:parms.c_link}).update(cmpage.checksql(md));
            userMd.c_status = parms.c_status;
            await this.model('t_user').where({id:parms.id}).update(cmpage.checksql(userMd));
            userMd.id = parms.id;
        }

        await think.cache("users",null);  //清除users缓存
        return userMd;
    }

    /**
     * 根据用户ID取用户名称，一般用于页面模块配置中的‘替换’调用: admin/user:getNameById
     * @method  getNameById
     * @return {string}  用户名称
     * @param {int} id  用户ID
     */
    async getNameById(id){
        let users =await this.getUsers();
        for(let user of users){
            if(user.id == id){
                return user.c_name;
            }
        }
        return '';
    }
    /**
     * 根据用户ID取用户对象
     * @method  getNameById
     * @return {object}  用户对象
     * @param {int} id  用户ID
     */
    async getUserById(id){
        let users =await this.getUsers();
        for(let user of users){
            if(user.id == id){
                return user;
            }
        }
        return {};
    }
    /**
     * 根据用户登录名和密码取用户记录对象，
     * @method  getUserByLogin
     * @return {object}  用户信息
     * @param {string} loginName  登录名
     * @param {string} loginPwd  登录密码
     * @param {bool} isMd5  是否是MD5加密过的
     */
    async getUserByLogin(loginName,loginPwd, isMd5){
        let users =await this.getUsers();
        let pwd = isMd5 ? loginPwd.toLowerCase() : think.md5(loginPwd).toLowerCase()
        cmpage.debug(users,'cache - users');
        for(let user of users){            
            if(user.c_login_name == loginName && user.c_login_pwd == pwd){
                return user;
            }
        }
        return {};
    }

    /**
     * 取vw_user的记录，缓存， 按名称排序
     * @method  getUsers
     * @return {Array}  vw_user记录列表
     */
    async getUsers(){
        return await think.cache("users", () => {
            //return this.model('vw_user').order('c_name').select();
            return this.query('select * from vw_user order by  c_name asc');
        });
    }


}
