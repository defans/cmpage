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

const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {
    //单据类型, 参见：cmpage.enumDocuType （cmpage_global_docu.js）
    //OrderApply:1,  Order:2,  DocuArrive:3,DocuCheck:4,DocuSale:5, DocuPick:6, DocuStock:7, DocuTransfer:8, DocuBill:20
    constructor(name, config = {}) {
        super(name,config);
        this.pk = 'c_id';
        this.docuType = {id:0, name:'',header:'',key:'c_docu',modulename:''};
    }

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
                this.docuType.id = cmpage.enumDocuType[p];
                this.docuType.name = cmpage.enumDocuType[p+'_name'];
                this.docuType.header = cmpage.enumDocuType[p+'_header'];
                this.docuType.modulename = p;
            }
        }
        if(this.docuType.id === cmpage.enumDocuType.OrderApply)    this.docuType.key='c_order_apply';
        if(this.docuType.id === cmpage.enumDocuType.Order)          this.docuType.key='c_order';
        //debug(this.docuType,'docu_rec.initDocuType - this.docuType');
    }

     /**
      * 增加物料明细，根据模块名称判断数据来源，实现相应的逻辑
      * @method  goodsAdd
      * @return {object} 返回前端的状态对象
      */
      async goodsAdd(fromID, docuID){
          if(think.isEmpty(docuID))  return  {statusCode:300, message:`单据ID错误!`};
          let recID = 0;
          if(this.mod.c_modulename == 'OrderApplyRec'){
              let goods = await this.model('t_goods').where('c_id='+fromID).find();
              if(think.isEmpty(goods)){
                  return  {statusCode:300, message:`物料ID不存在!`};
              }
              let rec = {c_order_apply:docuID,c_goods:fromID,c_qty:1,c_supplier:0,c_time_arrive:think.datetime(),
                  c_close:false,c_qty_to:0,c_use:'',c_memo:''};
              recID = await this.model('t_order_apply_rec').add(rec);
          }else if(this.mod.c_modulename == 'OrderRec'){
              let md = await this.model('vw_order_apply_list').where('rec_id='+fromID).find();
              if(think.isEmpty(md)){
                  return  {statusCode:300, message:`申购记录ID不存在!`};
              }
              let rec = {c_order:docuID,c_goods:md.c_goods,c_unit :md.c_unit, c_qty:md.c_qty - md.c_qty_to, c_price:0, c_price_tax:0, c_tax:17,
                  c_date_delivery:think.datetime(),c_qty_from:md.c_qty - md.c_qty_to,c_qty_to:0,c_rec_from:fromID, c_no_from:md.c_no,
                  c_qty_kp:0,c_close:false,c_qty_stock:0,c_is_pay:false,c_amt:0,c_amt_tax:0,c_memo:''};
              recID = await this.model('t_order_rec').add(rec);
              if(recID>0){
                  await this.query(`update t_order_apply_rec set c_qty_to=c_qty,c_close ='1' where c_id=${fromID}`);
              }
          }else if(this.mod.c_modulename == 'DocuArriveRec'){
              let md = await this.model('vw_order_list').where('rec_id='+fromID).find();
              if(think.isEmpty(md)){
                  return  {statusCode:300, message:`采购记录ID不存在!`};
              }
              let sql =`insert into t_docu_rec(c_docu,c_goods,c_unit,c_qty,c_price,c_price_tax,c_tax,c_amt,c_amt_tax,  c_qty_from,c_qty_to,c_rec_from,
                  c_no_from,c_no_order,c_qty_kp,c_close,c_supplier,c_memo)
                  select ${docuID},c_goods,c_unit,c_qty - c_qty_to, c_price,c_price_tax,c_tax,(c_qty -c_qty_to)*c_price,(c_qty -c_qty_to)*c_price_tax,
                    c_qty -c_qty_to, 0,c_id,c_no,c_no, 0,'false',c_supplier,c_memo
			             from vw_order_list where rec_id =${fromID}  returning c_id;`;
              let ret = await this.query(sql);
              recID = ret.c_id;
              if(recID>0){
                  await this.query(`update t_order_rec set c_qty_to=c_qty,c_close ='true' where c_id=${fromID}`);
              }
          }
          return  {statusCode:recID>0 ? 200:300, message: recID>0 ? "":"操作失败！"};
          //return  {statusCode:300, message:`模块名称 ${this.mod.c_modulename} 错误！`};
      }

      /**
       * 删除记录,<br/>
       * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
       * @method  pageDelete
       * @return {object} 记录对象
       */
      async pageDelete(){
         //删除后需要变动库存数量等
         if(this.docuType.id === cmpage.enumDocuType.OrderApply){
             await this.model('t_order_apply_rec').where(` c_id=${this.mod.recID}`).delete();
         }else if(this.docuType.id === cmpage.enumDocuType.Order){
             await this.query(`select fn_order_rec_qty_from_calc(${this.mod.recID},'true');`);
         }else if(['DocuCheck','DocuSale','DocuPick','DocuStock','DocuTransfer'].includes(this.docuType.modulename)){
             await this.query(`select fn_docu_rec_qty_from_calc('${this.docuType.modulename}',${this.mod.recID},'true');`);
         }
         //重新计算库存
         if(['DocuCheck','DocuSale','DocuPick','DocuStock','DocuTransfer'].includes(this.docuType.modulename)){
             let rec = this.model('vw_docu_list').where(`c_id=${this.mod.recID}`).find();
             await this.query(`select fn_stock_goods_qty_calc(${rec.c_goods},${rec.c_stock});`);
             if(this.docuType.id == cmpage.enumDocuType.DocuTransfer){
                 await this.query(`perform fn_stock_goods_qty_calc(${rec.c_goods},${rec.c_stock_to});`);
             }
         }

         return {statusCode:200,message:'删除成功！',data:{}};
      }

      /**
       * 编辑页面保存,<br/>
       * 根据各种单据类型，增加对保存项的逻辑验证
       * @method  pageSave
       * @return {object} 如果有验证错误，则返回格式： {statusCode:300, message:'xxxxxx'}
       * @param  {object} parms 前端传入的FORM参数
       */
      async pageSave(parms){
          parms.c_qty = parseFloat(parms.c_qty) || 0;
          if(this.docuType.id != cmpage.enumDocuType.DocuStock && parms.c_qty <0){
              return {statusCode:300, message:'数量应大于 0'};
          }
          //类型检查
          parms.c_qty_from = parseFloat(parms.c_qty_from) || 0;
          parms.c_price = parseFloat(parms.c_price) || 0;
          parms.c_price_tax = parseFloat(parms.c_price_tax) || 0;
          parms.c_price_out_tax = parseFloat(parms.c_price_out_tax) || 0;
          parms.c_qty_stock = parseFloat(parms.c_qty_stock) || 0;
          parms.c_tax = parseFloat(parms.c_tax) || 17;

          if(this.docuType.id == cmpage.enumDocuType.DocuArrive || this.docuType.id == cmpage.enumDocuType.DocuCheck
            || this.docuType.id == cmpage.enumDocuType.DocuPick || this.docuType.id == cmpage.enumDocuType.DocuTransfer
            || this.docuType.id == cmpage.enumDocuType.DocuSale ){
              if(parms.c_qty > parms.c_qty_from){
                  return {statusCode:300, message:`数量不能大于来源数量: ${parms.c_qty_from}`};
              }
              parms.c_amt = parms.c_qty * parms.c_price;
              parms.c_amt_tax = parms.c_qty * parms.c_price_tax;
          }else if (this.docuType.id == cmpage.enumDocuType.DocuStock) {
              //实盘数量 c_qty_from
              parms.c_qty = parms.c_qty_from - parms.c_qty_stock;
              parms.c_amt = parms.c_qty * parms.c_price;
              parms.c_amt_tax = parms.c_qty * parms.c_price_tax;
          }else if (this.docuType.id == cmpage.enumDocuType.DocuBill) {
              if(parms.c_qty > parms.c_qty_from){
                  return {statusCode:300, message:`开票数量不能大于物料数量: ${parms.c_qty_from}`};
              }
              parms.c_amt_tax = parseFloat(parms.c_amt_tax);
              if(parms.c_amt_tax <=0 ){
                  return {statusCode:300, message:'含税金额应大于 0 '};
              }
              parms.c_price = (parms.c_amt_tax / parms.c_qty) / (1 + parms.c_tax/100);
              parms.c_price_tax = parms.c_amt_tax / parms.c_qty;
              parms.c_amt = parms.c_qty * parms.c_price;
          }
          if(this.docuType.id == cmpage.enumDocuType.DocuSale){
              if(parms.c_price_out_tax <=0 ){
                  return {statusCode:300, message:'含税价格应大于 0 '};
              }
              parms.c_price_out = parms.c_price_out_tax *(1 - parms.c_tax / 100);
              parms.c_amt_out = parms.c_qty * parms.c_price_out;
              parms.c_amt_out_tax = parms.c_qty * parms.c_price_out_tax;
          }

          let ret = await super.pageSave(parms);

          //重新计算来源数量，设置是否关闭的标记
          if(this.docuType.id == cmpage.enumDocuType.DocuArrive || this.docuType.id == cmpage.enumDocuType.DocuCheck || this.docuType.id == cmpage.enumDocuType.DocuBill){
              if(parms.c_rec_from >0){
                  await this.query(`select fn_docu_rec_qty_from_calc(${this.docuType.modulename}',${parms.c_rec_from},'false');`);
              }
          }
          if(this.docuType.id == cmpage.enumDocuType.DocuCheck){
              let rec = this.model('t_docu').where(`c_id=${parms.c_docu}`).find();
              await this.query(`select fn_stock_goods_price_add(${rec.c_goods},${rec.c_stock},${parms.c_price});`);
          }

      }

}
