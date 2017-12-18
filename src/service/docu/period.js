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

const PageMs = require('../cmpage/page_ms.js');

module.exports = class extends PageMs {

    constructor() {
        super();
        this.pk = 'c_id';
        this.connStr = 'docu';
        this.mod = {
            c_table: 't_period'
        }; //为直接调用的函数初始化某些值，如：getNameById
    }

    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere() {
        //通过父类的方法取查询列设置解析后的where子句
        let where = await super.getQueryWhere();
        //此处增加额外的条件
        where += ` and c_status<>-1 and c_group in(${this.mod.user.groups})`;

        return where;
    }

    /**
     * 根据参数ID取参数的名称，一般用于页面模块配置中的‘替换’调用: docu/supplier:getNameById
     * 子类中重写的时候需要为 this.mod.c_table 和 this.pk 赋值，因为直接调用的时候进行模块设置的初始化
     * @method  getNameById
     * @return {string}  参数名称
     * @param {int} id  参数ID
     * @param   {string} fieldNames 字段名称,逗号分隔
     * @param   {string} joinStr 连接的字符串
     */
    async getNameById(id,fieldNames,joinStr){
        let rec = await this.model('t_period').where(`c_id=${id}`).find();
        if(rec){   
            const codeApp = this.cmpage.service('admin/code');
            return `${await codeApp.getNameById(rec.c_stock)} (${await codeApp.getNameById(rec.c_period_ucode)})`;
        }
        return '';
    }
    
    /**
     * 结束某个期次的库存核算，供前端页面调用
     * @method  periodFinish
     * @return {object}  返回前端页面的对象
     * @param {int} periodID  期次ID
     * @param   {int} isClose 1:完成结转，0：重写核算
     */
    async periodFinish(periodID,isClose){

    }

     
}