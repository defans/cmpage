'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../cmpage/page_ms.js');

module.exports = class extends CMPage {
    constructor(name, config = {}) {
        super(name, config);
        //题型
        this._way = 0;
    }

    getWay() {
        if (this._way == 0) {
            this._way = this.mod.c_modulename == 'QuestionSingle' ? cmpage.enumQuestionWay.SINGLE :
                (this.mod.c_modulename == 'QuestionMultiple' ? cmpage.enumQuestionWay.MULTIPLE :
                    (this.mod.c_modulename == 'QuestionJudge' ? cmpage.enumQuestionWay.JUDGE : cmpage.enumQuestionWay.ANSWER));
        }
        return this._way;
    }
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere() {
        //通过父类的方法取查询列设置解析后的where子句
        let where = await super.getQueryWhere();
        //此处增加额外的条件
        where += ` and  c_way=${this.getWay()} and c_status<>-1`; //也可以在查询列设置一条 ‘固定’类型的查询列，备注中填： c_status<>-1
        return where;
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit() {
        let md = await super.pageEditInit();
        md.c_way = this.getWay();
        return md;

    }

    /**
     * 根据参数ID取参数的名称，一般用于页面模块配置中的‘替换’调用: admin/cdoe:getNameById </br>
     * 子类中重写的时候需要为 this.mod.c_table 和 this.pk 赋值，因为直接调用的时候进行模块设置的初始化 </br>
     * 当然也可以重写 constructor 设置这两个值,例如：docu/supplier
     * @method  getNameById
     * @return {string}  参数名称
     * @param {int} id  参数ID
     * @param   {string} fieldNames 字段名称,逗号分隔
     * @param   {string} joinStr 连接的字符串
     */
    async getNameById(id, fieldNames, joinStr) {
        this.mod.c_table = 't_question';
        this.pk = 'id';
        return await super.getNameById(id, fieldNames, joinStr);
    }
    /**
     * 根据用户ID取用户对象
     * @method  getQuestionById
     * @return {object}  客户对象
     * @param {int} id  客户ID
     */
    async getQuestionById(id) {
        return await this.model('t_question').where({
            id: id
        }).find();
    }

}