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
 * 供应商资料的实现类，用于单据流转等
 * @class docu.model.docu
 */

const CMPage = require('../cmpage/page_mob.js');

module.exports = class extends CMPage {

    constructor() {
        super();
        this.mod = {c_table:'t_supplier'};  //为直接调用的函数初始化某些值，如：getNameById
    }

    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete(){
        let cnt = await this.model('t_order').where(` c_supplier=${this.mod.recID}`).count();
        if(cnt >0)  return {statusCode:300,message:'该物料资料已经有订单使用！',data:{}};

        cnt = await this.model('t_docu').where(` c_supplier=${this.mod.recID}`).count();
        if(cnt >0)  return {statusCode:300,message:'该物料资料已经有单据使用！',data:{}};

        return await super.pageDelete();
    }

    // /**
    //  * 根据参数ID取参数的名称，一般用于页面模块配置中的‘替换’调用: docu/supplier:getNameById
    //  * 子类中重写的时候需要为 this.mod.c_table 和 this.pk 赋值，因为直接调用的时候进行模块设置的初始化
    //  * @method  getNameById
    //  * @return {string}  参数名称
    //  * @param {int} id  参数ID
    //  * @param   {string} fieldNames 字段名称,逗号分隔
    //  * @param   {string} joinStr 连接的字符串
    //  */
    // async getNameById(id,fieldNames,joinStr){
    //     this.mod.c_table = 't_supplier';
    //     return await super.getNameById(id,fieldNames,joinStr);
    // }
    //

}
