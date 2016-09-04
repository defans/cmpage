'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * model
 */
import CMPage from '../../cmpage/model/page.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        //global.debug(where);
        //let user = await think.session('user');
        where += ` and c_user=${page.user.id}`;

        return where ;
    }

    async addLogin(user){
        //先保存t_login
        //let user = await think.session('user');
        let login ={c_user:user.id, c_ip:user.ip,c_time_login:think.datetime(), c_time_last:think.datetime(), c_url_last:user.urlLast };
        await this.model('t_login').where({c_user:user.id}).delete();
        login.id = await this.model('t_login').add(login);

        //再保存t_login_his
        let loginHis = global.objPropertysFromOtherObj({},login,['c_user','c_ip','c_time_login','c_time_last','c_url_last']);
        loginHis.c_login = login.id;
        await this.model('t_login_his').add(loginHis);
        return login.id;
    }

    async exitLogin(user){
        //let user = await think.session('user');
        let login =  await this.model('t_login').where({c_user:user.id}).find();
        if(login){
            await this.model('t_login_his').where({c_login:login.id}).update({c_time_last:think.datetime(), c_url_last:user.urlLast });
        }
        await this.model('t_login').where({c_user:user.id}).delete();
    }

}