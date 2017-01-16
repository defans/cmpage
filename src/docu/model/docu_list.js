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

import CMPage from '../../cmpage/model/page_ms.js';

export default class extends CMPage {
    type = {id:0, name:'',header:'',key:'c_docu'};   //单据类型, 参见：cmpage.enumDocuType （cmpage_global_docu.js）

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage(){
        await super.initPage();
        //根据模块名称，取单据基本信息
        let typeName = this.mod.c_modulename.replace(/ListAdd/,'').replace(/List/,'');
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
        //debug(this.type,'docu_list.initDocuType - this.type');
        debug(this.proc,'docu_list.initDocuType - this.proc');
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit(){
        let md = await super.pageEditInit();
        md.c_no = await this.getDocuNo();
        md.c_dept = this.mod.user.c_dept;
        md.c_applicant = this.mod.user.id;

        this.mod.c_edit_column =1;  //新增时，由于没有从表，故而改成一列编辑
        //debug(this.mod.user,'docu_list.pageEditInit - this.mod.user');
        debug(md,'docu_list.pageEditInit - md');
        return md;
    }
    /**
     * 根据单据类型取单号
     * @method  getDocuNo
     * @return {string}  单号：形如： PR201610120001
     */
     async getDocuNo(){
         let no = this.type.header + cmpage.datetime(null,'YYYYMMDD');
         //debug(no,'docu.getDocuNo - no');
         //let maxNo = await this.model(this.mod.c_table).where({c_no:['like',no+'%']}).max('c_no');
         let list = await this.query(`select max(c_no) as maxNo from ${this.mod.c_table} where c_no like '${no}%'`);
         let maxNo = list[0]['maxNo'];
         //debug(maxNo,'docu.getDocuNo - maxNo');
         let cnt = '0001';
         if(!think.isEmpty(maxNo)){
            cnt = parseInt(maxNo.substring(10)) +1;
         }

         return no + '0000'.substring(0, 4 - cnt.length) +cnt;
     }

     /**
      * 取查询项的设置，结合POST参数，得到Where字句
      */
     async getQueryWhere(){
         //通过父类的方法取查询列设置解析后的where子句
        let where =await super.getQueryWhere();
         //此处增加额外的条件
        if(this.type.id ==cmpage.enumDocuType.DocuInvalid || this.type.id == cmpage.enumDocuType.Order || this.type.id ==cmpage.enumDocuType.OrderApply ) {
            where += ` and c_status <> -1 and c_group in(${this.mod.user.groups})`;
        }else if(this.type.id ==cmpage.enumDocuType.DocuInvalid ) {
            where += ` and c_status = -1 and c_group in(${this.mod.user.groups})`;
        }else{
             where += ` and c_status<>-1 and c_type=${this.type.id} and c_group in(${this.mod.user.groups})`;
        }

        return where;
     }

     /**
      * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
      * @method  getDataList
      * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
      */
     async getDataList(){
         await super.getDataList();
         //去掉每行显示重复的项目，如单号、仓库等主表的信息
         let docuID =0;
         for(let rec of this.list.data){
             if(rec[this.pk] == docuID){
                 rec.c_no ='';
                 rec.c_stock='';
                 rec.c_stock_to = '';   //多加一个属性是不会死的 ^_^
                 rec.c_user='';
                 rec.c_time='';
             }else {
                 docuID = rec[this.pk];
             }
         }
    }

    /**
     * 取当前记录对象，用于新增和修改的编辑页面展示
     * @method  getDataRecord
     * @return {object} 当前记录对象
     */
    async getDataRecord(){
        this.mod.c_datasource = this.mod.c_table;
        return super.getDataRecord();
    }

    /**
     * 修改状态，供界面按钮直接调用，工作流相关方法（状态流转类）</br>
     * 子类中覆写本方法，可以根据业务对象的状态增加其他逻辑
     * @method  updateStatus
     * @return {object} 结果输出
     * @params {int} id 记录ID
     * @params {int} actID 流程节点ID
     * @params {int} status 状态值，一般在t_code表中设置
     * @params {boolean} isSelf 自身表单的调用，区别于其他模块的调用
     */
    async updateStatus(id, actID, status, isSelf){
        //修改业务对象状态
        let ret = await super.updateStatus(id, actID, status,isSelf);
        debug(ret,'douc_list.updateStatus - super.ret');
        if(ret.statusCode === 200 && isSelf){
            //增加历史状态记录,此处关联已经明确，逻辑明确，故而直接增加状态记录
            let apprRec = {c_link:id, c_link_type:this.mod.c_table, c_modulename:this.mod.c_modulename,c_status:status, c_desc:'',
                c_user:this.mod.user.id, c_time:think.datetime(), c_group:this.mod.user.groupID, c_act:actID};
            await cmpage.model('cmpage/base').model('t_appr').add(apprRec);
        }
        return ret;

    }

}
