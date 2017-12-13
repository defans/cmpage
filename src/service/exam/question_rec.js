'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../cmpage/page.js');

module.exports = class extends CMPage {

    /**
     * 编辑页面保存,<br/>
     * 如果是多个表的数据产生的编辑页，则根据存在于this.mod.c_table中的列更新表，一般需要在子类中继承，例如： admin/user:pageSave
     * @method  pageSave
     * @return {object} 如果有验证错误，则返回格式： {statusCode:300, message:'xxxxxx'}
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms) {
        //如果是单选题，则把原先的答案清除
        if (parms.c_is_answer) {
            let question = await this.model('t_question').where({
                id: parms.c_question
            }).find();
            if (question.c_way == cmpage.enumQuestionWay.SINGLE) {
                await this.query(`update t_question_rec set c_is_answer=0 where c_question=${parms.c_question}`);
            }
        }

        let ret = await super.pageSave(parms);
        if (ret.statusCode == 200) {
            //如果是多选题，重置试题的答案项
            let recs = await this.model('t_question_rec').where({
                c_question: parms.c_question
            }).select();
            let no = [];
            for (let rec of recs) {
                if (rec.c_is_answer) no.push(rec.c_no);
            }
            let sql = `update t_question set c_answer='${no.join(',')}' where id=${parms.c_question}`;
            debug(sql, 'question_rec.pageSave - sql');
            await this.query(sql);
        }
    }

}