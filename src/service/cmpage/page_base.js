'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**

 @module cmpage.service
 */

/**
 * 普通页面的数据处理类，实现了具体的操作方法
 * @class cmpage.service.page
 */
const Base = require('./base.js');

module.exports = class extends Base {

    constructor() {
        super();
        //this.pk = 'id';     //主键字段名
        this.mod = {}; //模块主设置信息，及传入的参数等,
        this.modQuerys = {}; //模块查询列设置信息
        this.modCols = {}; //模块显示列设置信息
        this.modEdits = {}; //模块编辑列设置信息
        this.modBtns = {}; //模块按钮设置信息
        this.list = {}; //结果列表集
        this.rec = {}; //当前记录
        this.proc = {}; //相关工作流模板对象
    }

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage() {
        this.connStr = this.mod.c_conn_name;
        this.config = think.config('model')[this.connStr];
        this.pk = this.mod.c_pk;

        if (this.mod.c_proc > 0) { //流程模板的主业务类
            this.proc = await cmpage.service('flow/proc').getProcById(this.mod.c_proc);
            this.proc.c_link_model = this.mod.c_path; //设置流程模板的关联类和表
            this.proc.c_link_type = this.mod.c_table;
            this.proc.linkModulename = this.mod.c_modulename;
        }
        this.mod.c_other = think.isEmpty(this.mod.c_other) ? {} : this.cmpage.objFromString(this.mod.c_other);
        this.mod.c_module_slave = think.isEmpty(this.mod.c_module_slave) ? {} : cmpage.objFromString(this.mod.c_module_slave);

    }

    /**
     * 根据设置取显示的替换值
     * @method  getReplaceText
     * @return {string}  替换的字符串
     * @param   {string} value 当前值
     * @param   {string} replaceItems  替换的设置值，支持两种方式
     *                      1. 函数如：admin/code:getXXXXXX
     *                      2. json如：[{value:true,text:'男'},{value:false,text:'女'}]
     */
    async getReplaceText(value, replaceItems) {
        if (/^\[{\w+/.test(replaceItems)) {
            //let items = (think.isString(replaceItems) ? JSON.parse(replaceItems.replace(/##/ig,'\"')):replaceItems);
            let items = (think.isString(replaceItems) ? cmpage.arrFromString(replaceItems.replace(/##/ig, '\'')) : replaceItems);
            for (let item of items) {
                if (item.value == value) {
                    return item.text;
                }
            }
        } else {
            let its = replaceItems.split(':'); //设置如： admin/code:getNameById
            if (its.length > 1) {
                let fnModel = cmpage.service(its[0]); //通过某个模块的某个方法取下拉设置
                if (think.isFunction(fnModel[its[1]])) {
                    let args = [];
                    args.push(value);
                    if (its.length > 2) {
                        for (let arg of its) {
                            if (its.indexOf(arg) > 1) args.push(arg);
                        }
                    }
                    return await fnModel[its[1]](...args);
                }
            }
        }

        return "";
    }

    /**
     * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
     * @method  getDataList
     * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
     */
    async getDataList() {
        if (this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE) {
            this.mod.c_page_size = 8;
            this.mod.pageSize = 8;
        }
        let where = await this.getQueryWhere();
        //cmpage.debug(`select count(id) as count from ${this.mod.c_datasource} ${where} `);

        let cnt = await this.query(`select count(${this.pk}) as count from ${this.mod.c_datasource} ${where} `);
        //debug(cnt, 'page.getDataList - cnt');
        this.list.count = cnt[0].count;
        this.list.data = [];
        this.list.ids = [];
        const config = think.config('model')[this.connStr];
        if (this.list.count > 0) {
            //cmpage.debug(this.mod);
            let data = [];
            if (this.mod.c_pager) {
                let sql = `select ${this.getListFields(this.modCols)} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by}
                    limit ${this.mod.c_page_size} offset ${this.mod.c_page_size * (this.mod.pageIndex - 1)}`;
                if (config.type == 'mssql') {
                    let sortType = this.mod.c_sort_by.toLowerCase().indexOf(' desc') == -1 ? 0 : 1;
                    let sortCol = this.mod.c_sort_by.toLowerCase().replace(/asc/g, '').replace(/desc/g, '');
                    sql = `QueryPage '${this.mod.c_datasource}','${this.getListFields(this.modCols)}',${this.mod.pageSize},${this.mod.pageIndex},
                        '${where}','${sortCol}',${sortType},'${this.pk}'`;
                }
                //debug(sql,'page.getDataList - sql');
                data = await this.query(sql);
            } else {
                let limit = think.isEmpty(this.mod.c_data_limit) ? 2000 : this.mod.c_data_limit;
                let sql = `select ${this.getListFields()} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by} limit ${limit}`;
                if (config.type == 'mssql') {
                    sql = `select top ${limit} ${this.getListFields()} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by} `;
                }
                data = await this.query(sql);
            }

            for (let rec of data) {
                if (data.indexOf(rec) == data.length - 1 && config.type == 'mssql' && this.mod.c_pager) break;
                this.list.ids.push(rec[this.pk]);
                this.list.data.push(rec);
            }

        }
    }

    /**
     * 取查询项的设置，结合POST参数，得到Where字句，重写本方法可以定制或修改SQL的where子句
     * @method  getQueryWhere
     * @return {string} where 子句， 形如： where xxx and xxx
     */
    async getQueryWhere() {
        let ret = [' where 1=1'];
        let parmsUrl = this.mod.parmsUrl;
        debug(parmsUrl,'parmsUrl');
        for (let md of this.modQuerys) {
            if (md.c_type === "fixed") { //如果是‘固定’，则直接增加c_memo中的设置值
                let wh = ` (${md.c_memo.replace(/#userID#/,this.mod.user.id)
                    .replace(/#groupID#/,this.mod.user.groupID)
                    .replace(/#groups#/,this.mod.user.groups)
                    .split(/##/).join('\'')})`;
                wh = this.cmpage.objPropertysReplaceToStr(wh,parmsUrl);
                if (wh.indexOf('#value#') > -1) {
                    wh = think.isEmpty(parmsUrl[md.c_column]) ? '' : wh.replace(/#value#/, parmsUrl[md.c_column]);
                }

                //debug(parmsUrl,'page.getQueryWhere - parmsUrl');
                //debug(md.c_memo,'page.getQueryWhere - md.c_memo');
                if (!think.isEmpty(wh)) {
                    ret.push(wh);
                }
                continue;
            }
            if (md.c_isshow && md.c_op !== 'NO') {
                if (!think.isEmpty(this.mod.query[md.c_column])) {
                    //debug(md,'page.getQueryWhere - md');
                    //debug(this.mod.query,'page.getQueryWhere - this.mod.query');
                    md.c_default = this.mod.query[md.c_column];
                    let value = this.mod.query[md.c_column].split('\'').join(' ').split('\"').join(' ').trim();
                    value = this.cmpage.filterSensitiveString(value);
                    if (md.c_coltype == "bool") {
                        value = think.isEmpty(value) ? 0 : 1;
                    }
                    if (md.c_type.indexOf('elect') > 0 && (value === '-1' || value === '')) {
                        //debug(md,'page.getQueryWhere.select - md');
                        continue;
                    }
                    ret.push(md.c_desc + ' ' + this.getOpValue(md.c_op, value, md.c_coltype));
                }
            }
        }
        //debug(ret.join(' and '),'page.getQueryWhere - return');
        return ret.join(' and ');
    }


    getOpValue(op, value, coltype) {
        let ops = [{
                op: "EQ",
                val: "= #value#"
            }, {
                op: "NE",
                val: "<> #value#"
            }, {
                op: "CN",
                val: "like #value#"
            }, {
                op: "NC",
                val: "not like #value#"
            }, {
                op: "IN",
                val: "in (#value#)"
            },
            {
                op: "NI",
                val: "not in (#value#)"
            }, {
                op: "GE",
                val: ">= #value#"
            }, {
                op: "LE",
                val: "<= #value#"
            }, {
                op: "GT",
                val: "> #value#"
            }, {
                op: "LT",
                val: "< #value#"
            }
        ];
        let val = value;

        if (coltype === "varchar" || coltype === "date" || coltype === "timestamp") {
            if (op === "CN" || op === "NC") {
                val = `'%${val}%'`;
            } else if (op === "IN" || op === "NI") { //每项分别加单引号
                let str = val.Split(',');
                let sArr = [];
                for (let s of str) {
                    sArr.push(`'${s}'`);
                }
                val = sArr.join(',');
            } else {
                val = `'${val}'`;
            }
        }
        for (let operate of ops) {
            if (operate.op === op) {
                return operate.val.replace(/#value#/, val);
            }
        }
        return "";
    }

    /**
     * 根据设置取得页面显示列表返回的字段，一般不需要重写本方法
     * @method  getListFields
     * @return {string} fields 部分， 形如：id,c_name,xxx
     */
    getListFields() {
        let fields = [];
        for (let col of this.modCols) {
            if (!col.c_isretrieve) continue;
            //if(col.c_column ==='c_user'){  console.log(col);}
            if (col.c_type === "replace" && (col.c_isshow || col.c_isview) && (col.c_memo.indexOf('select') === 0)) //以select开头
            {
                fields.push(`(${col.c_memo}) as ${col.c_column}`);
            } else {
                fields.push(col.c_desc == col.c_column ? col.c_desc : `${col.c_desc} as ${col.c_column}`);
            }
        }

        //  cmpage.debug(fields);
        return fields.join(',');
    }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit() {
        let md = {};
        md.c_user = this.mod.user.id;
        md.c_group = this.mod.user.groupID;
        md.c_time = think.datetime();
        for (let edit of this.modEdits) {
            let key = edit.c_column.trim();
            if (['c_user', 'c_group'].includes(key)) {
                continue;
            }
            //URL参数赋值
            if (!think.isEmpty(this.mod.parmsUrl[key])) {
                md[key] = this.mod.parmsUrl[key];
                continue;
            }

            if (edit.c_coltype === 'int' || edit.c_coltype === 'float') {
                md[key] = 0;
            } else if (edit.c_coltype === 'bool') {
                md[key] = false;
            } else if (edit.c_coltype === 'timestamp') {
                md[key] = think.datetime();
            } else if (edit.c_coltype === 'date') {
                md[key] = think.datetime(new Date, "YYYY-MM-DD");
            } else {
                md[key] = '';
            }
        }
        //如果有关联流程，则设置初始的 c_act, c_status
        if (!think.isEmpty(this.proc) && this.proc.c_act_start > 0) {
            debug(this.proc, 'page.htmlGetBtnList - this.proc');
            md.c_act = this.proc.c_act_start;
            let actStart = await cmpage.service('flow/act').getActById(this.proc.c_act_start);
            md.c_status = actStart.c_domain_st;
        }

        md[this.pk] = 0;
        return md
    }

    /**
     * 取当前记录对象，用于新增和修改的编辑页面展示
     * @method  getDataRecord
     * @return {object} 当前记录对象
     */
    async getDataRecord() {
        let md = {};
        if (this.mod.editID > 0) {
            let fields = [];
            for (let edit of this.modEdits) {
                if (edit.c_desc.indexOf('fn:') !== 0 && edit.c_isretrieve) {
                    fields.push(edit.c_desc == edit.c_column ? edit.c_desc : `${edit.c_desc} as ${edit.c_column}`);
                }
            }
            let list = await this.model(this.mod.c_datasource).field(fields.join(',')).where(`${this.pk}=${this.mod.editID}`).select();
            md = list[0];
            // for(let p in md){   //去掉 null 值
            //     if(md[p] == 'null') md[p] = '';
            // }
        } else {
            md = await this.pageEditInit();
        }
        //cmpage.warn(md,'page_base.getDataRecord - md');
        //对记录进行处理
        for (let edit of this.modEdits) {
            if (edit.c_coltype === 'bool') {
                md[edit.c_column] = think.isBoolean(md[edit.c_column]) ? md[edit.c_column] : (md[edit.c_column] === 1);
            }
        }
        //cmpage.warn(md,'page_base.getDataRecord - md');
        this.rec = md;
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
        //debug(parms,'page.pageSave - parms - 递交的内容');
        //debug(this.mod,'page.pageSave - this.mod');
        //debug(this.pk,'page.pageSave - this.pk');
        //cmpage.debug(this.modEdits,'this.mod.pageSave - this.modEdits')
        this.rec = {};
        for (let edit of this.modEdits) {
            if (edit.c_editable && edit.c_column.indexOf('c_') === 0) { //&& this.isExistColumn(edit.c_column,colList)
                //"varchar", "int","date","timestamp","bool","float"
                let colValue = parms[edit.c_column];
                if (edit.c_coltype === 'int') {
                    this.rec[edit.c_column] = parseInt(colValue) || 0;
                } else if (edit.c_coltype === 'float') {
                    this.rec[edit.c_column] = parseFloat(colValue) || 0.0;
                } else if (edit.c_coltype === 'bool') {
                    this.rec[edit.c_column] =(colValue && colValue.toLowerCase() === 'false') ? true : Boolean(colValue);
                }else{
                    this.rec[edit.c_column] = colValue;
                }
            }
        }
        //cmpage.debug(this.rec,'page.pageSave - 保存内容');
        if (this.mod.editID == 0) {
            //let id = await this.query(cmpage.getInsertSql(md,this.mod.c_table) +' returning id;');
            this.rec[this.pk] = await this.model(this.mod.c_table).add(this.rec);
            await this.pageSaveLog(parms, 'add');
        } else {
            await this.model(this.mod.c_table).where(`${this.pk}=${this.mod.editID}`).update(this.rec);
            this.rec[this.pk] = this.mod.editID;
            await this.pageSaveLog(parms, 'update');
        }
        return {
            statusCode: 200,
            message: '保存成功！'
        };
    }

    /**
     * 保存后的操作日志记录,，通过重写可在子类中定制日志的格式
     * @method  pageSaveLog
     * @return {无}
     * @param  {object} parms 前端传入的FORM参数
     * @param {string} flag 操作的类型标志
     */
    async pageSaveLog(parms, flag) {
        let log = [];
        let md = this.rec;
        if (flag === 'add') {
            for (let edit of this.modEdits) {
                if (edit.c_editable) {
                    log.push(`${edit.c_name}:${md[edit.c_column]}`);
                }
            }
            await cmpage.service('admin/log').addLog(this.mod.user, log.join(', '), this.mod.id, md[this.pk], cmpage.enumStatusExecute.SUCCESS, cmpage.enumLogType.ADD);
        } else if (flag === 'update') {
            //debug(this.mod,'page.pageSaveLog - this.mod');
            let oldMd = {};
            if (think.isEmpty(parms["old_record"])) {
                oldMd = await this.getDataRecord();
            } else {
                oldMd = JSON.parse(parms["old_record"]);
            }
            //debug(oldMd,'page.pageSaveLog - oldMd');
            log.push(`${this.pk}:${md[this.pk]}`);
            for (let edit of this.modEdits) {
                if (edit.c_editable && edit.c_column !== 'c_time' && edit.c_column !== 'c_user' && edit.c_column.indexOf('c_') === 0 && edit.c_type.indexOf('readonly') === -1) {
                    if (edit.c_coltype === 'timestamp') {
                        md[edit.c_column] = cmpage.datetime(md[edit.c_column], 'yyyy-MM-dd HH:mm:ss');
                        oldMd[edit.c_column] = cmpage.datetime(oldMd[edit.c_column], 'yyyy-MM-dd HH:mm:ss');
                    }
                    //cmpage.debug(edit,'this.mod.pageSaveLog - edit - 值有变化的字段保存到日志');
                    //cmpage.debug(md[edit.c_column],'this.mod.pageSaveLog - md[edit.c_column] ');
                    let newValue = cmpage.objToString(md[edit.c_column]).replace(/'/g, '');
                    if (oldMd[edit.c_column] != newValue) {
                        log.push(`${edit.c_name}: ${oldMd[edit.c_column]} --> ${newValue}`);
                    } else if (edit.c_column === 'c_name') {
                        log.push(`c_name:${md.c_name}`);
                    }
                }
            }
            await cmpage.service('admin/log').addLog(this.mod.user, log.join(', '), this.mod.id, md[this.pk], cmpage.enumStatusExecute.SUCCESS, cmpage.enumLogType.UPDATE);
        }
    }

    //判断某个列是否存在于某个表中
    isExistColumn(column, list) {
        for (let col of list) {
            if (col.column === column) {
                return true;
            }
        }
        return false;
    }

    //替换备注设置中的特殊字符,需要组成SQL
    getReplaceToSpecialChar(memo) {
        //let ret = memo.split('*').join('\&').split(/##/).join("\'");
        if (think.isEmpty(memo)) {
            return '';
        }
        let parms = memo.split('*');
        if (parms.length > 1) {
            for (let parm of parms) {
                if (parm.indexOf('[[') == 0) { // [[ 开头表示从parmsUrl中取值
                    let key = parm.substr(2, parm.length - 2).trim();
                    let parmsUrl = this.mod.parmsUrl;
                    let val = parmsUrl[`${key}`];
                    parms[parms.indexOf(parm)] = `${key}=${val}`;
                    //console.log(parms);
                }
            }
        }
        //let ret = memo.replace(/\*/ig,'\&').replace(/##/ig,"\'");
        return parms.join('\&').replace(/##/g, "'");
    }

    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete() {
        let ret = {
            statusCode: 200,
            message: '删除成功！',
            data: {}
        };

        if (this.mod.recID > 0) {
            if (think.isEmpty(this.mod.flag)) {
                await this.model(this.mod.c_table).where(`${this.pk}=${this.mod.recID}`).update({
                    c_status: -1
                });
            } else {
                await this.model(this.mod.c_table).where(`${this.pk}=${this.mod.recID}`).delete();
            }
        }
        return ret;
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
        debug(id, 'page.updateStatus - id');
        if (id > 0 && actID > 0 && status > 0) {
            let rec = {
                c_status: status,
                c_act: actID,
                c_user: this.mod.user.id,
                c_time: think.datetime()
            };

            await this.model(this.mod.c_table).where(`${this.pk}=${id}`).update(rec);
            return {
                statusCode: 200,
                message: '操作执行成功！'
            }
        }
        return {
            statusCode: 300,
            message: '参数错误!'
        }
    }

    /**
     * 根据参数ID取参数的名称，一般用于页面模块配置中的‘替换’调用: admin/cdoe:getNameById </br>
     * 子类中重写的时候需要为 this.mod.c_table 和 this.pk 赋值，因为直接调用的时候进行模块设置的初始化 </br>
     * 当然也可以重写 constructor 设置这两个值,例如：docu/supplier
     * @method  getNameById
     * @return {string}  参数名称
     * @param {int} id  参数ID
     * @param   {string} fieldNames 字段名称,逗号分隔
     * @param   {string} joinStr 连接的字符串
     */
    async getNameById(id, fieldNames, joinStr) {
        if (id == 0) return '';
        let rec = await this.model(this.mod.c_table).where(`${this.pk}=${id}`).find();
        //cmpage.warn(rec,'page.getNameById - rec');
        if (think.isEmpty(rec)) return '';
        if (think.isEmpty(fieldNames)) {
            return rec.c_name; //默认返回 c_name 字段值
        } else {
            return cmpage.strGetValuesByPropertyName(rec, fieldNames, joinStr)
        }
    }

}