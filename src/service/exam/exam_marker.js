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
     * 选择阅卷人后加入到本次考试中
     * @method  markerAdd
     * @return {object} 返回前端的状态对象
     */
    async markerAdd( ...args ){
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
            let rec = {c_exam:args[1], c_marker:id};
            let recID = await this.model('t_exam_marker').add(rec);
            if(recID <=0)   return  {statusCode:300, message:"操作失败！"};
        }
        return  {statusCode:200, message:""};
    }

}
