'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../cmpage/page_mob.js');

//VIP申请的审核和展示类，模块名称：CustomerAppr
module.exports = class extends CMPage {

    /**
     * 生成列表每一行的内容
     */
    async mobHtmlGetListRow(row) {
        return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
                <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label> </p>
                <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    }

    /**
     * 修改状态，供界面按钮直接调用，工作流相关方法（状态流转类）</br>
     * 子类中覆写本方法，可以根据业务对象的状态增加其他逻辑
     * @method  updateStatus
     * @return {object} 结果输出
     * @params {int} id 记录ID
     * @params {int} actID 流程节点ID
     * @params {int} status 状态值，一般在t_code表中设置
     * @params {boolean} isSelf 自身表单的调用，区别于其他模块的调用
     */
    async updateStatus(id, actID, status, isSelf) {
        //修改业务对象状态
        let ret = await super.updateStatus(id, actID, status, isSelf);
        debug(ret, 'customer_appr.updateStatus - super.ret');
        if (ret.statusCode === 200 && isSelf) {
            //增加历史状态记录,此处关联已经明确，逻辑明确，故而直接增加状态记录
            let apprRec = {
                c_link: id,
                c_link_type: 't_customer',
                c_modulename: 'CustomerAppr',
                c_status: status,
                c_desc: '',
                c_user: this.mod.user.id,
                c_time: think.datetime(),
                c_group: this.mod.user.groupID,
                c_act: actID
            };
            await this.model('t_appr').add(apprRec);
        }
        return ret;

    }

}