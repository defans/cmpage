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
 * @class admin.service.teamuser
 */
const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {

    /**
     * 重写父类的 htmlGetOther 方法，输出额外的按钮和js函数
     * @method  htmlGetOther
     * @return {string}  html片段
     * @param {Object} page  页面设置主信息
     */
    async htmlGetOther(){
      return `<a class="btn btn-green" href="/cmpage/page/list?modulename=TeamUserAdd&c_team=${this.mod.parmsUrl.c_team}"
                        data-toggle="dialog" data-options="{id:'pageTeamUserAdd', mask:true, width:800, height:600 }"
                        data-on-close="pageTeamUserEdit_onClose" data-icon="plus">加入用户</a>
                <a class="btn btn-red" href="#" onclick="return TeamUserDelIds();"  data-icon="times">剔除</a>
            <script type="text/javascript">
            function TeamUserDelIds() {
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
                            url: "/admin/code/team_user_del?ids=" + ids.join(','),
                            loadingmask: true,
                            okCallback: function(json, options) {
                                $("#btnSearchTeamUser").click();
                            }
                        });
                    }
                });

                return false;
            }
            </script>
        `;
    }

    /**
     * 根据团队ID取团队的成员列表，可用于页面模块配置中的‘替换’调用: admin/teamuser:getUsersByTeamId
     * @method  getUsersByTeamId
     * @return {Array}  团队成员列表
     * @param {int} teamID  团队ID
     */
    async getUsersByTeamId(teamID){
        return await think.cache("teamUsers"+teamID, () => {
            return this.query(`select * from t_team_user where c_team=${teamID} order by id `);
        });
    }
    /**
     * 判断某个用户是否是某个团队的成员
     * @method  isTeamMember
     * @return {boolean}    是否是成员
     * @param {int} teamID  团队ID
     * @param {int} userID  用户ID
     * @param {Array} [users]  成员列表，用来改善性能, 可选项
     */
    async isTeamMember(teamID,userID,users){
        //debug(teamID,'teamuser.isTeamMember - teamID');
        let list =  think.isEmpty(users) ? await this.getUsersByTeamId(teamID) : users;
        for(let md of list){
            if(md.c_user == userID){
                return true;
            }
        }
        return false;
    }


}
