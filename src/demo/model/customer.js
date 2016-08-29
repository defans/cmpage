'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

import CMPage from '../../common/model/page_mob.js';

export default class extends CMPage {
    /**
     * 生成列表每一行的内容
     */
    async mobHtmlGetListRow(row,pageCols) {
        return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
                <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label> </p>
                <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    }


}