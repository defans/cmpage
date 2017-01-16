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
 * 通用的单据行为实现类，单据保存于表 t_docu,t_order,t_order_apply,t_pay,t_xxxx_rec </br>
 * 相关表：t_goods, t_supplier, t_period,t_period_stock, 参数存于 t_code
 * @class docu.model.docu
 */

import CMPage from '../../cmpage/model/page.js';

export default class extends CMPage {
    type = {id:0, name:'',header:'',key:'c_docu'};   //单据类型, 参见：cmpage.enumDocuType （cmpage_global_docu.js）

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage(){
        await super.initPage();
        //根据模块名称，取单据基本信息
        let typeName = this.mod.c_modulename.replace(/Rec/,'');
        for(let p in cmpage.enumDocuType){
            if( p == typeName){
                this.type.id = cmpage.enumDocuType[p];
                this.type.name = cmpage.enumDocuType[p+'_name'];
                this.type.header = cmpage.enumDocuType[p+'_header'];
            }
        }
        if(this.type.id === cmpage.enumDocuType.OrderApply)    this.type.key='c_order_apply';
        if(this.type.id === cmpage.enumDocuType.Order)          this.type.key='c_order';
        this.pk = 'c_id';
        //debug(this.type,'docu_rec.initDocuType - this.type');
    }

     /**
      * 取查询项的设置，结合POST参数，得到Where字句
      */
     async getQueryWhere(){
         //通过父类的方法取查询列设置解析后的where子句
         //this.pk = 'c_id';
         let where =await super.getQueryWhere();
        //  //此处增加额外的条件
        //  switch (this.type.id) {
        //      case cmpage.enumDocuType.INVALID:
        //          where += ` and c_status = -1 and c_group in(${this.mod.user.groups})`;
        //          break;
        //      default:
        //         where += ` and c_status<>-1 and c_type=${this.type.id} and c_group in(${this.mod.user.groups})`;
        //  }

         return where;
     }

     /**
      * 增加物料明细，根据模块名称判断数据来源，实现相应的逻辑
      * @method  goodsAdd
      * @return {object} 返回前端的状态对象
      */
      async goodsAdd(fromID, docuID){
          if(think.isEmpty(docuID))  return  {statusCode:300, message:`单据ID错误!`};
          if(this.mod.c_modulename == 'OrderApplyRec'){
              let goods = await this.model('t_goods').where('c_id='+fromID).find();
              if(think.isEmpty(goods)){
                  return  {statusCode:300, message:`物料ID不存在!`};
              }
              let rec = {c_order_apply:docuID,c_goods:fromID,c_qty:1,c_supplier:0,c_time_arrive:think.datetime(),
                  c_close:0,c_qty_to:0,c_use:'',c_memo:''};
              let recID = await this.model('t_order_apply_rec').add(rec);
              return  {statusCode:recID>0 ? 200:300, message: recID>0 ? "":"操作失败！"};
          }

          return  {statusCode:300, message:`模块名称 ${this.mod.c_modulename} 错误！`};
      }

      /**
       * 删除记录,<br/>
       * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
       * @method  pageDelete
       * @return {object} 记录对象
       */
      async pageDelete(){
         //删除后需要变动库存数量等
         if(this.type.id === cmpage.enumDocuType.OrderApply){
             await this.model('t_order_apply_rec').where(` c_id=${this.mod.recID}`).delete();
         }

         return {statusCode:200,message:'删除成功！',data:{}};
      }



}
