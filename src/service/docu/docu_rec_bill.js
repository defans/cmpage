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
                message: `开票数量不能大于物料数量: ${parms.c_qty_from}`
            };
        }
        parms.c_amt_tax = parseFloat(parms.c_amt_tax);
        if (parms.c_amt_tax <= 0) {
            return {
                statusCode: 300,
                message: '含税金额应大于 0 '
            };
        }
        parms.c_price = (parms.c_amt_tax / parms.c_qty) / (1 + parms.c_tax / 100);
        parms.c_price_tax = parms.c_amt_tax / parms.c_qty;
        parms.c_amt = parms.c_qty * parms.c_price;

        let ret = await super.pageSave(parms);

        //重新计算来源数量，设置是否关闭的标记
        if (parms.c_rec_from > 0) {
            await this.query(`select fn_docu_rec_qty_from_calc(${this.docuType.modulename}',${parms.c_rec_from},'false');`);
        }
        return ret;
    }

}