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
 * 物料资料的实现类，用于单据流转等
 * @class docu.model.goods
 */

const CMPage = require('../cmpage/page.js');

module.exports = class extends CMPage {

    constructor() {
        super();
        this.mod = {c_table:'t_goods'};
        this.pk ='c_id';
    }

    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete(){
        let cnt = await this.model('t_order_rec').where(` c_goods=${this.mod.recID}`).count();
        if(cnt >0)  return {statusCode:300,message:'该物料资料已经有订单使用！',data:{}};

        cnt = await this.model('t_docu_rec').where(` c_goods=${this.mod.recID}`).count();
        if(cnt >0)  return {statusCode:300,message:'该物料资料已经有单据使用！',data:{}};

        return await super.pageDelete();
    }
    

}
