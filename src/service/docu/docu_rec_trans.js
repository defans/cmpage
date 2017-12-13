'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 单据流转的业务模块，实现了采购、库存管理相关的业务逻辑
 @module docu.model
 */

/**
 * 通用的单据行为实现类，单据保存于表 t_docu,t_order,t_order_apply,t_pay,t_xxxx_rec </br>
 * 相关表：t_goods, t_supplier, t_period,t_period_stock, 参数存于 t_code
 * @class docu.model.docu
 */
const docuRec = require('./docu_rec.js');

module.exports = class extends docuRec {
    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete() {
        //删除后需要变动库存数量等
        await this.query(`p_docu_rec_qty_from_calc '${this.docuType.modulename}',${this.mod.recID},1);`);

        //重新计算库存
        let rec = this.model('vw_docu_list').where(`c_id=${this.mod.recID}`).find();
        await this.query(`p_stock_goods_qty_calc ${rec.c_goods},${rec.c_stock},${this.mod.user.groupID}`);

        return {
            statusCode: 200,
            message: '删除成功！',
            data: {}
        };
    }

    /**
     * 编辑页面保存,<br/>
     * 根据各种单据类型，增加对保存项的逻辑验证
     * @method  pageSave
     * @return {object} 如果有验证错误，则返回格式： {statusCode:300, message:'xxxxxx'}
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms) {
        parms = pageSavePretreat(parms);

        if (parms.c_qty > parms.c_qty_from) {
            return {
                statusCode: 300,
                message: `数量不能大于来源数量: ${parms.c_qty_from}`
            };
        }
        parms.c_amt = parms.c_qty * parms.c_price;
        parms.c_amt_tax = parms.c_qty * parms.c_price_tax;

        return await super.pageSave(parms);
    }

}