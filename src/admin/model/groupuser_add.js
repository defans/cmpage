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
import CMPage from '../../common/model/page.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
      let where =await super.getQueryWhere(page);
        let parmsUrl =JSON.parse(page.parmsUrl);
      return where +` and id not in(select c_user from t_group_user where c_group=${parmsUrl.c_group}) `;
    }

    async htmlGetOther(page) {
        let parmsUrl =JSON.parse(page.parmsUrl);
        return `<a class="btn btn-green" href="#" onclick="return GroupUserAddIds(this,${parmsUrl.c_group});" data-icon="plus">加入</a>
            <script type="text/javascript">
                function GroupUserAddIds(obj, groupID) {
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
                    var url = "/admin/code/group_user_add?groupID=" + groupID + "&userIds=" + ids.join(',');
                    $(obj).bjuiajax('doAjax', { url: url });

                    return false;
                }
                function GroupUserAdd(id, obj) {

                    $(this).alertmsg("confirm", "是否确定要加入？",{
                        okCall:function(){
                            var url = "/admin/code/group_user_add/?groupID=" + groupID + "&userIds=" + id;
                            $(obj).bjuiajax('doAjax', { url: url });
                        }
                    });

                    return false;
                }
            </script>`
    }
}