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

const CMPage = require('../cmpage/page_lookup.js');

module.exports = class extends CMPage {

    constructor() {
        super();
        this.pk = 'c_id';
        this.docuType = {
            id: 0,
            name: '',
            header: '',
            key: 'c_docu'
        }; //单据类型, 参见：cmpage.enumDocuType （cmpage_global_docu.js）
    }

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage() {
        await super.initPage();
        //根据模块名称，取单据基本信息
        let typeName = this.mod.c_modulename.replace(/ListLookup/, '');
        for (let p in cmpage.enumDocuType) {
            if (p == typeName) {
                this.docuType.id = cmpage.enumDocuType[p];
                this.docuType.name = cmpage.enumDocuType[p + '_name'];
                this.docuType.header = cmpage.enumDocuType[p + '_header'];
            }
        }
        if (this.docuType.id === cmpage.enumDocuType.OrderApply) this.docuType.key = 'c_order_apply';
        if (this.docuType.id === cmpage.enumDocuType.Order) this.docuType.key = 'c_order';
        //this.pk = 'c_id';
        //debug(this.docuType,'docu_list.initDocuType - this.docuType');
        debug(this.proc, 'docu_list.initDocuType - this.proc');
    }

    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere() {
        //通过父类的方法取查询列设置解析后的where子句
        let where = await super.getQueryWhere();
        //此处增加额外的条件
        if (this.docuType.id == cmpage.enumDocuType.Order || this.docuType.id == cmpage.enumDocuType.OrderApply) {
            where += ` and c_status = 1213 and (c_qty - ${this.sqlTranslate('isnull')}(c_qty_to,0) >0) and c_group in(${this.mod.user.groups})`;
        } else if (this.docuType.id == cmpage.enumDocuType.DocuInvalid) {
            where += ` and c_status = -1 and c_group in(${this.mod.user.groups})`;
        } else {
            where += ` and c_status = 1213 and (c_qty - ${this.sqlTranslate('isnull')}(c_qty_to,0) >0) and c_type=${this.docuType.id} and c_group in(${this.mod.user.groups})`;
        }

        return where;
    }

    /**
     * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
     * @method  getDataList
     * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
     */
    async getDataList() {
        await super.getDataList();
        //去掉每行显示重复的项目，如单号、仓库等主表的信息
        let docuID = 0;
        for (let rec of this.list.data) {
            if (rec[this.pk] == docuID) {
                rec.c_no = '';
                rec.c_stock = '';
                rec.c_stock_to = ''; //多加一个属性又不会死 ^_^
                rec.c_user = '';
                rec.c_time = '';
                rec.status_name = '';
                rec.c_status = '';
            } else {
                docuID = rec[this.pk];
            }
        }
    }

}