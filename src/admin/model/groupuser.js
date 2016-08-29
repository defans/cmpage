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
      //global.debug(where);
        let parms =JSON.parse(page.parmsUrl);
      return where +' and c_group='+parms.c_group;
    }
    /**
    * 编辑页面保存
    */
    async htmlGetOther(page){
      let parms =JSON.parse(page.parmsUrl);
      return `<a class="btn btn-green" href="/cmpage/page/list?modulename=GroupUserAdd&c_group=${parms.c_group}"
                        data-toggle="dialog" data-options="{id:'pageGroupUserAdd', mask:true, width:800, height:600 }"
                        data-on-close="pageGroupUserEdit_onClose" data-icon="plus">加入用户</a>
                <a class="btn btn-red" href="#" onclick="return GroupUserDelIds(this,${ parms.c_group});"  data-icon="times">剔除</a>
            <script type="text/javascript">
            function GroupUserDelIds(obj, groupID) {
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
                        var url = "/admin/code/group_user_del?userIds=" + ids.join(',');
                        $(obj).bjuiajax('doAjax', { url: url, callback: function () {
                            $("#btnSearchGroupUser").click();
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
    async getLoginGroups(userID,groupID){
        //假设账套不超过3层
        let codeModel = this.model('code');
        let cnt = await this.model('t_group_user').where({c_group:groupID, c_user:userID}).count();
        if(cnt == 0){
            let groupMd = await codeModel.getCodeById(groupID);
            if(!groupMd || groupMd.c_pid==0){
                return '';
            }
            cnt = await this.model('t_group_user').where({c_group:groupMd.c_pid, c_user:userID}).count();
            if(cnt == 0) {
                let groupMd = await codeModel.getCodeById(groupMd.c_pid);
                if (!groupMd || groupMd.c_pid == 0) {
                    return '';
                }
                cnt = await this.model('t_group_user').where({c_group:groupMd.c_pid, c_user:userID}).count();
                if(cnt ==0 ){
                    return '';
                }
            }
        }
        let groups = await codeModel.getTreeList(groupID);
        global.debug(groups);
        let ret = [];
        ret.push(groupID);
        for(let group of groups){ ret.push(group.id); }

        return ret.join(',');
    }
}