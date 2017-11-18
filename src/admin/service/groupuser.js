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
 * 账套与用户操作类，并配合界面操作输出相应HTML，
 * @class admin.service.groupuser
 */
const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {

    /**
     * 重写父类的 htmlGetOther 方法，输出额外的按钮和js函数
     * @method  htmlGetOther
     * @return {string}  html片段
     */
    async htmlGetOther(){
        //cmpage.debug(this.mod,'groupuser.htmlGetOther - this.mod');
      return `<a class="btn btn-green" href="/cmpage/page/list?modulename=GroupUserAdd&c_group=${this.mod.parmsUrl.c_group}"
                        data-toggle="dialog" data-options="{id:'pageGroupUserAdd', mask:true, width:800, height:600 }"
                        data-on-close="pageGroupUserEdit_onClose" data-icon="plus">加入用户</a>
                <a class="btn btn-red" href="#" onclick="return GroupUserDelIds();"  data-icon="times">剔除</a>
            <script type="text/javascript">
            function GroupUserDelIds( ) {
                //alert($('[name="ids"]').val());
                var ids = [];
                $('[name="ids"]').each(function () {
                    if($(this).parent().hasClass("checked")){
                        ids.push($(this).val());
                    }
                });

                if (ids.length == 0) {
                    $(this).alertmsg("warn", "请选择要剔除出本账套的用户。");
                    return false;
                }

                $(this).alertmsg("confirm", "是否确定要剔除选中的用户？", {
                    okCall: function () {
                        BJUI.ajax('doajax', {
                            url: "/admin/code/group_user_del?ids=" + ids.join(','),
                            loadingmask: true,
                            okCallback: function(json, options) {
                                $("#btnSearchGroupUser").click();
                            }
                        });
                    }
                });

                return true;
            }
            </script>
        `;
    }

    /**
     * 取某个用户登录账套及其所有子帐套
     * @method  getLoginGroups
     * @return {string}  账套ID组成的字符串，如： 1,2,3
     * @param {int} userID  用户ID
     * @param {int} groupID  当前登录的账套ID
     */
    async getLoginGroups(groupID,userID){
        let codeModel = cmpage.service('admin/code');
        let cnt = await this.model('t_group_user').where({c_group:groupID, c_user:userID}).count();
        let k = 1;
        let groupMd = await codeModel.getCodeById(groupID);
        if(!groupMd && userID!=1){
            return '';
        }
        //假设账套不超过 4 层
        while(k <5 && cnt ==0){
            //debug(groupMd,'admin.groupuser - groupMd');
            if(!groupMd || groupMd.c_pid==0){
                return '';
            }
            cnt = await this.model('t_group_user').where({c_group:groupMd.c_pid, c_user:userID}).count();
            groupMd = await codeModel.getCodeById(groupMd.c_pid);
            k += 1;
        }
        if(cnt ==0 && userID!=1) return '';

        let groups = await codeModel.getTreeList(groupID);
        //debug(groups,'groupuser.getLoginGroups - groups');
        let ret = [];
        ret.push(groupID);
        for(let group of groups){ ret.push(group.id); }

        return ret.join(',');
    }

    /**
     * 取某个用户的默认账套ID
     * @method  getDefaultGroupID
     * @return {int}  默认账套ID
     * @param {int} userID  用户ID
     * @param {int} groupID  待验证的账套ID，如果通过则返回
     */
    async getDefaultGroupID(userID,groupID){
        if(userID == 1)  return 2;   //超级管理员指定为最大账套
        if(!think.isEmpty(groupID)){
            let cnt = await this.model('t_group_user').where({c_group:groupID, c_user:userID}).count();
            if(cnt >0)  return groupID;
        }else{
            let list = await this.model('t_group_user').where({c_user:userID}).select();
            if(list.length >0)  return list[0].c_group;
            return 0;
        }
    }

}
