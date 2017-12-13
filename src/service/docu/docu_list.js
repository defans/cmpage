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

const CMPage = require('../cmpage/page_ms.js');

module.exports = class extends CMPage {

    constructor() {
        super();

        this.pk = 'c_id';
        this.docuType = {
            id: 0,
            name: '',
            header: '',
            key: 'c_docu'
        }; //单据类型, 参见：cmpage.enumDocuType （cmpage_global_docu.js）
    }

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage() {
        await super.initPage();
        //根据模块名称，取单据基本信息
        let typeName = this.mod.c_modulename.replace(/List/, '');
        for (let p in cmpage.enumDocuType) {
            if (p == typeName) {
                this.docuType.id = cmpage.enumDocuType[p];
                this.docuType.name = cmpage.enumDocuType[p + '_name'];
                this.docuType.header = cmpage.enumDocuType[p + '_header'];
            }
        }
        if (this.docuType.id === cmpage.enumDocuType.OrderApply) this.docuType.key = 'c_order_apply';
        if (this.docuType.id === cmpage.enumDocuType.Order) this.docuType.key = 'c_order';
        //this.pk = 'c_id';
        //debug(this.docuType,'docu_list.initDocuType - this.docuType');
        debug(this.proc, 'docu_list.initDocuType - this.proc');
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit() {
        let md = await super.pageEditInit();
        md.c_no = await this.getDocuNo();
        md.c_dept = this.mod.user.c_dept;
        md.c_way = 1;
        md.c_type = this.docuType.id;
        md.c_is_back = false;
        md.c_close = false;

        md.c_applicant = this.mod.user.id;
        md.c_manager = this.mod.user.c_manager;
        md.c_salesman = this.mod.user.id;
        md.status_name = md.c_status;

        this.mod.c_edit_column = 1; //新增时，由于没有从表，故而改成一列编辑
        //debug(this.mod.user,'docu_list.pageEditInit - this.mod.user');
        //debug(md,'docu_list.pageEditInit - md');
        return md;
    }
    /**
     * 编辑页面保存,<br/>
     * 如果是多个表的数据产生的编辑页，则根据存在于this.mod.c_table中的列更新表，一般需要在子类中继承，例如： admin/user:pageSave
     * @method  pageSave
     * @return {object} 如果有验证错误，则返回格式： {statusCode:300, message:'xxxxxx'}
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms) {
        if (this.mod.editID == 0) {
            //重新生成新的单据号，避免并发保存的时候重复
            parms.c_no = await this.getDocuNo();
        }
        this.cmpage.warn(parms);
        return await super.pageSave(parms);
    }
    /**
     * 根据单据类型取单号
     * @method  getDocuNo
     * @return {string}  单号：形如： PR201610120001
     */
    async getDocuNo() {
        let no = this.docuType.header + cmpage.datetime(null, 'YYYYMMDD');
        //debug(no,'docu.getDocuNo - no');
        //let maxNo = await this.model(this.mod.c_table).where({c_no:['like',no+'%']}).max('c_no');
        let list = await this.query(`select max(c_no) as maxno from ${this.mod.c_table} where c_no like '${no}%'`);
        //debug(list,'docu.getDocuNo - list');
        let maxno = list[0]['maxno'];
        //debug(maxno,'docu.getDocuNo - maxno');
        let cnt = '0001';
        if (!think.isEmpty(maxno)) {
            cnt = parseInt(maxno.substring(10)) + 1;
            cnt = cnt.toString();
        }

        return no + '0000'.substring(0, 4 - cnt.length) + cnt;
    }

    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere() {
        //通过父类的方法取查询列设置解析后的where子句
        let where = await super.getQueryWhere();
        //此处增加额外的条件
        if (this.docuType.id == cmpage.enumDocuType.DocuInvalid || this.docuType.id == cmpage.enumDocuType.Order || this.docuType.id == cmpage.enumDocuType.OrderApply) {
            where += ` and c_status <> -1 and c_group in(${this.mod.user.groups})`;
        } else if (this.docuType.id == cmpage.enumDocuType.DocuInvalid) {
            where += ` and c_status = -1 and c_group in(${this.mod.user.groups})`;
        } else {
            where += ` and c_status<>-1 and c_type=${this.docuType.id} and c_group in(${this.mod.user.groups})`;
        }

        return where;
    }

    /**
     * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
     * @method  getDataList
     * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
     */
    async getDataList() {
        await super.getDataList();
        //分页列表中不处理工作流相关
        this.proc = {};
        //去掉每行显示重复的项目，如单号、仓库等主表的信息
        let docuID = 0;
        for (let rec of this.list.data) {
            if (rec[this.pk] == docuID) {
                rec.c_no = '';
                rec.c_stock = '';
                rec.c_stock_to = ''; //多加属性又不会死 ^_^
                rec.c_user = '';
                rec.c_time = '';
                rec.status_name = '';
                rec.c_status = 0;
                rec.c_supplier = '';
                rec.isShowListBtn = false;
            } else {
                docuID = rec[this.pk];
                rec.isShowListBtn = true;
            }
        }
        //debug(this.list.data, 'docu_list.getDataList - this.list.data');
    }

    // /**
    //  * 取记录列表每一行的按钮设置，组合成HTML输出，子类中重写本方法可以定制每行按钮的输出效果
    //  * @method  htmlGetBtnList
    //  * @return {string}  HTML片段
    //  * @param   {object} rec 每行的记录对象
    //  */
    // async htmlGetBtnList(rec){
    //     if(rec.isShowListBtn)   return await super.htmlGetBtnList(rec);
    //     return '';
    // }

    /**
     * 取当前记录对象，用于新增和修改的编辑页面展示
     * @method  getDataRecord
     * @return {object} 当前记录对象
     */
    async getDataRecord() {
        let datasource = this.mod.c_datasource;
        this.mod.c_datasource = this.mod.c_table; //数据源改成实际表，
        let md = await super.getDataRecord();
        debug(md, 'docu_list.getDataRecord - md');
        if (md.c_status != 1211 && this.mod.editID > 0) {
            this.mod.parmsUrl.readonly = true;
            this.mod.c_datasource = datasource; //调用的是查看页面，所以恢复数据源
        }
        //debug(md,'docu_list.getDataRecord - md');
        return md;
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
    async updateStatus(id, actID, status, isSelf) {
        //修改业务对象状态
        let ret = {
            statusCode: 300,
            message: '参数错误!'
        };
        if (id > 0 && actID > 0 && status > 0) {
            let rec = {
                c_status: status,
                c_act: actID,
                c_user: this.mod.user.id,
                c_time: think.datetime()
            };
            await this.query(`update ${this.mod.c_table} set c_status=${status},c_act=${actID},c_appr_people=${this.mod.user.id},
                c_appr_time='${think.datetime()}',c_time='${think.datetime()}' where c_id=${id}`);
            ret = {
                statusCode: 200,
                message: '操作执行成功！'
            }
        }
        if (ret.statusCode === 200 && isSelf) {
            //增加历史状态记录,此处关联已经明确，逻辑明确，故而直接增加状态记录
            let apprRec = {
                c_link: id,
                c_link_type: this.mod.c_table,
                c_modulename: this.mod.c_modulename,
                c_status: status,
                c_desc: '',
                c_user: this.mod.user.id,
                c_time: think.datetime(),
                c_group: this.mod.user.groupID,
                c_act: actID
            };
            await cmpage.service('cmpage/base').model('t_appr').add(apprRec);
        }
        return ret;

    }

}