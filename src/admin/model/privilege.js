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
export default class extends think.model.base {

    //保存某个角色的权限设置
    async roleSavePrivilege(parms){
        let sql=`delete from t_role_privilege where c_role =${parms.roleID}`;
        await this.execute(sql);

        sql = `insert into t_role_privilege(c_role,c_privilege,c_allow,c_deny) select
			      ${parms.roleID},id,FALSE,TRUE from t_code where id in(${parms.ids})`;
        await this.execute(sql);
    }

    //某个角色的权限树
    async roleGetPrivilegeTree(roleID){
        let list =await this.model('code').getTreeList(1,true);
        //let rps = await this.query(`select * from t_role_privilege where c_role=${roleID} and c_deny=TRUE`);
        let rps = await this.model('t_role_privilege').where({c_role:roleID, c_deny:true}).select();
        for(let privi of list){
            privi.isAllow =true;
            for(let rp of rps){
                if(rp.c_privilege == privi.id){
                    privi.isAllow = false;
                    break;
                }
            }
        }
        return list;
    }

}