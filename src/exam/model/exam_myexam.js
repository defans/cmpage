'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../../cmpage/model/page.js');

module.exports = class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(){
        //通过父类的方法取查询列设置解析后的where子句
        let where =await super.getQueryWhere();
        //此处增加额外的条件
        where += ` and  c_student=${this.mod.user.id} and c_status<>-1`;      //也可以在查询列设置一条 ‘固定’类型的查询列，备注中填： c_status<>-1
        debug(where);
        return where;
    }

    /**
     * H5页面的我的试卷列表
     */
    async hhGetList(user){
        let list = await this.query(`select * from vw_exam_student_exam where c_student=${user.id} order by c_test_begin desc`);
        let html = [];
        for(let rec of list){
            rec.type_name = await cmpage.model('admin/code').getNameById(rec.exam_type);
            html.push(`<div class="mui-card">	<div class="mui-card-header">${rec.exam_name}</div>`);  
            if(rec.c_status  == cmpage.enumExamStudentStatus.NODO){
                html.push(`<div class="mui-card-content">
                                <div class="mui-card-content-inner">
                                    ${rec.type_name}: ${rec.exam_desc} </br>
                                    总分：${rec.exam_score}分，计划考试时间：${cmpage.datetime(rec.exam_time_begin,'yyyy-MM-dd HH:mm')}, 
                                    ${think.isEmpty(rec.exam_time_long) ? '':'时长：'+rec.exam_time_long+'分钟'}
                                </div>
                            </div>
                            <div class="mui-card-footer">
                                <a class="mui-card-link" href="/exam/index/exam_student_show?id=${rec.id}">开始考试</a>					
                            </div>`);
            }else if(rec.c_status  == cmpage.enumExamStudentStatus.DONE){
                html.push(`<div class="mui-card-content">
                                <div class="mui-card-content-inner">
                                    ${rec.type_name}: ${rec.exam_desc}，总分：${rec.exam_score}分 </br>
                                    开始考试时间：${cmpage.datetime(rec.exam_test_begin,'yyyy-MM-dd HH:mm')}, 
                                    结束考试时间：${cmpage.datetime(rec.exam_test_end,'yyyy-MM-dd HH:mm')}
                                </div>
                            </div>
                            <div class="mui-card-footer">
                                请耐心等待批阅结果，谢谢！
                            </div>`);
            }else if(rec.c_status  == cmpage.enumExamStudentStatus.MARKED){
                html.push(`<div class="mui-card-content">
                                <div class="mui-card-content-inner">
                                    ${rec.type_name}: ${rec.exam_desc}，总分：${rec.exam_score}分，得分：${rec.c_score}分 </br>
                                    开始考试时间：${cmpage.datetime(rec.exam_test_begin,'yyyy-MM-dd HH:mm')}, 
                                    结束考试时间：${cmpage.datetime(rec.exam_test_end,'yyyy-MM-dd HH:mm')}
                                </div>
                            </div>
                            <div class="mui-card-footer">
                                <a class="mui-card-link" style="color:green;" href="/exam/index/exam_student_show?id=${rec.id}">查看详情</a>	
                            </div>`);
            }
            html.push('		</div>');            
        }
        return html.join('');
    }

}
