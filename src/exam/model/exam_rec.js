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
     * 从题库中选择后增加试卷的试题
     * @method  questionAdd
     * @return {object} 返回前端的状态对象
     */
    async questionAdd( ...args ){
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

        let examID = args[1];
        let orderID = await this.getMaxOrder(examID);
        for(let id of ids){
            let rec = {c_order:orderID, c_exam:examID, c_question:id, c_score: 5, c_memo:''};
            let recID = await this.model('t_exam_rec').add(rec);
            if(recID <=0)   return  {statusCode:300, message:"操作失败！"};
            orderID += 1;
        }
        await this.getSumScore(examID);
        return  {statusCode:200, message:""};
    }


    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete(){
        let rec = await this.model('t_exam_rec').where({id:this.mod.recID}).find();
        let ret= await super.pageDelete();
        await this.getSumScore(rec.c_exam);
        return ret;
    }

    /**
     * 重新计算本试卷的分值
     * @method  getSumScore
     * @return {int} 返回本试卷的最大排序值
     */
    async getSumScore(examID){
        let list = await this.query(`select sum(c_score) as score from t_exam_rec where c_exam = ${examID} `);
        let score = list[0]['score'];
        if(score >0)    await this.query(`update t_exam set c_score=${score} where id=${examID}`);
    }

    /**
     * 取本试卷的最大排序值
     * @method  getMaxOrder
     * @return {int} 返回本试卷的最大排序值
     */
    async getMaxOrder(examID){
        let list = await this.query(`select max(c_order) as maxorder from t_exam_rec where c_exam = ${examID} `);
        let maxorder = list[0]['maxorder'];
        if(think.isEmpty(maxorder)) return 1;
        return maxorder +1;          
    }
    


}
