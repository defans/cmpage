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


    /**
     * 根据用户ID取用户对象
     * @method  getExamById
     * @return {object}  客户对象
     * @param {int} id  客户ID
     */
    async getNameById(id) {
        let rec = await this.model('t_exam').where({
            id: id
        }).find();
        if (think.isEmpty(rec)) return '';
        return rec.c_name
    }
    /**
     * 取t_exam的记录,按名称排序
     * @method  getExams
     * @return {Array}  t_exam记录列表
     */
    async getExams() {
        return this.query('select * from t_exam order by  c_type,c_name ');
    }
    /**
     * 定制查询中下拉列表显示(cmpage_global_admin.js中的enumExamStudentStatus和utils中的getEnum)
     */
    async examStatusList() {
        return [{
            id: 1,
            c_name: '待考试'
        }, {
            id: 2,
            c_name: '已考试'
        }, {
            id: 3,
            c_name: '已阅卷'
        }];
    }

}