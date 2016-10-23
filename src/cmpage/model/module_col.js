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
 * 加入账套的待选择列表
 * @class admin.model.groupuser_add
 */
import CMPage from './page.js';

export default class extends CMPage {

    /**
     * 重写父类的 htmlGetOther 方法，输出额外的按钮和js函数，
     * @method  htmlGetOther
     * @return {string}  html片段
     * @param {Object} page  页面设置主信息
     */
    async htmlGetOther(page) {
        let parmsUrl =JSON.parse(page.parmsUrl);
        return `<a class="btn btn-blue" href="#" onclick="return pageModuleColReset();" data-icon="gear">重新设置</a>
                <button type="button" class="btn-orange" data-toggle="navtab"
                    data-options="{id:'module_preview', url:'/cmpage/page/list?modulename=${await this.model('module').getNameById(parmsUrl.c_module)}', title:'模块预览'}">预览</button>
            <script type="text/javascript">
                function pageModuleColReset() {
                    BJUI.ajax('doajax', {
                        url: '/cmpage/module/col_reset?moduleid=${parmsUrl.c_module}',
                        loadingmask: true,
                        okCallback: function(json, options) {
                            if(json.statusCode == 200){
                                BJUI.navtab('refresh');
                            }
                        }
                    });

                    return false;
                }
            </script>`
    }
}