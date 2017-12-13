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
        let goods = await this.model('t_goods').where('c_id=' + fromID).find();
        if (think.isEmpty(goods)) {
            return {
                statusCode: 300,
                message: `物料ID不存在!`
            };
        }

        let rec = {
            c_order_apply: docuID,
            c_goods: fromID,
            c_qty: 1,
            c_supplier: 0,
            c_time_arrive: think.datetime(),
            c_close: false,
            c_qty_to: 0,
            c_use: '',
            c_memo: ''
        };
        let recID = await this.model('t_order_apply_rec').add(rec);

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
        //删除后需要变动库存数量等
        await this.model('t_order_apply_rec').where(` c_id=${this.mod.recID}`).delete();

        return {
            statusCode: 200,
            message: '删除成功！',
            data: {}
        };
    }


}