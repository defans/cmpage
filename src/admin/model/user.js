'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

import CMPage from '../../cmpage/model/page.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        //global.debug(where);
        return where +' and c_status<>-1 and c_linktype=1';
    }
    /**
     * 编辑页面保存
     */
    async pageSave(page,parms){
        //先保存t_emp
        let md =global.objPropertysFromOtherObj({},parms,['c_name','c_sex','c_phone','c_email','c_qq','c_address','c_memo','c_birthday','c_dept',
            'c_user','c_time','c_group','c_province','c_city','c_country','c_manager']);
        //checkbox类型的值为false时，前端不传值，因此特殊处理
        md.c_sex = think.isEmpty(md.c_sex) ? false: md.c_sex;
        let userMd = { c_role:parms.c_role, c_login_name:parms.c_login_name, c_linktype:1, c_status:0 };
        if(parms.id ==0 ){
            md.id = await this.model('t_emp').add(global.checksql(md));
            userMd.c_link = md.id;
            userMd.c_login_pwd = think.md5('123456');
            userMd.c_guid =think.uuid(32);
            userMd.id = await this.model('t_user').add(global.checksql(userMd));
        }else {
            console.log(md);
            await this.model('t_emp').where({id:parms.c_link}).update(global.checksql(md));
            await this.model('t_user').where({id:parms.id}).update(global.checksql(userMd));
            userMd.id = parms.id;
        }

        await think.cache("users",null);  //清除users缓存
        return userMd;
    }

    async getNameById(id){
        return await this.getUserNameById(id);
    }
    async getUserNameById(id){
        let users =await this.getUsers();
        for(let user of users){
            if(user.id == id){
                return user.c_name;
            }
        }
        return '';
    }

    async getUserByLoginWithMd5(loginName,loginPwd){
        let users =await this.getUsers();
        //global.debug(users);
        for(let user of users){
            if(user.c_login_name == loginName && user.c_login_pwd == loginPwd.toLowerCase()){
                return user;
            }
        }
        return {};
    }
    async getUserByLogin(loginName,loginPwd){
        let users =await this.getUsers();
        //global.debug(users);
        for(let user of users){
            if(user.c_login_name == loginName && user.c_login_pwd == think.md5(loginPwd).toLowerCase()){
                return user;
            }
        }
        return {};
    }


    async getUsers(){
        return await think.cache("users", () => {
            return this.model('vw_user').order('c_name').select();
            //return this.query('select * from vw_user order by  c_name ');
        });
    }


}