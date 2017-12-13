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
     * 增加物料明细，根据模块名称判断数据来源，实现相应的逻辑
     * @method  goodsAdd
     * @return {object} 返回前端的状态对象
     */
    async goodsAdd(fromID, docuID) {
        if (think.isEmpty(docuID)) return {
            statusCode: 300,
            message: `单据ID错误!`
        };
        let md = await this.model('vw_order_apply_list').where('rec_id=' + fromID).find();
        if (think.isEmpty(md)) {
            return {
                statusCode: 300,
                message: `申购记录ID不存在!`
            };
        }
        let rec = {
            c_order: docuID,
            c_goods: md.c_goods,
            c_unit: md.c_unit,
            c_qty: md.c_qty - md.c_qty_to,
            c_price: 0,
            c_price_tax: 0,
            c_tax: 17,
            c_date_delivery: think.datetime(),
            c_qty_from: md.c_qty - md.c_qty_to,
            c_qty_to: 0,
            c_rec_from: fromID,
            c_no_from: md.c_no,
            c_qty_kp: 0,
            c_close: false,
            c_qty_stock: 0,
            c_is_pay: false,
            c_amt: 0,
            c_amt_tax: 0,
            c_memo: ''
        };
        let recID = await this.model('t_order_rec').add(rec);
        if (recID > 0) {
            await this.query(`update t_order_apply_rec set c_qty_to=c_qty,c_close ='1' where c_id=${fromID}`);
        }
        return {
            statusCode: recID > 0 ? 200 : 300,
            message: recID > 0 ? "" : "操作失败！"
        };
    }

    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete() {
        await this.query(`p_order_rec_qty_from_calc ${this.mod.recID},1,0`);
        return {
            statusCode: 200,
            message: '删除成功！',
            data: {}
        };
    }


}