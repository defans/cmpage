'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../../cmpage/model/page_mob.js');

module.exports = class extends CMPage {
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
    // async mobHtmlGetListRow(row) {
    //     return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
    //             <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label></p>
    //             <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    // }

    // /**
    //  * VIP申请，供界面按钮直接调用
    //  * @method  vipAppr
    //  * @return {object} 新增的记录对象
    //  */
    // async vipAppr(id){
    //     //这里直接设置状态值的理由：基于系统运行中状态值是不会的，如果删除了，这里需要做相应调整
    //     //当然也可以设置 t_code.c_object 的值来进行匹配
    //     //同样的理由，假设流程模板是不会轻易删除的，节点可能会删除和调整
    //     //如果模板重新建立了，这里的 procID 也要相应调整
    //     let proc = await cmpage.model('flow/proc').getProcById(10);
    //     //一般用开始节点作为当前节点，如单据新增等，这里是从已有记录开始流程，状态跳到 1219， 因此要找到相应的节点
    //     //另一种方法：新增记录的时候先赋值 c_act ，然后通过流程规则往下走
    //     let acts = cmpage.subArray(await cmpage.model('flow/act').getActsByProcId(10), {c_domain_st:1219});
    //     if(!think.isEmpty(acts)){
    //         let customerApprModel = this.model('customer_appr');
    //         return await customerApprModel.updateStatus(id, acts[0].id, 1219, true)
    //     }else{
    //         return {statusCode:300, message:'流程模板设置错误!'};
    //     }
    //
    // }

    /**
     * 根据用户ID取用户名称，一般用于页面模块配置中的‘替换’调用: admin/customer:getNameById
     * @method  getNameById
     * @return {string}  客户名称
     * @param {int} id  客户ID
     */
    async getNameById(id){
        let customer = await this.getCustomerById(id);
        if(think.isEmpty(customer)) return '';
        return customer.c_name;
    }
    /**
     * 根据用户ID取用户对象
     * @method  getCustomerById
     * @return {object}  客户对象
     * @param {int} id  客户ID
     */
    async getCustomerById(id){
        let Customers =await this.getCustomers();
        for(let customer of Customers){
            if(customer.id == id){
                return customer;
            }
        }
        return {};
    }

    /**
     * 取t_customer的记录,按名称排序
     * @method  getCustomers
     * @return {Array}  t_customer记录列表
     */
    async getCustomers(){
        return this.query('select * from t_customer order by  c_name ');
    }

}
