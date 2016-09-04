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
        let parms =JSON.parse(page.parmsUrl);
      return where +' and c_team='+parms.c_team;
    }
    /**
    * 编辑页面保存
    */
    async htmlGetOther(page){
      let parms =JSON.parse(page.parmsUrl);
      return `<a class="btn btn-green" href="/cmpage/page/list?modulename=TeamUserAdd&c_team=${parms.c_team}"
                        data-toggle="dialog" data-options="{id:'pageTeamUserAdd', mask:true, width:800, height:600 }"
                        data-on-close="pageTeamUserEdit_onClose" data-icon="plus">加入用户</a>
                <a class="btn btn-red" href="#" onclick="return TeamUserDelIds(this,${ parms.c_team});"  data-icon="times">剔除</a>
            <script type="text/javascript">
            function TeamUserDelIds(obj, teamID) {
                //alert($('[name="ids"]').val());
                var ids = [];
                $('[name="ids"]').each(function () {
                    if($(this).attr("checked")){
                        ids.push($(this).val());
                    }
                });

                if (ids.length == 0) {
                    $(this).alertmsg("warn", "请选择要剔除出本账套的用户。");
                    return false;
                }

                $(this).alertmsg("confirm", "是否确定要剔除选中的用户？", {
                    okCall: function () {
                        var url = "/admin/code/team_user_del?userIds=" + ids.join(',');
                        $(obj).bjuiajax('doAjax', { url: url, callback: function () {
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
     * 取某个用户登录账套及其所有子帐套
     */
    async getLoginTeams(userID,teamID){
        //假设账套不超过3层
        let codeModel = this.model('code');
        let cnt = await this.model('t_team_user').where({c_team:teamID, c_user:userID}).count();
        if(cnt == 0){
            let teamMd = await codeModel.getCodeById(teamID);
            if(!teamMd || teamMd.c_pid==0){
                return '';
            }
            cnt = await this.model('t_team_user').where({c_team:teamMd.c_pid, c_user:userID}).count();
            if(cnt == 0) {
                let teamMd = await codeModel.getCodeById(teamMd.c_pid);
                if (!teamMd || teamMd.c_pid == 0) {
                    return '';
                }
                cnt = await this.model('t_team_user').where({c_team:teamMd.c_pid, c_user:userID}).count();
                if(cnt ==0 ){
                    return '';
                }
            }
        }
        let teams = await codeModel.getTreeList(teamID);
        //global.debug(teams);
        let ret = [];
        ret.push(teamID);
        for(let team of teams){ ret.push(team.id); }

        return ret.join(',');
    }
}