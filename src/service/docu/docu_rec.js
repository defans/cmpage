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

const CMPage = require('../cmpage/page.js');

module.exports = class extends CMPage {
    //单据类型, 参见：cmpage.enumDocuType （cmpage_global_docu.js）
    //OrderApply:1,  Order:2,  DocuArrive:3,DocuCheck:4,DocuSale:5, DocuPick:6, DocuStock:7, DocuTransfer:8, DocuBill:20
    constructor() {
        super();
        this.pk = 'c_id';
        this.docuType = {
            id: 0,
            name: '',
            header: '',
            key: 'c_docu',
            modulename: ''
        };
    }

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage() {
        await super.initPage();
        //根据模块名称，取单据基本信息
        let typeName = this.mod.c_modulename.replace(/Rec/, '');
        for (let p in cmpage.enumDocuType) {
            if (p == typeName) {
                this.docuType.id = cmpage.enumDocuType[p];
                this.docuType.name = cmpage.enumDocuType[p + '_name'];
                this.docuType.header = cmpage.enumDocuType[p + '_header'];
                this.docuType.modulename = p;
            }
        }
        if (this.docuType.id === cmpage.enumDocuType.OrderApply) this.docuType.key = 'c_order_apply';
        if (this.docuType.id === cmpage.enumDocuType.Order) this.docuType.key = 'c_order';
        //debug(this.docuType,'docu_rec.initDocuType - this.docuType');
    }

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
        return {
            statusCode: 300,
            message: "请在子类中继承本方法！"
        };
    }


    /**
     * 预处理保存的参数,<br/>
     * 根据各种单据类型，增加对保存项的逻辑验证
     * @method  pageSavePretreat
     * @return {object} 处理后的参数
     * @param  {object} parms 前端传入的FORM参数
     */
    pageSavePretreat(parms) {
        parms.c_qty = parseFloat(parms.c_qty) || 0;
        if (this.docuType.id != cmpage.enumDocuType.DocuStock && parms.c_qty < 0) {
            return {
                statusCode: 300,
                message: '数量应大于 0'
            };
        }
        //类型检查
        parms.c_qty_from = parseFloat(parms.c_qty_from) || 0;
        parms.c_price = parseFloat(parms.c_price) || 0;
        parms.c_price_tax = parseFloat(parms.c_price_tax) || 0;
        parms.c_price_out_tax = parseFloat(parms.c_price_out_tax) || 0;
        parms.c_qty_stock = parseFloat(parms.c_qty_stock) || 0;
        parms.c_tax = parseFloat(parms.c_tax) || 17;

        return parms;
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

        return await super.pageSave(parms);
    }

}