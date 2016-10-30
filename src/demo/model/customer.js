'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


import CMPage from '../../cmpage/model/page_mob.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(){
        //通过父类的方法取查询列设置解析后的where子句
        let where =await super.getQueryWhere();
        //此处增加额外的条件
        where += ' and c_status<>-1';      //也可以在查询列设置一条 ‘固定’类型的查询列，备注中填： c_status<>-1

        return where;
    }

    /**
     * 生成列表每一行的内容
     */
    async mobHtmlGetListRow(row) {
        return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
                <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label> </p>
                <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    }


}
