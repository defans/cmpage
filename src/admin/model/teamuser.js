'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
 @module admin.model
 */

/**
 * 账套与用户操作类，并配合界面操作输出相应HTML，
 * @class admin.model.teamuser
 */
import CMPage from '../../cmpage/model/page.js';

export default class extends CMPage {

    /**
     * 重写父类的 htmlGetOther 方法，输出额外的按钮和js函数
     * @method  htmlGetOther
     * @return {string}  html片段
     * @param {Object} page  页面设置主信息
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


}