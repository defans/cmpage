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
        let parmsUrl =JSON.parse(page.parmsUrl);
      return where +` and id not in(select c_user from t_team_user where c_team=${parmsUrl.c_team}) `;
    }

    async htmlGetOther(page) {
        let parmsUrl =JSON.parse(page.parmsUrl);
        return `<a class="btn btn-green" href="#" onclick="return TeamUserAddIds(this,${parmsUrl.c_team});" data-icon="plus">加入</a>
            <script type="text/javascript">
                function TeamUserAddIds(obj, teamID) {
                    //alert($('[name="ids"]').val());
                    var ids = [];
                    $('[name="ids"]').each(function () {
                        if($(this).attr("checked")){
                            ids.push($(this).val());
                        }
                    });

                    if (ids.length == 0) {
                        $(this).alertmsg("warn", "请选择要加入的用户。");
                        return false;
                    }
                    var url = "/admin/code/team_user_add?teamID=" + teamID + "&userIds=" + ids.join(',');
                    $(obj).bjuiajax('doAjax', { url: url });

                    return false;
                }
                function TeamUserAdd(id, obj) {

                    $(this).alertmsg("confirm", "是否确定要加入？",{
                        okCall:function(){
                            var url = "/admin/code/team_user_add/?teamID=" + teamID + "&userIds=" + id;
                            $(obj).bjuiajax('doAjax', { url: url });
                        }
                    });

                    return false;
                }
            </script>`
    }
}