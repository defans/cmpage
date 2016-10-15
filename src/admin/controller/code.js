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
 * 代码与参数模块的RUL接口，包括常用参数设置、权限相关配置
 * @class admin.controller.code
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 取代码树，输入根节点ID为参数 <br/>
     * 点击某个节点，右侧显示其子节点列表，增删改后更新左侧树 <br/>
     * RUL调用如：/admin/code_tree?rootid=1 <br/>
     * @method codeTree
     * @return {promise}   代码树页面
     */
  async codeTreeAction(){
    let vb={};
    vb.rootID=this.http.get('rootid');
    vb.treeID=`codeTree${vb.rootID}`;
    let model = this.model('code');
    vb.list =await model.getTreeList(vb.rootID,true);
//    global.debug(JSON.stringify(vb));
    this.assign('vb',vb);
    return this.display();
  }

    /**
     * 参数选择，查找带回页面，输入根节点ID为参数 <br/>
     * 点击某个节点，右侧显示其子节点列表，选择后返回 <br/>
     * RUL调用如：/admin/code/code_lookup?rootid=1185*multiselect=false <br/>
     * @method codeLookup
     * @return {promise}   参数选择页面
     */
    async codeLookupAction(){
        let vb={};
        vb.rootID=this.http.get('rootid');
        vb.treeID=`codeTree${vb.rootID}`;
        let model = this.model('code');
        vb.list =await model.getTreeList(vb.rootID,true);
//    global.debug(JSON.stringify(vb));
        this.assign('vb',vb);
        return this.display();
    }

    /**
     * 账套用户设置的主界面
     * @method groupUserMain
     * @return {json}
     */
  async groupUserMainAction(){
    let model = this.model('code');
    let treeList =await model.getTreeList(2,true);
    this.assign('treeList',treeList);
    return this.display();
  }

    /**
     * 增加某帐套的用户
     * @method groupUserAdd
     * @return {json}
     */
    async groupUserAddAction(){
        let groupID = this.get('groupID');
        let userIds = this.get('userIds').split(',');
        for(let userID of userIds){
            await this.model('t_group_user').add({c_group:groupID, c_user:userID});
        }
        return this.json({statusCode:200,message:'用户加入成功!'});
    }
    /**
     * 删除某帐套的用户
     * @method groupUserDel
     * @return {json}
     */
    async groupUserDelAction(){
        await this.model('t_group_user').where(` c_user in(${this.get('userIds')})`).delete();
        return this.json({statusCode:200,message:'用户删除成功!'});
    }

    /**
     * 团队用户设置的主界面
     * @method teamUserMain
     * @return {json}
     */
    async teamUserMainAction(){
        let model = this.model('code');
        let treeList =await model.getTreeList(7,true);
        this.assign('treeList',treeList);
        return this.display();
    }

    /**
     * 增加某团队的用户
     * @method teamUserAdd
     * @return {json}
     */
    async teamUserAddAction(){
        let teamID = this.get('teamID');
        let userIds = this.get('userIds').split(',');
        for(let userID of userIds){
            await this.model('t_team_user').add({c_team:teamID, c_user:userID});
        }
        return this.json({statusCode:200,message:'用户加入成功!'});
    }
    /**
     * 删除某团队的用户
     * @method teamUserDel
     * @return {json}
     */
    async teamUserDelAction(){
        await this.model('t_team_user').where(` c_user in(${this.get('userIds')})`).delete();
        return this.json({statusCode:200,message:'用户删除成功!'});
    }

    /**
     * 角色权限设置主界面
     * @method rolePrivilege
     * @return {json}
     */
  async rolePrivilegeAction(){
    let model = this.model('code');
    let treeList =await model.getTreeList(3,true);
//    global.debug(JSON.stringify(vb));
    this.assign('treeList',treeList);
    return this.display();
  }

    /**
     * 某个角色的权限集合展示，树状结构
     * @method roleGetPrivilegeTree
     * @return {json}
     */
  async roleGetPrivilegeTreeAction(){
    let roleID = this.http.post('roleID');
    let treeList =await this.model('privilege').roleGetPrivilegeTree(roleID);
//    global.debug(JSON.stringify(vb));
    return this.json(treeList);
  }

    /**
     * 保存某个角色的权限设置
     * @method roleSavePrivilege
     * @return {json}
     */
  async roleSavePrivilegeAction(){
    let parms =this.http.post();
    //global.debug(rec);
    await this.model('privilege').roleSavePrivilege(parms);
    return this.json({statusCode:200,message:'',data:{}});
  }


    /**
     * 代码树，输入根节点ID为参数 ------- 以下3个操作已废弃，改用 codeTreeAction -----------
     * 直接通过树增删改节点
     * /admin/code?rootid=1
     */
    async codeAction(){
        let vb={};
        vb.rootID=this.http.get('rootid');
        vb.treeID=`code${vb.rootID}`;
        let model = this.model('code');
        vb.list =await model.getTreeList(vb.rootID,true);
        // global.debug(JSON.stringify(vb));
        this.assign('vb',vb);
        return this.display();
    }

    async codeSaveAction(){
        let ret={statusCode:200,message:'',data:{}};
        let parms =this.http.post();
        //global.debug(rec);

        let model = this.model('t_code');
        if(parms.id ==0){
            let rec={};
            Object.keys(parms).map(key=>{if(key !='id'){
                rec[key] =parms[key];
            }});
            ret.data.id =await model.add(rec);
            global.debug(JSON.stringify(ret));
        }else if(parms.id >0){
            ret.data.id =parseInt(parms.id);
            await model.where({id: ret.data.id}).update(parms);
        }

        await this.model('code').clearCodeCache();
        return this.json(ret);
    }

    async codeDelAction(){
        let ret={statusCode:200,message:'',data:{}};
        let parms =this.http.post();
        //global.debug(rec);

        let model = this.model('t_code');
        if(parms.id >0){
            await model.where({id: parms.id}).delete();
        }
        return this.json(ret);
    }

    ztreeAction(){
        return this.display();
    }
}