'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {

    /**
     * 选择考生后加入到本次考试中
     * @method  questionAdd
     * @return {object} 返回前端的状态对象
     */
    async studentAdd( ...args ){
        if(args.length <2 || think.isEmpty(args[1]))  return  {statusCode:300, message:`试卷ID错误!`};
        debug(args,'exam_student.studengAdd - args');

        let ids = [];
        if(args.length ==2){
            ids.push(args[0]);
        }else{
            for(let i=2; i< args.length; i++){
                ids.push(args[i]);
            }
        }

        for(let id of ids){
            let rec = {c_exam:args[1], c_student:id, c_score: 0, c_marker:0,c_status:1};
            let recID = await this.model('t_exam_student').add(rec);
            if(recID <=0)   return  {statusCode:300, message:"操作失败！"};
        }
        return  {statusCode:200, message:""};
    }


    /**
     * H5页面的某个试卷的详细信息
     */
    async hhGetExamQuestionList(examStudentID){        
        await this.query(`update t_exam_student set c_test_begin = '${think.datetime()}' where id=${examStudentID}`);
        let examStudent = await this.model('vw_exam_student_exam').where({id:examStudentID}).find();
        if(examStudent.c_status == cmpage.enumExamStudentStatus.NODO){
            //更新考生试题明细，业务规则：考生参加考试了才会有考试明细，否则只是一个考试权限分配
            await this.query(`insert t_exam_student_rec(c_exam_student,c_exam_rec,c_answer,c_score) 
                select ${examStudentID},id,'',0 from t_exam_rec where c_exam = ${examStudent.c_exam} 
                and not exists(select * from t_exam_student_rec where c_exam_student=${examStudentID} and c_exam = ${examStudent.c_exam})`);
        }
        let isMarked = examStudent.c_status == cmpage.enumExamStudentStatus.MARKED;
        let list = await this.query(`select * from vw_exam_student_rec_question where c_exam_student=${examStudent.id} order by question_way,c_order`);

        let html = [];
        let index = 1;

        html.push(`<input type="hidden" name="c_exam_student" value="${examStudentID}" />`)
//        html.push(`<input type="hidden" name="c_exam" value="${examStudent.c_exam}" />`)
        let htmlSub = [];
        htmlSub.push('<h4>&nbsp;&nbsp;第一部分：单选题</h4>');        
        for(let rec of list){            
            if(rec.question_way ==1 ){
                //取选项的HTML
                let ans = await this.query(`select * from t_question_rec where c_question=${rec.c_question} order by c_no`); 
                let anHtml = [];
                for(let an of ans){
                    anHtml.push(`<div class="mui-input-row mui-radio">
                            <label>${an.c_no}、${an.c_desc}</label>
                            <input name="input${rec.id}" ${isMarked ? 'disabled':''} value="${an.c_no}" type="radio" >
                            </div>`)
                }

                htmlSub.push(`<div class="mui-card">
                        <div class="mui-card-header">第 ${index ++} 题（${isMarked ? rec.c_score : rec.question_score}分）</div>
                        <div class="mui-card-content">
                            <div class="mui-card-content-inner">
                                ${rec.question_name}
                                ${anHtml.join('')}
                            </div>
                        </div>
                        ${ isMarked ? '<div class="mui-card-footer"><label style="color:green;">标准答案：'+rec.question_answer 
                            +'</label>&nbsp;&nbsp;&nbsp;&nbsp;<label style="color:'+(rec.c_score == 0 ? 'red':'green')+';">您的答案：'+rec.c_answer +'</label></div>': ''}
                    </div> `);               
            }
        }
        if(htmlSub.length >1)   html.push(htmlSub.join(''));
        htmlSub = [];
        htmlSub.push('<h4>&nbsp;&nbsp;第二部分：多选题</h4>');        
        for(let rec of list){            
            if(rec.question_way ==2 ){
                //取选项的HTML
                let ans = await this.query(`select * from t_question_rec where c_question=${rec.c_question} order by c_no`); 
                let anHtml = [];
                for(let an of ans){                
                    anHtml.push(`<div class="mui-input-row mui-checkbox">
                            <label>${an.c_no}、${an.c_desc}</label>
                            <input name="input${rec.id}" ${isMarked ? 'disabled':''} value="${an.c_no}" type="checkbox" >
                            </div>`)
                }

                htmlSub.push(`<div class="mui-card">
                        <div class="mui-card-header">第 ${index ++} 题（${isMarked ? rec.c_score : rec.question_score}分）</div>
                        <div class="mui-card-content">
                            <div class="mui-card-content-inner">
                                ${rec.question_name}
                                ${anHtml.join('')}
                            </div>
                        </div>
                        ${ isMarked ? '<div class="mui-card-footer"><label style="color:green;">标准答案：'+rec.question_answer 
                            +'</label>&nbsp;&nbsp;&nbsp;&nbsp;<label style="color:'+(rec.c_score == 0 ? 'red':'green')+';">您的答案：'+rec.c_answer +'</label></div>': ''}
                    </div> `);               
            }
        }
        if(htmlSub.length >1)   html.push(htmlSub.join(''));
        htmlSub = [];        
        htmlSub.push('<h4>&nbsp;&nbsp;第三部分：判断题</h4>');        
        for(let rec of list){            
            if(rec.question_way ==3 ){
                htmlSub.push(`<div class="mui-card">
                    <div class="mui-card-header">第 ${index ++} 题（${isMarked ? rec.c_score : rec.question_score}分）</div>
                    <div class="mui-card-content">
                        <div class="mui-card-content-inner">
                            ${rec.question_name}
                        </div>
                    </div>`);
                if(isMarked){
                    htmlSub.push(` <div class="mui-card-footer"><label style="color:green;">标准答案：${rec.question_answer == 1 ? '对':'错'} </label>&nbsp;&nbsp;&nbsp;&nbsp;
                        <label style="color:${rec.c_score == 0 ? 'red':'green'};">您的答案：${rec.c_answer  == 1 ? '对':'错'}</label></div></div>`)
                }else{
                    htmlSub.push(`<div class="mui-card-footer">
                            <div class="mui-input-row mui-radio">
                            <label>正确</label>
                            <input name="input${rec.id}" value="1" type="radio" >
                            </div>
                            <div class="mui-input-row mui-radio">
                            <label>错误</label>
                            <input name="input${rec.id}" value="0" type="radio" >
                            </div>					
                            </div>					
                        </div>`);
                }                    
            }
        }
        if(htmlSub.length >1)   html.push(htmlSub.join(''));
        htmlSub = [];
        htmlSub.push('<h4>&nbsp;&nbsp;第四部分：问答题</h4>');        
        for(let rec of list){            
            if(rec.question_way == 4 ){
                htmlSub.push(`<div class="mui-card">
                    <div class="mui-card-header">第 ${index ++} 题（${isMarked ? rec.c_score : rec.question_score}分）</div>
                    <div class="mui-card-content">
                        <div class="mui-card-content-inner">
                            ${rec.question_name}
                            <div class="mui-input-row" style="margin-top: 10px;">
                                <textarea id="input${rec.id}" ${isMarked? 'disabled':''} name="input${rec.id}" rows="5" placeholder="请在这里输入答案" >
                                ${isMarked? rec.c_answer:''}
                                </textarea>
                            </div>
                        </div>
                    </div>
                </div>`);
            }
        }
        if(htmlSub.length >1)   html.push(htmlSub.join(''));
        if(isMarked){
            html.push(`</br><a  href='/exam/index/exam_list' class="mui-btn mui-btn-primary mui-btn-block" >总分：${examStudent.exam_score}，您得：${examStudent.c_score}，返回</a>`);
        }else{
            html.push(`</br><button type="submit"  class="mui-btn mui-btn-primary mui-btn-block" onclick="return confirm('是否确定要交卷？');">我考完了，交卷</button>`);
        }

        examStudent.listHtml = html.join('');
        return {statusCode:200, message:'保存成功！', data:examStudent};
    }

    /**
     * 考生递交试卷，自动计算得分，如果没有问答题，则自动阅卷结束并设置试卷状态为 已阅卷
     */
    async hhExamSave(parms){
        let list = await this.model('vw_exam_student_rec_question').where({c_exam_student:parms.c_exam_student}).select();
        let sumScore = 0;
        let isAutoMark = true;
        for(let rec of list){
            if(rec.question_way == 4)   isAutoMark = false;
            let score = 0;
            if(think.isEmpty(parms[ `input${rec.id}` ])){
                if(rec.question_answer == '0')  score = rec.question_score;
                await this.query(`update t_exam_student_rec set c_score=${score},c_answer='${rec.question_answer == '0' ? '0':''}' where id=${rec.id}`);
            }else{
                let input = parms[ `input${rec.id}` ];
                if(think.isArray(input))    input = input.join(',');
                if(rec.question_answer == input)    score = rec.question_score;
                await this.query(`update t_exam_student_rec set c_score=${score},c_answer='${input}' where id=${rec.id}`);
            }
            sumScore += score;
        }
        if(isAutoMark){
            await this.query(`update t_exam_student set c_score=${sumScore},c_status=${cmpage.enumExamStudentStatus.MARKED},
                c_mark_time='${think.datetime()}', c_test_end='${think.datetime()}' where id=${parms.c_exam_student}`);
        }else{
            await this.query(`update t_exam_student set c_score=${sumScore},c_status=${cmpage.enumExamStudentStatus.DONE},
                  c_test_end='${think.datetime()}' where id=${parms.c_exam_student}`);
        }
        
        return {statusCode:200, message:'保存成功！'};
    }

}
