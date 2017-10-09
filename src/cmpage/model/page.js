'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**

 @module cmpage.model
 */

/**
 * 普通页面的数据处理类，实现了具体的操作方法
 * @class cmpage.model.page
 */
 const Base = require('./base.js');

module.exports = class extends Base {


    constructor(name, config = {}) {
        super(name,config);
        this.mod = {};   //模块主设置信息，及传入的参数等,
        this.modQuerys = {}; //模块查询列设置信息
        this.modCols = {};    //模块显示列设置信息
        this.modEdits = {};   //模块编辑列设置信息
        this.modBtns = {};    //模块按钮设置信息
        this.list = {};     //结果列表集
        this.rec = {};      //当前记录
        this.proc = {};      //相关工作流模板对象
    }

    /**
     * 初始化设置页面参数
     * @method  initPage
     */
    async initPage(){
        if(this.mod.c_proc >0){     //流程模板的主业务类
            this.proc = await cmpage.model('flow/proc').getProcById(this.mod.c_proc);
            this.proc.c_link_model = this.mod.c_path;   //设置流程模板的关联类和表
            this.proc.c_link_type = this.mod.c_table;
            this.proc.linkModulename = this.mod.c_modulename;
        }
        this.mod.c_other = think.isEmpty(this.mod.c_other) ? {}:cmpage.objFromString(this.mod.c_other) ;
        this.mod.c_module_slave = think.isEmpty(this.mod.c_module_slave) ? {}:cmpage.objFromString(this.mod.c_module_slave) ;

    }
    /**
     * 执行原生SQL语句，取结果集返回, 增加了SQL语句的控制台提示
     * @return {array} 查询结果集
     * @param {string} sql
     * @param {object} options 参数设置
     */
    async query(sql,options) {
        debug(sql,'page.query - SQL');
        return await super.query(sql,options);
    }

    /**
     * 取查询项的设置，组合成HTML输出
     * @method  htmlGetQuery
     * @return {Array}  查询的HTML片段，包括 bjui-moreSearch 部分
     */
    async htmlGetQuery(){
        let html =[];
        let html0 = [];
        let provinceValue ='';
        let cityValue='';
        let k =0;
        for(let col of this.modQuerys){
            if (col.c_isshow) {
                if(k >=this.mod.user.queryColumns && k !== -1){
                    for(let h of html){    html0.push(h);       }
                    html0.push('<button type="button" class="showMoreSearch" data-toggle="moresearch" data-name="custom"><i class="fa fa-angle-double-down"></i></button>');
                    html =[];
                    k = -1;
                }
                if(!think.isEmpty(this.mod.query[col.c_column])){
                    col.c_default = this.mod.query[col.c_column];
                }
                if(col.c_type !== "hidden" && col.c_type !== "provinceSelect" && col.c_type !== "citySelect" && col.c_type !== "countrySelect" && col.c_type !== "fixed")                {
                    html.push(`<label  >${col.c_name}</label>`);
                    if(k !== -1){ k += 1; }
                }
                if (col.c_type === "hidden"){
                    html.push(`<input id="query${this.mod.c_modulename}_${col.c_column}" name="${col.c_column}" type="hidden" value="${col.c_default}"   />`);
                }else  if (col.c_coltype === "datetime" || col.c_coltype === "date" || col.c_coltype === "timestamp"){
                    html.push(`<input type="text" id="query${this.mod.c_modulename}_${col.c_column}" name="${col.c_column}" value="${col.c_default}" data-toggle="datepicker" data-rule="date" size="12" class="form-control" />`);
                }else if (col.c_coltype === "bool"){
                    html.push(`<input type="checkbox" id="query${this.mod.c_modulename}_${col.c_column}" name="${col.c_column}" data-toggle="icheck" value="true" data-label="是"
                        ${col.c_default ? "checked=checked" : ""} class="form-control" />`);
                }else if (col.c_type === "select"){
                    let options = await this.getOptions(col,true);
                    html.push(`<select id="query${this.mod.c_modulename}_${col.c_column}" name="${col.c_column}" data-toggle="selectpicker" > ${options} </select>`);
                } else if (col.c_type === "selectTree" || col.c_type === "selectTreeMultiple") {
                    let treeOptions = await this.getOptionsTree(col,true);
                    html.push(`<input id="query${this.mod.c_modulename + col.c_column}" name="${col.c_column}"  type="hidden" value="${col.c_default}" />
                        <input name="${col.c_column}Show" type="text" size="25" value="${treeOptions.selectName}" data-toggle="selectztree" data-tree="#selectTreeQuery${this.mod.c_modulename + col.c_column}"   readonly />
                        <ul id="selectTreeQuery${this.mod.c_modulename + col.c_column}" class="ztree hide" data-toggle="ztree" data-expand-all="false" data-check-enable="true"
                        data-value-input="query${this.mod.c_modulename + col.c_column}" ${(col.c_type === "selectTree" ? ' data-chk-style="radio" data-radio-type="all" ':' ')}
                        data-on-check="selectNodeCheck" data-on-click="selectNodeClick" > ${treeOptions.options} </ul>`);
                }else if (col.c_type === "lookup"){
                    html.push(`<input id="query${this.mod.c_modulename}_${col.c_column}" name="${col.c_column}" type="lookup" size="10" value="${col.c_default}"  data-width="800" data-height="600"
                        data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${this.getReplaceToSpecialChar(col.c_memo)}" readonly="readonly" />`);
                }else if (col.c_type === "provinceSelect"){
                    html.push(`<select name="c_province" data-toggle="selectpicker"  data-nextselect="#city${this.mod.c_modulename}Query"
                        data-refurl="/cmpage/utils/get_citys?province={value}">  ${await cmpage.model('admin/area').getProvinceItems(col.c_default,true)} </select>`);
                    provinceValue = col.c_default;
                }else if (col.c_type === "citySelect"){
                    html.push(`<select name="c_city" id="city${this.mod.c_modulename}Query" data-toggle="selectpicker" data-nextselect="#country${this.mod.c_modulename}Query"
                        data-refurl="/cmpage/utils/get_countrys?city={value}">${await cmpage.model('admin/area').getCityItems(col.c_default,true,provinceValue )} </select>`);
                    cityValue = col.c_default;
                }else if (col.c_type === "countrySelect"){
                    html.push(`<select name="c_country" id="country${this.mod.c_modulename}Query" data-toggle="selectpicker" >${await cmpage.model('admin/area').getCountryItems(col.c_default,true,cityValue)} </select>`);
                }else if( col.c_type !== "fixed"){
                    html.push(`<input id="query${this.mod.c_modulename}_${col.c_column}" name="${col.c_column}" type="${col.c_type}" size="${col.c_width}" value="${col.c_default}" data-rule="${col.c_memo}" class="form-control"  />`);
                }
            }
        }

        if(html0.length === 0){     //如果不超过 3 项查询的时候
            html0 = html;
            html = [];
        }
        return [html0.join(' '), html.join(' ')];
    }

    /**
     * 输出额外的按钮和js函数和HTML片段，区别于 getPageOther
     * @method  htmlGetOther
     * @return {string}  html片段
     */
    async htmlGetOther(){
        return ``;
    }

    /**
     * 取下拉框的选项集
     * @method  getOptions
     * @return {string}  下拉框选项的HTML片段
     * @param   {object} md 下拉项的设置，其中md.c_default为默认值，可以在调用本方法前修改
     * @param   {bool} [isBlank=false]   下拉项中是否增加空项，一般查询项是需要的
     */
    async getOptions(md, isBlank){
        let items = [];
        if (md.c_type == "select") {          //下拉框设置
            //cmpage.debug(md.c_memo);
            if(isBlank){
                items.push('<option value="0"> </option>');
            }
            if (/^select*/.test(md.c_memo)) {    //以select开头
                //let sql = md.c_memo.replace(/#group#/,think.session('groupID')).replace(/##/,"'");
                let sql = md.c_memo;
                let list = await this.query(sql);
                for(let rec of list) {
                    items.push( `<option value='${rec.id}' ${rec.id === md.c_default ? "selected" : ""} >${rec.c_name} </option>`);
                }
            }else {
                if (/^\[{\w+/.test(md.c_memo)) {    //以 [ 开头       //设置如：[{##value##:true,##text##:##男##},{##value##:false,##text##:##女##}]
                    let its = (think.isString(md.c_memo) ? JSON.parse(md.c_memo.replace(/##/ig,'\"')) : []);
                    for (let it of its) {
                        items.push(`<option value='${it.value}' ${it.value === md.c_default ? "selected" : ""} >${it.text} </option>`);
                    }
                }else{
                    let its = md.c_memo.trim().split(':');        //设置如： admin/code:getParmsByPid:3
                    let parms = [];
                    let fnModel = cmpage.model(its[0]);     //通过某个模块的某个方法取下拉设置
                    if(think.isFunction(fnModel[its[1]])){
                        if(its.length > 2){
                            parms = await fnModel[ its[1] ](its[2]);
                        }else{
                            parms = await fnModel[ its[1] ]();
                        }
                    }
                    //cmpage.debug(parms);
                    //如果设置有字段和连接字符的参数，形如： admin/code:getParmsByPid:3:c_ucode,c_name:-
                    let fieldNames = its.length >3 ? its[3] : '';
                    let joinStr =  its.length >4 ? its[4] : ',';
                    for (let parm of parms) {
                        let text = its.length >3 ? cmpage.strGetValuesByPropertyName(parm, fieldNames, joinStr) : parm.c_name;
                        items.push(`<option value='${parm.id}' "  ${parm.id == md.c_default ? "selected" : ""} >${text}</option>`);
                    }
                }
            }
        }
//        cmpage.debug(items.join(' '));
        return items.join(' ');
    }

    /**
     * 取树状下拉框的选项集
     * @method  getOptionsTree
     * @return {Array}  查询的HTML片段，包括 bjui-moreSearch 部分
     * @param   {object} md 下拉项的设置，其中md.c_default为默认值，可以在调用本方法前修改
     * @param   {bool} [isBlank=false]   下拉项中是否增加空项，一般查询项是需要的
     */
    async getOptionsTree(md, isBlank){
        let selectName = '';
        let items = [];
        if (md.c_type.indexOf("select") ===0) {          //下拉框设置
            //cmpage.debug(md.c_memo);
            if(isBlank){
                items.push(`<li data-id='0' data-pid='0' data-checked=true > (不选择) </li>`);
            }
            if (md.c_memo.indexOf('select') ===0) {    //以select开头
                //let sql = md.c_memo.replace(/#group#/,think.session('groupID')).replace(/##/,"'");
                let sql = md.c_memo;
                let list = await this.query(sql);
                for(let rec of list) {
                    if(rec.id == md.c_default)  selectName += (think.isEmpty(selectName) ? '':',') +think.isEmpty(rec.name) ? rec.c_name : rec.name;
                    items.push( `<li data-id='${rec.id}' data-pid='${think.isEmpty(rec.pid) ? rec.c_pid : rec.pid}' + ${rec.id == md.c_default} ? "data-checked=true" : ""}
                            ${rec.checkDisalbed ? "data-chk-disabled=true  " : " "} ${list.indexOf(rec) == 0 ? "data-open=true " : " "} >${think.isEmpty(rec.name) ? rec.c_name : rec.name}</li>`);
                }
            }else {
                let its = md.c_memo.trim().split(':');        //设置如： admin/code:getTreeList:3
                let list = [];
                let fnModel = cmpage.model(its[0]);     //通过某个模块的某个方法取下拉设置
                if(think.isFunction(fnModel[its[1]])){
                    if(its.length === 3){
                        let parms = its[2].split(',');
                        list = await fnModel[ its[1] ](...parms);
                    }else{
                        list = await fnModel[ its[1] ]();
                    }
                }
                //cmpage.debug(parms);
                for (let rec of list) {
                    if(rec.id == md.c_default)  selectName += (think.isEmpty(selectName) ? '':',') +think.isEmpty(rec.name) ? rec.c_name : rec.name;
                    items.push( `<li data-id='${rec.id}' data-pid='${think.isEmpty(rec.pid) ? rec.c_pid : rec.pid}' + ${rec.id == md.c_default} ? "data-checked=true" : ""}
                            ${rec.checkDisalbed ? "data-chk-disabled=true  " : " "} ${list.indexOf(rec) == 0 ? "data-open=true " : " "} >${think.isEmpty(rec.name) ? rec.c_name : rec.name}</li>`);
                }
            }
        }
        //cmpage.debug(items.join(' '));
        debug(md,'page.getOptionsTree - md');
        return {selectName:selectName, options:items.join(' ')};
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
    async getReplaceText(value,replaceItems){
        if (/^\[{\w+/.test(replaceItems)) {
            //let items = (think.isString(replaceItems) ? JSON.parse(replaceItems.replace(/##/ig,'\"')):replaceItems);
            let items = (think.isString(replaceItems) ? cmpage.arrFromString(replaceItems.replace(/##/ig,'\'')):replaceItems);
            for(let item of items){
                if(item.value == value){
                    return item.text;
                }
            }
        }else
        {
            let its = replaceItems.split(':');        //设置如： admin/code:getNameById
            if(its.length >1){
                let fnModel = cmpage.model(its[0]);     //通过某个模块的某个方法取下拉设置
                if(think.isFunction(fnModel[its[1]])){
                    let args =[];
                    args.push(value);
                    if(its.length > 2){
                        for(let arg of its){
                            if(its.indexOf(arg) >1)   args.push(arg);
                        }
                    }
                    return await fnModel[ its[1] ](...args);
                }
            }
        }

        return "";
    }

    /**
     * 取顶部按钮的设置，分靠左和靠右两块，组合成HTML输出
     * @method  htmlGetBtnHeader
     * @return {string}  HTML片段
     */
    async htmlGetBtnHeader(){
      let html =[];
      let htmlRight =[];
      html.push(`<button type="submit" class="btn btn-default" id="btnSearch${this.mod.c_modulename}" data-icon="search">
      ${this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE ? "":"查询"}</button>`);
      if(!this.mod.parmsUrl.readonly){
          for(let btn of this.modBtns){
              btn.c_url = cmpage.objPropertysReplaceToStr(btn.c_url,this.mod.parmsUrl);
              if(btn.c_object.indexOf('.Edit') >0 || btn.c_object.indexOf('.Add') >0){
                  for(let p in this.mod.parmsUrl){
                      //自动添加列表模块的URL参数
                      if(!["modulename","id","c_id","_"].includes(p)){
                          btn.c_url += `&${p}=${this.mod.parmsUrl[p]}`;
                      }
                  }
              }
              if(this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE)    btn.c_label ='';
                if(btn.c_isshow && btn.c_location <10 && this.isShowBtn(null,btn)){
                    if(btn.c_location <6){
                        html.push(`<a class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${this.getReplaceToSpecialChar(btn.c_options)}"  data-on-close="page${this.mod.c_modulename}Edit_onClose"
                          data-icon="${btn.c_icon}" href="${this.getReplaceToSpecialChar(btn.c_url)}" data-title="${btn.c_title}" data-on-load="pageRecList_load"
                          onclick="${this.getReplaceToSpecialChar(btn.c_onclick)}">${btn.c_label}</a>`);
                    }else if(btn.c_location >5 && btn.c_location <10){      //靠右放置
                        htmlRight.push(`<a class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${this.getReplaceToSpecialChar(btn.c_options)}"  data-on-close="page${this.mod.c_modulename}Edit_onClose"
                          data-icon="${btn.c_icon}" href="${this.getReplaceToSpecialChar(btn.c_url)}" data-title="${btn.c_title}" data-on-load="pageRecList_load"
                          onclick="${this.getReplaceToSpecialChar(btn.c_onclick)}">${btn.c_label}</a>`);
                    }
                }
          }
      }
        //debug(this.mod.parmsUrl,'page.htmlGetBtnHeader - this.mod.parmsUrl');
        if(this.mod.parmsUrl.moduleOpen !== 'div'){
            htmlRight.push(`<button type="button" class="btn btn-close " data-icon="close">${this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE ? "":"关闭"}</button>`);
        }
      return html.join(' ')+(htmlRight.length >0 ? '<div class="pull-right">'+htmlRight.join(' ')+'</div>': '');
    }

    /**
     * 取记录列表每一行的按钮设置，组合成HTML输出，子类中重写本方法可以定制每行按钮的输出效果
     * @method  htmlGetBtnList
     * @return {string}  HTML片段
     * @param   {object} rec 每行的记录对象
     */
    async htmlGetBtnList(rec){
        let html=[];
        let k=0;
        let btnMore = '<div class="btn-group"> <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">'
            +'更多<span class="caret"></span> </button> <ul class="dropdown-menu" role="menu">';
        for(let btn of this.modBtns){
            //if(btn.c_object == 'OrderApplyList.ToOrder') debug(btn,'page.htmlGetBtnList - btn');
            if (btn.c_isshow && btn.c_location > 10 && this.isShowBtn(rec,btn)) {
                k +=1;
                if(k === this.mod.user.listBtns +1)  html.push(btnMore);
                let btnUrl = this.getReplaceToSpecialChar(cmpage.objPropertysReplaceToStr(btn.c_url,rec));
                let btnClick = this.getReplaceToSpecialChar(cmpage.objPropertysReplaceToStr(btn.c_onclick,rec));
                let options = this.getReplaceToSpecialChar(btn.c_options);
                btn.c_label = k >this.mod.user.listBtns ? (think.isEmpty(btn.c_label) ? btn.c_title : btn.c_label):btn.c_label;
                if(btn.c_object.indexOf('.Edit') >0 || btn.c_object.indexOf('.View') >0){
                    btnUrl += `&listIds=${this.list.ids.join(',')}`;
                }
                if(btn.c_opentype =='_self' || btn.c_opentype == '_blank'){
                    html.push(` <a class="${btn.c_class}" target="${btn.c_opentype}" title="${btn.c_title}" href="${btnUrl}"
                                onclick="${btnClick}" style="${btn.c_style}" >${btn.c_label}</a> `);
                }else{
                    html.push(` <a type="button" class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${options}" title="${btn.c_title}"
                                 data-on-load="pageRecList_load"  data-on-close="page${this.mod.c_modulename}Edit_onClose" data-icon="${btn.c_icon}" href="${btnUrl}"
                                onclick="${btnClick}" data-title="${btn.c_title}"  style="${btn.c_style}" >${btn.c_label}</a> `);
                }
            }
        }
        //如果和流程相关，则显示流程节点的按钮
        if(!think.isEmpty(this.proc)){
            //debug(this.proc,'page.htmlGetBtnList - this.proc');
            let actBtns = [];
            if(this.proc.c_type === cmpage.enumProcType.STATUSCHANGE){
                //直接取模板设置的按钮
                //debug(rec,'page.htmlGetBtnList - rec');
                if(rec.c_act > 0 ){
                    actBtns = await this.htmlGetActBtns(rec);
                }
            }else{
                //取当前任务节点的模板设置的按钮
                if(rec.c_task > 0 ){
                    actBtns = await this.htmlGetTaskActBtns(rec);
                }
            }
            for(let btn of actBtns){
                k +=1;
                if(k === this.mod.user.listBtns +1)  html.push(btnMore);
                html.push(btn);
            }
        }
        if(k >this.mod.user.listBtns){
            html.push('</ul></div>');
        }
        return html.join(' ');
    }

    /**
     * 取分页列表的设置，结合结果数据集，组合成HTML输出，一般不需要重新本方法
     * @method  htmlGetList
     * @return {string}  HTML片段
     */
    async htmlGetList() {
        let html = ['<thead> <tr >'];
        let isShowBtns = this.mod.c_modulename.indexOf('Lookup') >0;
        for (let btn of this.modBtns) {
            if (btn.c_location > 9) {
                isShowBtns = true;
                break;
            }
        }
        //debug(this.mod.user, 'page.htmlGetList - this.mod.user');
        if(think.isEmpty(this.mod.user.listColumns)){
            this.mod.user.listColumns = cmpage.ui.listColumns.MAX;
        }
        let k =0;
        for (let col of this.modCols) {
            if (col.c_isshow) {
                k += 1;
                if(k <= this.mod.user.listColumns) {
                    html.push(`<th width="${col.c_width}" style="text-align:center;">${col.c_name} </th>`);
                }
            }
        }
        if (this.mod.c_multiselect) {
            html.push('<th width="26"><input type="checkbox" class="checkboxCtrl" data-group="ids" data-toggle="icheck"></th>');
        }
        //if(this.mod.parmsUrl.readonly == 1) isShowBtns =false;
        if (isShowBtns) {
            html.push('<th width="100" style="text-align:center;">操作</th>');
        }
        html.push('</tr> </thead>');

        //数据列
        await this.getDataList();
        //    cmpage.debug(this.list.data);

        html.push('<tbody>');
        for (let item of this.list.data) {
            html.push(`<tr id="row${item[this.pk]}" data-id="${item[this.pk]}" onclick="return pageRowSelect(${item[this.pk]},this);" >`);
            k =0;
            for (let col of this.modCols) {
                if (col.c_isshow) {
                    k += 1;
                    if(k > this.mod.user.listColumns) {    break;             }
                        //                cmpage.debug(col);
                    html.push(`<td style="${item[this.pk] === 0 ? "font-weight:bold;" + col.c_style : col.c_style}" >`);
                    if (item[this.pk] !== 0 ) {
                        if (!think.isEmpty(col.c_format)) {
                            if (col.c_coltype === "float") {
                                html.push(cmpage.formatNumber(Number(item[col.c_column]), {pattern: col.c_format}));
                            } else if(col.c_coltype === "timestamp" || col.c_coltype === "date") {
                                if(!think.isEmpty(item[col.c_column]))  html.push(cmpage.datetime(item[col.c_column], col.c_format));
                            }
                        } else if (col.c_type === "checkbox") {
                            html.push(`<input type="checkbox"  data-toggle="icheck" value="1" disabled  ${item[col.c_column] || item[col.c_column]===1 ? "checked" : ""} />`);
                        } else if (!think.isEmpty(item[col.c_column]) && col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                            //类似： flow/act_assign:getLinkNameById:#c_type#
                            //debug(item,'page.htmlGetList - replace.item');
                            let templete = cmpage.objPropertysReplaceToStr(col.c_memo, item);
                            html.push(await this.getReplaceText(item[col.c_column],templete));
                        } else if (col.c_type === "html") {
                            let input = think.isEmpty(col.c_memo) ? item[col.c_column] : col.c_memo.replace(/#value#/ig,item[col.c_column]);
//                            debug(input,page.htmlGetList - input.html);
                            html.push(input);
                        } else {
                            if (!think.isEmpty(col.c_column)) {
                                html.push(item[col.c_column]);
                            }
                        }
                    }
                    html.push('</td>')
                }
            }
            if (this.mod.c_multiselect) {
                html.push(`<td><input type="checkbox" name="ids" data-toggle="icheck" value="${item[this.pk]}"></td>`);
            }
            if (isShowBtns) {
                html.push('<td >');
                let btnHtml =await this.htmlGetBtnList(item);
        //            cmpage.debug(btnHtml);
                html.push(btnHtml);
                html.push('</td >');
            }
            html.push('</tr >');
        }
        html.push(await this.htmlGetListSumRow(isShowBtns));  //合计
        html.push('</tbody >');

        return html.join(' ');
    }

    /**
     * 是否显示列表中某行的某个按钮，子类中重写本方法可以改变行按钮显示的逻辑
     * 按钮设置的备注中，形如： {isShow:'#c_status#==1192 && xxx>xxx'}
     * @method  isShowBtn
     * @return {boolean} 是否显示
     */
    isShowBtn(rec,btn){
        if(!think.isEmpty(btn.c_memo)) {
            let sets = cmpage.objFromString(cmpage.objPropertysReplaceToStr(btn.c_memo, rec));
            if (!think.isEmpty(sets.isShow) ) {
                cmpage.debug(sets, 'page.isShowBtn - sets');
                cmpage.debug(rec, 'page.isShowBtn - rec');
                return eval("(" + sets.isShow + ")");
            }
        }
//        if(btn.c_object.indexOf('.View') == -1 && this.mod.c_modulename.indexOf('Lookup') >0 )  return false;
        if(btn.c_object.indexOf('.View') == -1 && this.mod.parmsUrl.readonly == 1)  return false;
        return true;
    }

    /**
     * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
     * @method  getDataList
     * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
     */
    async getDataList(){
        if(this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE){
            this.mod.c_page_size = 8;
            this.mod.pageSize = 8;
        }
        let where=await this.getQueryWhere();
        //cmpage.debug(`select count(id) as count from ${this.mod.c_datasource} ${where} `);

        let cnt = await this.query(`select count(${this.pk}) as count from ${this.mod.c_datasource} ${where} `);
        //debug(cnt, 'page.getDataList - cnt');
        this.list.count = cnt[0].count;
        this.list.data = [];
        this.list.ids = [];
        if(this.list.count >0 ) {
            //cmpage.debug(this.mod);
            let data = [];
            if (this.mod.c_pager) {
                let sql = `select ${this.getListFields(this.modCols)} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by}
                    limit ${this.mod.c_page_size} offset ${this.mod.c_page_size * (this.mod.pageIndex - 1)}`;
                if(this.config.type == 'mssql'){
                    let sortType = this.mod.c_sort_by.toLowerCase().indexOf(' desc') == -1 ? 0 : 1;
                    let sortCol = this.mod.c_sort_by.toLowerCase().replace(/asc/g,'').replace(/desc/g,'');
                    sql = `QueryPage '${this.mod.c_datasource}','${this.getListFields(this.modCols)}',${this.mod.pageSize},${this.mod.pageIndex},
                        '${where}','${sortCol}',${sortType},'${this.pk}'`;
                }
                //debug(sql,'page.getDataList - sql');
                data = await this.query(sql);
            } else {
                let limit = think.isEmpty(this.mod.c_data_limit) ? 2000 : this.mod.c_data_limit;
                let sql = `select ${this.getListFields()} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by} limit ${limit}`;
                if(this.config.type == 'mssql'){
                    sql = `select top ${limit} ${this.getListFields()} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by} `;
                }
                data = await this.query(sql);
            }

            for (let rec of data) {
                if(data.indexOf(rec) == data.length -1 && this.config.type=='mssql' && this.mod.c_pager)    break;
                this.list.ids.push(rec[this.pk]);
                this.list.data.push(rec);
            }

        }
    }

    /**
     * 取合计行的HTML片段，子类中重写本方法可以定制合计行的显示
     * @method  isShowBtn
     * @return {string} 合计行的HTML片段
     */
    htmlGetListSumRow(isShowBtns){
        if(this.list.data.length <=0)   return '';
        let html = [];
        let isSum = false;
        for(let col of this.modCols){
            if(!col.c_isshow)   continue;
            if(col.c_type_sum == 'none'){
                html.push('<td> </td>');
            }else{
                isSum = true;
                if(col.c_type_sum == 'text'){
                    html.push(`<td style="text-align:center;font-weight:bold;">${col.c_memo}</td>`);
                    continue;
                }
                let sum = 0;
                for(let rec of this.list.data){
                    sum += Number(rec[col.c_column]);
                }
                if(col.c_type_sum == 'avg') sum = sum / this.list.data.length;
                debug(cmpage.formatNumber(sum,col.c_format),'page.htmlGetListSumRow - cmpage.formatNumber(sum,col.c_format)');
                html.push(`<td style="text-align:right;font-weight:bold;">${cmpage.formatNumber(sum,{pattern:col.c_format})}</td>`);
            }
        }
        if(isSum)   return `<tr>${html.join('')}${isShowBtns ? '<td> </td>':'' }</tr>`;
        return '';
    }

    /**
     * 取查询项的设置，结合POST参数，得到Where字句，重写本方法可以定制或修改SQL的where子句
     * @method  getQueryWhere
     * @return {string} where 子句， 形如： where xxx and xxx
     */
    async getQueryWhere(){
        let ret =[' where 1=1'];
        let parmsUrl =this.mod.parmsUrl;
        //debug(parmsUrl,'page.getQueryWhere - parmsUrl');
        for(let md of this.modQuerys){
            if (md.c_type === "fixed"){         //如果是‘固定’，则直接增加c_memo中的设置值
                let wh = ` (${md.c_memo.replace(/#userID#/,this.mod.user.id).replace(/#groupID#/,this.mod.user.groupID).split(/##/).join('\'')})`;
                if(wh.indexOf('#value#') > -1 ){
                    wh =think.isEmpty(parmsUrl[md.c_column]) ? '' : wh.replace(/#value#/,parmsUrl[md.c_column]);
                }
                //debug(parmsUrl,'page.getQueryWhere - parmsUrl');
                //debug(md.c_memo,'page.getQueryWhere - md.c_memo');
                if(!think.isEmpty(wh)){
                    ret.push(wh);
                }
                continue;
            }
            if (md.c_isshow && md.c_op!=='NO') {
                if(!think.isEmpty(this.mod.query[md.c_column])){
                    if((md.c_coltype === 'int' && parseInt(this.mod.query[md.c_column])===0) || (md.c_type.indexOf('select') === 0 && this.mod.query[md.c_column] == 0)){
                        continue;
                    }
                    //debug(md,'page.getQueryWhere - md');
                    //debug(this.mod.query,'page.getQueryWhere - this.mod.query');
                    md.c_default = this.mod.query[md.c_column];
                    let value = this.mod.query[md.c_column].split('\'').join(' ').split('\"').join(' ').trim();
                    value = cmpage.filterSensitiveString(value);
                    if(md.c_coltype =="bool")   value = think.isEmpty(value) ? 0:1;
                    if((md.c_column ==='c_province' || md.c_column ==='c_city' || md.c_column ==='c_country')
                        && (value ==='-1' || value === '')){    continue;   }
                    ret.push(md.c_desc + ' '+this.getOpValue(md.c_op, value, md.c_coltype));
                }
            }
        }
        return ret.join(' and ');
    }


  getOpValue(op,value,coltype){
  let ops = [ {op:"EQ",val:"= #value#"},{op:"NE",val:"<> #value#"},{op:"CN",val:"like #value#"},{op:"NC",val:"not like #value#"},{op:"IN",val:"in (#value#)"},
    {op:"NI",val:"not in (#value#)"},{op:"GE",val:">= #value#"},{op:"LE",val:"<= #value#"},{op:"GT",val:"> #value#"},{op:"LT",val:"< #value#"}];
  let val = value;

  if (coltype === "varchar" || coltype === "date" || coltype === "timestamp"){
    if (op === "CN" || op === "NC"){
      val = `'%${val}%'`;
    }else if (op === "IN" || op === "NI"){//每项分别加单引号
      let str = val.Split(',');
      let sArr=[];
      for (let s of str){
        sArr.push(`'${s}'`);
      }
      val = sArr.join(',');
    }else{
      val = `'${val}'`;
    }
  }
  for (let operate of ops){
    if (operate.op === op){
      return operate.val.replace(/#value#/,val);
    }
  }
  return "";
}

    /**
     * 根据设置取得页面显示列表返回的字段，一般不需要重写本方法
     * @method  getListFields
     * @return {string} fields 部分， 形如：id,c_name,xxx
     */
    getListFields(){
    let fields = [];
    for(let col of this.modCols){
      if (!col.c_isretrieve) continue;
      //if(col.c_column ==='c_user'){  console.log(col);}
      if (col.c_type === "replace" && (col.c_isshow || col.c_isview) && (col.c_memo.indexOf('select')===0)) //以select开头
      {
        fields.push(`(${col.c_memo}) as ${col.c_column}`);
      }else{
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
    async pageEditInit(){
        let md ={};
        md.c_user = this.mod.user.id;
        md.c_group = this.mod.user.groupID;
        for(let edit of this.modEdits){
            let key = edit.c_column.trim();
            if(['c_user','c_group'].includes(key)){ continue; }
            //URL参数赋值
            if(!think.isEmpty(this.mod.parmsUrl[key])){
                md[key] = this.mod.parmsUrl[key];
                continue;
            }

            if(edit.c_coltype === 'int' || edit.c_coltype === 'float') {
                md[key] = 0;
            }else if(edit.c_coltype === 'bool'){
                md[key] = false;
            }else if(edit.c_coltype === 'timestamp' ){
                md[key] = think.datetime();
            }else if(edit.c_coltype === 'date'){
                md[key] = think.datetime(new Date, "YYYY-MM-DD");
            }else {
                md[key] = '';
            }
        }
        //如果有关联流程，则设置初始的 c_act, c_status
        if(!think.isEmpty(this.proc) && this.proc.c_act_start >0){
            debug(this.proc,'page.htmlGetBtnList - this.proc');
            md.c_act = this.proc.c_act_start;
            let actStart = await cmpage.model('flow/act').getActById(this.proc.c_act_start);
            md.c_status = actStart.c_domain_st;
        }

        md[this.pk] =0;
        return md
    }

    /**
     * 取当前记录对象，用于新增和修改的编辑页面展示
     * @method  getDataRecord
     * @return {object} 当前记录对象
     */
    async getDataRecord(){
        let md = {};
        if(this.mod.editID >0) {
            let fields = [];
            for (let edit of this.modEdits) {
                if(edit.c_desc.indexOf('fn:')!==0){
                    fields.push(edit.c_desc == edit.c_column ? edit.c_desc : `${edit.c_desc} as ${edit.c_column}`);
                }
            }
            let list = await this.model(this.mod.c_datasource).field(fields.join(',')).where(`${this.pk}=${this.mod.editID}`).select();
            md =list[0];
            // for(let p in md){   //去掉 null 值
            //     if(md[p] == 'null') md[p] = '';
            // }
        }else{
            md = await this.pageEditInit();
        }
        //console.log(md);
        //对记录进行处理
        for (let edit of this.modEdits) {
            if(edit.c_coltype ==='bool'){
                md[edit.c_column] = think.isBoolean(md[edit.c_column]) ? md[edit.c_column] : (md[edit.c_column] === 1);
            }
        }
        this.rec = md;
        return md;
    }
    /**
     * 取编辑页面的设置，组合成列表数据的HTML输出
     * @method  htmlGetEdit
     * @return {string} HTML页面片段
     */
    async htmlGetEdit() {
        let html = [];
        let md = await this.getDataRecord();
        //debug(md,'page.htmlGetEdit - md');
        if(think.isEmpty(md))   return '';
        //子类中可以重写此处之前涉及的方法来改变URL参数值等，例如 getDataRecord， 参见 docu/docu_list
        if(this.mod.parmsUrl.readonly){
            this.modCols = await cmpage.model('cmpage/module').getModuleCol(this.mod.id);
            //debug(this.mod,'page.htmlGetEdit - this.mod');
            return `<table id="pageViewData" class="table table-condensed table-hover" width="100%"><tbody>${await this.htmlGetView()}</tbody> </table> `;
        }
        //html.push(`<div id="edit${this.mod.c_modulename}Table" class="bjui-row col-${this.mod.c_edit_column}">`);
        this.mod.editHeaderHtml = think.isEmpty(this.mod.c_other.editTitle) ? '' : `<div class="bjui-pageHeader">
                <label data-height="30px" style="margin: 5px;">${this.mod.c_other.editTitle}</label></div>`;

        html.push(`<input name='old_record' type='hidden' value='${JSON.stringify(md).replace(/\'/g,'')}' />`);
//        cmpage.debug(md);

         //debug(this.modEdits,'page.htmlGetEdit - modEdits')
        for(let col of this.modEdits){
            if (!col.c_editable || col.c_column === this.pk ) {  continue; }
            let colValue = md[col.c_column];            
            if(col.c_desc.indexOf('fn:')===0){    //非数据库字段
                let its = col.c_desc.trim().split(':');        //设置如： fn:admin/code:getNameByPid:c_status
                let fnModel = cmpage.model(its[1]);     //通过某个模块的某个方法取下拉设置
                if(think.isFunction(fnModel[its[2]])){
                    if(its.length === 4){
                        colValue = await fnModel[ its[2] ]( md[its[3]]);
                    }else{
                        colValue = await fnModel[ its[2] ]();
                    }
                }
                debug(colValue,'page.htmlGetEdit.fn - colValue');
            }

            if(col.c_coltype === 'timestamp'){  colValue = think.datetime(colValue); }
            if (col.c_type === "hidden" && col.c_column!=="c_city" && col.c_column!=="c_province") {
                html.push(`<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="hidden" value="${colValue}" />`);
                continue;
            }
            col.c_format = col.c_format.trim();
            col.c_width = this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE ? 20 : col.c_width;
            if(col.c_type !== "hidden"){
                html.push(` <label  class="row-label" >${col.c_name}: </label>`);
            }
            let input ='';
            if (col.c_type === "datetime" ||col.c_type === "date") {
                input += `<input type="text" id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" value="${ cmpage.datetime(colValue,think.isEmpty(col.c_format) ? 'yyyy-MM-dd':col.c_format)}"
                    ${col.c_type === "readonly" ? "disabled":""} data-toggle="datepicker" data-pattern="${think.isEmpty(col.c_format) ? 'yyyy-MM-dd':col.c_format}"  size="15" />`;
            } else if (col.c_type === "select" || col.c_type === "selectBlank" ) {
                input += `<select id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" data-toggle="selectpicker" ${col.c_isrequired ? "data-rule=required" : ""}>`;
                col.c_default = colValue;
                input += await this.getOptions(col,false);
                input += '</select>';
            } else if (col.c_type === "selectTree" || col.c_type === "selectTreeMultiple") {
                col.c_default = colValue;
                let treeOptions = await this.getOptionsTree(col,false);
                input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}"  type="hidden" value="${colValue}" />
                    <input name="${col.c_column}Show" type="text" size="25" value="${treeOptions.selectName}" data-toggle="selectztree" data-tree="#selectTree${this.mod.c_modulename + col.c_column}"   readonly />
                    <ul id="selectTree${this.mod.c_modulename + col.c_column}" class="ztree hide" data-toggle="ztree" data-expand-all="false" data-check-enable="true"
                    data-value-input="${this.mod.c_modulename + col.c_column}" ${(col.c_type === "selectTree" ? ' data-chk-style="radio" data-radio-type="all" ':' ')}
                    data-on-check="selectNodeCheck" data-on-click="selectNodeClick" > ${treeOptions.options} </ul>`;
            } else if (col.c_type === "textarea") {
                let options = cmpage.objFromString(col.c_memo);
                input += `<textarea id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" data-toggle="autoheight" cols="${col.c_width}"
                    rows="${options.row || 1}"  ${col.c_isrequired ? "data-rule=required" : ""}>${colValue}</textarea>`;
            } else if (col.c_type === "lookup") {
                input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="lookup" size="10" value="${colValue}"
                    data-width="800" data-height="600" data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${this.getReplaceToSpecialChar(col.c_memo)}" readonly="readonly" />
                      <!--<a class="bjui-lookup" href="javascript:;" ><i class="fa fa-search"></i></a>--> `;
            } else if (col.c_type === "fileUpload") {
                let options = {       pick: {label: '点击选择文件'},
                                      server: '/cmpage/page/upload_file',
                                      fileNumLimit: 1,
                                      fileSingleSizeLimit: 1024*1024*5,
                                      formData: {link_type:this.mod.c_table,inputName:col.c_column},
                                      required: col.c_isrequired,
                                      uploaded: '',
                                      basePath: '',
                                      accept: {
                                          title: '文件',
                                          extensions: this.mod.parmsUrl.c_type==0 ? '*': 'jpg,png,jpeg,gif,bmp',
                                          mimeTypes: this.mod.parmsUrl.c_type==0 ? '.*': '.jpg,.png,.jpeg,.gif,.bmp'
                                      }
                                };
              input += `<input type="file" name="${col.c_column}" data-name="${col.c_column}" data-toggle="webuploader" data-options="${cmpage.objToString(options)}" >`;
            }else if (col.c_type == "areaSelect"){
                input += `<select name="c_province" data-toggle="selectpicker"  data-nextselect="#city${this.mod.c_modulename}" data-refurl="/cmpage/utils/get_citys?province={value}" >`;
                input += await cmpage.model('admin/area').getProvinceItems(md['c_province'],true);
                if(col.c_column ==='c_country'){
                    input += `</select> <select name="c_city" id="city${this.mod.c_modulename}" data-toggle="selectpicker" data-nextselect="#country${this.mod.c_modulename}"
                        data-refurl="/cmpage/utils/get_countrys?city={value}" >`;
                    input += await cmpage.model('admin/area').getCityItems(md['c_city'],true);
                    input += `</select> <select name="c_country" id="country${this.mod.c_modulename}" data-toggle="selectpicker" data-rule="required" >`;
                    input += await cmpage.model('admin/area').getCountryItems(md['c_country'],true);
                }else if(col.c_column === 'c_city'){
                    input += `</select> <select name="c_city" id="city${this.mod.c_modulename}" data-toggle="selectpicker" data-nextselect="#country${this.mod.c_modulename}" >`;
                    input += await cmpage.model('admin/area').getCityItems(md['c_city'],true);
                }
                input += '</select>';
            } else if(col.c_type === "kindeditor"){
                input += `<div style="display: inline-block; vertical-align: middle;"> <textarea name="${col.c_column}" style="width: 960px;height:640px;"
                        data-toggle="kindeditor" data-minheight="460"> ${colValue}  </textarea> </div>`;
            } else if (col.c_type == "checkbox") {
                input += `<input id="${this.mod.c_modulename + col.c_column}" type="checkbox" name="${col.c_column}" data-toggle="icheck" value="1" data-label="${col.c_memo}"
                    ${colValue == "1" ? "checked" : ""} />`;
            // }else if (col.c_type === "readonly") {
            //     input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="text" size="${col.c_width}" value="${colValue}"  readonly="readonly"  />`; // style=background-color:#fde5d4;
            } else if (col.c_type == "number") {
                input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="text" size="${col.c_width}" value="${colValue}" onkeyup="return testNum(this);" />`;
            }else if (col.c_type === "readonly") {      //readonly 和 readonlyReplace 类型合并
                //debug(col,'page.htmlGetEdit - col readonlyReplace');
//                debug(md,'this.mod.getHtmlEdit --- md readonlyReplace');
                if(think.isEmpty(col.c_memo)){
                    input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="text" size="${col.c_width}" value="${colValue}"  readonly="readonly"  />`; // style=background-color:#fde5d4
                }else{
                    let txt = await this.getReplaceText(colValue, col.c_memo);
                    //debug(txt+' - value:'+colValue,'page.htmlGetEdit - txt,colValue readonlyReplace');
                    input += `<input name="${col.c_column}" type="hidden"  value="${colValue}"  readonly="readonly"  />`;
                    input += `<input name="${col.c_column}_text" type="text" size="${col.c_width}" value="${txt}"  readonly="readonly"  />`; // style=background-color:#fde5d4;
                }
            }else if(col.c_column !=='c_province' && col.c_column !=='c_city'){
                input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="${col.c_type}" size="${col.c_width}" value="${colValue}"
                    ${col.c_isrequired ? "data-rule=required;" + col.c_memo : (think.isEmpty(col.c_memo) ? "" : "data-rule=" + col.c_memo)} />`;
            }
            if (col.c_type !== "areaSelect"){
                input += col.c_suffix;
            }
            if(input.length >0){
                input = await this.htmlGetEditInput(col,colValue,input);
                html.push(input);
                //debug(input,'page.htmlGetEdit - input-'+col.c_column)
            }
        }
        let ret = `<div id="edit${this.mod.c_modulename}Table" class="bjui-row col-${this.mod.c_edit_column}">${html.join('')}</div>`;
        //debug(ret,'page.htmlGetEdit - ret');
        return ret;
    }

    /**
     * 改变某些编辑列的样式，子类中可以重写本方法类增加模块编辑页面的操作逻辑
     * @method  htmlGetEditInput
     * @return {string} Edit页面的Input的HTML片段
     * @params {object} col Edit页面的当前编辑列设置
     * @params {string} colValue Input的值
     * @params {string} input Edit页面的Input的HTML片段
     */
    async htmlGetEditInput(col,colValue,input) {
        let html = `<div id="field${this.mod.c_modulename + col.c_column}"  class="row-input">${input}</div>`;
        //增加模块编辑页面的操作逻辑，也可以配合页面js方法

        return html;
    }

    /**
     * 取编辑页面的按钮设置，组合按钮的HTML输出
     * @method  htmlGetEditBtns
     * @return {string} HTML页面片段
     */
    async htmlGetEditBtns() {
        //cmpage.debug(this.mod,'page.htmlGetEditBtns -- this.mod')
        let html = [];
        let parmsUrl = this.mod.parmsUrl;

        if(think.isEmpty(this.mod.c_other.editHideCloseBtn)){
            html.push('<li><button type="button" class="btn-close" data-icon="close">关闭</button></li>');
        }
        //debug(task,'page.htmlGetEditBtns - task');
        let defaultSaveBtn = '<li ><button type="submit" class="btn-green"  data-icon="save">保存</button></li>';
        if(!think.isEmpty(this.mod.c_module_slave.modulename)){
            let reloadUrl = `/cmpage/page/edit_ms?modulename=${this.mod.c_modulename}&listIds=`;
            for(let p in this.mod.parmsUrl){
                //加入URL参数
                if(!['modulename',this.pk,'listIds','_'].includes(p)){
                    reloadUrl += `&${p}=${this.mod.parmsUrl[p]}`;
                }
            }
            defaultSaveBtn = `<li ><button type="button" class="btn-green" onclick="return pageSaveMs('${this.mod.c_modulename}','${reloadUrl}',
                ${this.mod.editID},'${this.pk}');"  data-icon="save">保存</button></li>`;
        }
        //debug(defaultSaveBtn,'page.htmlGetEditBtns - defaultSaveBtn');
        if(think.isEmpty(this.mod.c_other.editHideSaveBtn) && !this.mod.parmsUrl.readonly && !this.rec.hasOwnProperty('c_task') ) {
            html.push(defaultSaveBtn);
        }
        debug(this.rec,'page.htmlGetEditBtns - this.rec');
        if(!think.isEmpty(this.rec['c_task']) && this.rec.c_task >0){
            let task =  await cmpage.model('flow/task').getTask(this.rec.c_task > 0 ? this.rec.c_task: parmsUrl.taskID);
            //debug(task,'page.htmlGetEditBtns - task');
            if(task.c_link_type === this.mod.c_table){
                if(think.isEmpty(parmsUrl.taskActID)){
                    html.push(defaultSaveBtn);
                }else{
                    let reloadUrl = `/cmpage/page/edit?modulename=${this.mod.c_modulename}&taskActID=${parmsUrl.taskActID}&status=${parmsUrl.status}&listIds=`;
                    html.push(`<button type="button" class="btn-green"  data-icon="save"
                            onclick="return pageSaveByTask('${this.mod.c_modulename}','${reloadUrl}',
                            '${think.isEmpty(this.mod.c_other.editSaveAfter) ? '' : this.mod.c_other.editSaveAfter}');">
                            ${think.isEmpty(this.mod.c_other.editSaveLabel) ? '保存' : this.mod.c_other.editSaveLabel}</button>`);
                    // html.push(`<button type="button" class="btn-green"  data-icon="save"
                    //         onclick="return pageSaveByTask('${this.mod.c_modulename}',${parmsUrl.taskActID},${parmsUrl.status},
                    //         '${think.isEmpty(this.mod.c_other.editSaveAfter) ? '' : this.mod.c_other.editSaveAfter}');">
                    //         ${think.isEmpty(this.mod.c_other.editSaveLabel) ? '保存' : this.mod.c_other.editSaveLabel}</button>`);
                }
            }
        }

        if(this.mod.editID >0 && think.isEmpty(this.mod.c_module_slave.modulename)) {
            let listIds = parmsUrl.listIds.split(',');
            if (listIds.length > 0) {
                let prevID = 0, nextID = 0;
                let k = 0;
                for (let id of listIds) {
                    if (id == this.mod.editID) {
                        k = listIds.indexOf(id);
                        break;
                    }
                }
                if (k > 0) {
                    prevID = listIds[k - 1];
                }
                if (k < listIds.length - 1) {
                    nextID = listIds[k + 1];
                }
                html.push(`<li class="left" style="margin-left: -40px;"><button type="button" class="btn-default" ${k == 0 ? 'style="display:none"' : ''} data-icon="arrow-left"
                        onclick="return pageGotoEdit('${this.mod.c_modulename}',${prevID});">上一条</button></li>`);
                html.push(`<li class="left" ><button type="button" class="btn-default" ${nextID == 0 ? 'style="display:none"' : ''} data-icon="arrow-right"
                        onclick="return pageGotoEdit('${this.mod.c_modulename}',${nextID});">下一条</button></li>`);
            }
        }
        //如果和流程相关，则显示流程节点的按钮
        if(!think.isEmpty(this.proc)){
            //debug(this.proc,'page.htmlGetBtnList - this.proc');
            let actBtns = [];
            if(this.proc.c_type === cmpage.enumProcType.STATUSCHANGE){
                //直接取模板设置的按钮
                if(this.rec.c_act > 0 ){
                    actBtns = await this.htmlGetActBtns(this.rec);
                }
            }else{
                //取当前任务节点的模板设置的按钮
                if(this.rec.c_task > 0 ){
                    actBtns = await this.htmlGetTaskActBtns(this.rec);
                }
            }
            for(let btn of actBtns){
                btn = `<li class="left" >${btn}</li>`;
            }
            if(!think.isEmpty(actBtns))  html.push(actBtns.join(''));
        }

        return html.join('');
    }
    /**
    * 取状态流转类型的流程节点相关的按钮设置，组合成按钮的HTML输出</br>
    * 考虑到按钮输出和业务关联度大，定义在此处
     * @method  htmlGetActBtns
     * @return {Array} 按钮数组
     */
    async htmlGetActBtns(rec) {
        let html = [];
        //debug(rec,'page.htmlGetActBtns - rec');
        let actModel = cmpage.model('flow/act');
        let act = await actModel.getActById(rec.c_act);
        if(think.isEmpty(act)){    return []; }

        //debug(act,'page.htmlGetActBtns - act');

        let form = think.isEmpty(act.c_form) ? {} : cmpage.objFromString(act.c_form);
        //debug(form,'page.htmlGetActBtns - form');

        let createUserID = think.isEmpty(rec.c_creater) ? (rec.c_user || 0) : rec.c_creater;
        let prevUserID = think.isEmpty(rec.c_appr_people) ? (rec.c_user || 0) : rec.c_appr_people;
        //debug(prevUserID,'page.htmlGetActBtns - prevUserID');
        //如果主业务模块实现类已经定义了 getStatusById方法，则调用，否则，直接从数据库中取业务记录状态
        //如果主业务模块操作的数据表位于和框架不同的数据库，则需要定义 getStatusById 方法
        //debug(this.proc,'page.htmlGetActBtns - this.proc');
        let linkRec ={};
        linkRec.id = think.isEmpty(this.mod.parmsUrl.linkID) ? rec[this.pk] : this.mod.parmsUrl.linkID;
        let linkModel = cmpage.model(this.proc.c_link_model);
        linkModel.mod = await cmpage.model('cmpage/module').getModuleByName(this.proc.linkModulename);
        await linkModel.initPage();
        if(think.isEmpty(linkModel['getStatusById'])){
            linkRec = await linkModel.model(this.proc.c_link_type).where(`${linkModel.pk}=${linkRec.id}`).find();
        }else{
            linkRec = await linkModel.getStatusById(linkRec.id);
        }
        linkRec.id = think.isEmpty(this.mod.parmsUrl.linkID) ? rec[this.pk] : this.mod.parmsUrl.linkID;
        debug(linkRec,'page.htmlGetActBtns - linkRec');
        debug(act,'page.htmlGetTaskActBtns - act');

        //debug(task,'page.htmlGetTaskActBtns - task');
        if(act.id >0){
            //debug(form,'page.htmlGetActBtns - form');
            //if(form.hasOwnProperty('modulename') && form['modulename'] == this.mod.c_modulename ){
            if(linkRec.c_status != act.c_domain_st){
                //debug(linkRec,'page.htmlGetActBtns - linkRec');
                //验证当前用户是否有该节点的权限
                if(this.mod.c_modulename!='Appr' && think.isEmpty(this.mod.parmsUrl.linkModulename)){
                    let actAssign = await cmpage.model('flow/act_assign').getAssignByUser(act.id,this.mod.user, createUserID, prevUserID);
                    debug(actAssign,'page.htmlGetActBtns - actAssign');
                    if(think.isEmpty(actAssign))   return [];
                }

                //本表单是流程节点需要打开的表单
                let btns = cmpage.arrFromString(act.c_form_btn);
                for(let btn of btns){
                    btn.label = think.isEmpty(btn['label']) ? act.c_name : btn.label;
                    btn.class = think.isEmpty(btn['class']) ? 'btn-green' : btn.class;
                    btn.icon = think.isEmpty(btn['icon']) ? 'cogs' : btn.icon;
                    if(!think.isEmpty(btn['onclick'])){
                        btn.onclick = btn.onclick.replace(/#procID#/g,this.proc.id).replace(/#actID#/g,act.id);
                        html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}" onclick="${btn.onclick}">${btn.label}</button>`);
                    }
                    else if(!think.isEmpty(btn['url'])){
                        btn.title = think.isEmpty(btn['title']) ? btn.label : btn.title;
                        btn.opentype = think.isEmpty(btn['opentype']) ? 'dialog' : btn.opentype;
                        btn.url = btn.url.replace(/#procID#/g,this.proc.id).replace(/#actID#/g,act.id);
                        html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="${btn.opentype}"
                            data-options="{id:'flowDialog', url:'${btn.url}', title:'${btn.title}'}">${btn.label}</button>`);
                    }else {
                        html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="doajax"
                            data-options="{url:'/cmpage/page/update_status?modulename=${this.mod.c_modulename}&id=${rec[this.pk]}&actID=${act.id}&status=${act.c_domain_st}',
                            confirmMsg:'是否确定要${btn.label}？'}">${btn.label}</button>`);
                    }
                }
                // debug(linkRec,'page.htmlGetActBtns - linkRec');
                // debug(this.mod,'page.htmlGetActBtns - this.mod');
                // debug(this.proc,'page.htmlGetActBtns - this.proc');
                if (linkRec.id >0 && this.proc.c_link_type != this.mod.c_table) {
                    if(linkRec.c_status == act.c_domain_st) {
                        html.push('<label style="color: red;">本操作已经执行完毕！</label>');
                    }else{
                        //默认的保存或者审核通过按钮
                        let reloadUrl = `/cmpage/page/${think.isEmpty(this.mod.c_module_slave.modulename) ? 'edit':'edit_ms'}?modulename=${this.mod.c_modulename}&procID=${
                            this.proc.id}&actID=${act.id}&status=${act.c_domain_st}&linkID=${linkRec.id}&linkType=${this.proc.c_link_type}&linkModel=${this.proc.c_link_model}&listIds=`;
                        debug(reloadUrl,'page.htmlGetActBtns - reloadUrl');
                        html.push(`<button type="button" class="btn-green"  data-icon="save"
                            onclick="return pageSaveByAct('${this.mod.c_modulename}','${reloadUrl}',
                            '${think.isEmpty(this.mod.c_other.editSaveAfter) ? '' : this.mod.c_other.editSaveAfter}','${this.proc.c_link_model}');">
                            ${think.isEmpty(this.mod.c_other.editSaveLabel) ? '保存' : this.mod.c_other.editSaveLabel}</button>`);
                    }
                }
            }else if(this.proc.c_link_type == this.mod.c_table){
                //本表单是流程的关联主表单，则显示本流程节点的调用按钮
                //找到当前节点去向节点，并显示调用该节点的按钮，可能有多个去向
                let toActs = await cmpage.model('flow/act').getToActsFromId(this.proc.id, act.id);
                debug(toActs,'page.htmlGetActBtns - toActs');
                for(let toAct of toActs){
                    //验证当前用户是否有该节点的权限
                    let actAssign = await cmpage.model('flow/act_assign').getAssignByUser(toAct.id,this.mod.user, createUserID,prevUserID);
                    //debug(actAssign,'page.htmlGetActBtns - actAssign');
                    if(think.isEmpty(actAssign))   continue;

                    let btn = think.isEmpty(toAct.c_call_btn) ? {}:eval(`(${toAct.c_call_btn})`);
                    btn.label = think.isEmpty(btn['label']) ? toAct.c_name : btn.label;
                    btn.class = think.isEmpty(btn['class']) ? 'btn-green' : btn.class;
                    btn.icon = think.isEmpty(btn['icon']) ? 'cogs' : btn.icon;
                    let form = think.isEmpty(toAct.c_form) ? {} : eval("("+ toAct.c_form +")");
                    form.title = think.isEmpty(btn['title']) ? btn.label : btn.title;
                    form.opentype = think.isEmpty(btn['opentype']) ? 'dialog' : btn.opentype;
                    if(think.isEmpty(toAct.c_form)){
                        //默认是业务主模块，则修改本身状态
                        html.push(` <button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="doajax"
                            data-options="{url:'/cmpage/page/update_status?modulename=${this.mod.c_modulename}&id=${rec[this.pk]}&actID=${toAct.id}&status=${toAct.c_domain_st}',
                            confirmMsg:'是否确定要${btn.label}？'}">${btn.label}</button>`);
                    }else{
                        if(!think.isEmpty(form['modulename'])){
                            //如果被调用节点对应 form.modulename 也是业务主模块，则修改本身状态
                            if(form.modulename === this.mod.c_modulename){
                                html.push(` <button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="doajax"
                                    data-options="{url:'/cmpage/page/update_status?modulename=${this.mod.c_modulename}&id=${rec[this.pk]}&actID=${toAct.id}&status=${toAct.c_domain_st}',
                                    confirmMsg:'是否确定要${btn.label}？'}">${btn.label}</button>`);
                                continue;
                            }else{
                                form.url = `/cmpage/page/edit?modulename=${form['modulename']}&id=0&procID=${toAct.c_proc}&actID=${toAct.id}&status=${toAct.c_domain_st}&linkID=${rec[this.pk]}&linkType=${this.mod.c_table}&linkModulename=${this.mod.c_modulename}`;
                            }
                        }
                        form.url = form.url.replace(/#actID#/g,toAct.id);
                        html.push(` <button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="${form.opentype}"
                                data-options="{id:'flowDialog', url:'${form.url}', title:'${form.title}', mask:true}">${btn.label}</button>`)
                    }
                }
            }
        }

        return html;
    }

    /**
     * 取流程节点相关的按钮设置，组合按钮的HTML输出</br>
     * 考虑到按钮输出和业务关联度大，定义在此处
     * @method  htmlGetTaskActBtns
     * @return {Array} 按钮数组
     */
    async htmlGetTaskActBtns(rec) {
        let html = [];
        //debug(rec,'page.htmlGetTaskActBtns - rec');
        let task = await cmpage.model('flow/task').getTask(rec.c_task);
        if(think.isEmpty(task)){    return []; }

        let parmsUrl = this.mod.parmsUrl;
        //取流程的当前节点，然后取按钮设置
        let act ={},taskAct={};
        if(think.isEmpty(parmsUrl['taskActID'])){
            let taskModel = cmpage.model('flow/task');
            act =await taskModel.getTaskWithCurrentAct(task);
            taskAct = taskModel.currTaskAct;
        }else{
            taskAct = await cmpage.model('flow/task_act').getTaskAct(parmsUrl['taskActID']);
            act = await cmpage.model('flow/act').getActById(taskAct.c_act);
        }
        //debug(task,'page.htmlGetTaskActBtns - task');
        //debug(act,'page.htmlGetTaskActBtns - act');
        if(act.id >0){
            //验证当前用户是否有该节点的权限
            let actAssign = await cmpage.model('flow/act_assign').getAssignByUser(act.id,this.mod.user, task.c_creater);
            debug(actAssign,'page.htmlGetTaskActBtns - actAssign');
            if(think.isEmpty(actAssign))   return [];

            let form = think.isEmpty(act.c_form) ? {} : cmpage.objFromString(act.c_form);
            debug(form,'page.htmlGetTaskActBtns - form');
            if(form.hasOwnProperty('modulename') && form['modulename'] === this.mod.c_modulename ){
                //本表单是流程节点需要打开的表单
                let btns = cmpage.arrFromString(act.c_form_btn);
                for(let btn of btns){
                    btn.label = think.isEmpty(btn['label']) ? act.c_name : btn.label;
                    btn.class = think.isEmpty(btn['class']) ? 'btn-green' : btn.class;
                    btn.icon = think.isEmpty(btn['icon']) ? 'cogs' : btn.icon;
                    if(!think.isEmpty(btn['onclick'])){
                        btn.onclick = btn.onclick.replace(/#taskID#/g,task.id).replace(/#taskActID#/g,taskAct.id);;
                        html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}" onclick="${btn.onclick}">${btn.label}</button>`)
                    }
                    else if(!think.isEmpty(btn['url'])){
                        btn.title = think.isEmpty(btn['title']) ? btn.label : btn.title;
                        btn.opentype = think.isEmpty(btn['opentype']) ? 'dialog' : btn.opentype;
                        btn.url = btn.url.replace(/#taskID#/g,task.id).replace(/#taskActID#/g,taskAct.id);
                        html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="${btn.opentype}"
                        data-options="{id:'flowDialog', url:'${btn.url}', title:'${btn.title}'}">${btn.label}</button>`)
                    }else {
                        html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}"
                            onclick="return fwRunAct(${taskAct.id},true,'${this.mod.c_modulename}');">${btn.label}</button>`)
                    }
                }
                if (task.c_link_type !== this.mod.c_table) {
                    debug(taskAct,'page.htmlGetActBtns - taskAct');
                    if(taskAct.c_status === cmpage.enumTaskActStatus.WAIT) {
                        //默认的保存或者审核通过按钮
                        let reloadUrl = `/cmpage/page/edit?modulename=${this.mod.c_modulename}&taskActID=${parmsUrl.taskActID}&status=${parmsUrl.status}&listIds=`;
                        html.push(`<button type="button" class="btn-green"  data-icon="save"
                                onclick="return pageSaveByTask('${this.mod.c_modulename}','${reloadUrl}',
                                '${think.isEmpty(this.mod.c_other.editSaveAfter) ? '' : this.mod.c_other.editSaveAfter}');">
                                ${think.isEmpty(this.mod.c_other.editSaveLabel) ? '保存' : this.mod.c_other.editSaveLabel}</button>`);
                    }else{
                        html.push('<label style="color: red;">本操作已经执行完毕！</label>')
                    }
                }
            }else if(task.c_link_type === this.mod.c_table){
                //本表单是流程的关联主表单，则显示本流程节点的调用按钮
                let btn = think.isEmpty(act.c_call_btn) ? {}:eval(`(${act.c_call_btn})`);
                btn.label = think.isEmpty(btn['label']) ? act.c_name : btn.label;
                btn.class = think.isEmpty(btn['class']) ? 'btn-green' : btn.class;
                btn.icon = think.isEmpty(btn['icon']) ? 'cogs' : btn.icon;
                let form =eval("("+ act.c_form +")");
                form.title = think.isEmpty(btn['title']) ? btn.label : btn.title;
                form.opentype = think.isEmpty(btn['opentype']) ? 'dialog' : btn.opentype;
                if(!think.isEmpty(form['modulename'])){
                    form.url = `/cmpage/page/edit?modulename=${form['modulename']}&id=0&taskID=${task.id}&taskActID=${taskAct.id}&status=${act.c_domain_st}`;
                }
                form.url = form.url.replace(/#taskID#/g,task.id).replace(/#taskActID#/g,taskAct.id);
                html.push(`<button type="button" class="${btn.class}" data-icon="${btn.icon}" data-toggle="${form.opentype}"
                        data-options="{id:'flowDialog', url:'${form.url}', title:'${form.title}', mask:true}">${btn.label}</button>`)
            }
            //增加可终止或者可挂起按钮
            if(taskAct.c_status == cmpage.enumTaskActStatus.WAIT){
                if(act.c_can_terminate){
                    html.push(`<button type="button" class="btn-red" data-icon="stop" onclick="return fwTerminate(${taskAct.c_task},'${this.mod.c_modulename}');">终止</button>`)
                }
                if(act.c_can_suspend){
                    html.push(`<button type="button" class="btn-orange" data-icon="pause" onclick="return fwSuspend(${taskAct.id},'${this.mod.c_modulename}');">挂起</button>`)
                }
            }

        }

        return html;
    }


    /**
     * 编辑页面保存,<br/>
     * 如果是多个表的数据产生的编辑页，则根据存在于this.mod.c_table中的列更新表，一般需要在子类中继承，例如： admin/user:pageSave
     * @method  pageSave
     * @return {object} 如果有验证错误，则返回格式： {statusCode:300, message:'xxxxxx'}
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms){
        debug(parms,'page.pageSave - parms - 递交的内容');
        //debug(this.mod,'page.pageSave - this.mod');
        //debug(this.pk,'page.pageSave - this.pk');
        //cmpage.debug(this.modEdits,'this.mod.pageSave - this.modEdits')
        this.rec = {};
        for(let edit of this.modEdits){
            if(edit.c_editable && edit.c_column.indexOf('c_')===0 ) {      //&& this.isExistColumn(edit.c_column,colList)
                this.rec[edit.c_column] = parms[edit.c_column];
            }
        }
        //cmpage.debug(this.rec,'page.pageSave - 保存内容');
        if(this.mod.editID == 0){
            //let id = await this.query(cmpage.getInsertSql(md,this.mod.c_table) +' returning id;');
            this.rec[this.pk] = await this.model(this.mod.c_table).add(this.rec);
            await this.pageSaveLog(parms,'add');
        }else {
            await this.model(this.mod.c_table).where(`${this.pk}=${this.mod.editID}`).update(this.rec);
            this.rec[this.pk] = this.mod.editID;
            await this.pageSaveLog(parms,'update');
        }
        return {statusCode:200, message:'保存成功！'};
    }

    /**
     * 保存后的操作日志记录,，通过重写可在子类中定制日志的格式
     * @method  pageSaveLog
     * @return {无}
     * @param  {object} parms 前端传入的FORM参数
     * @param {string} flag 操作的类型标志
     */
    async pageSaveLog(parms,flag){
        let log =[];
        let md = this.rec;
        if(flag === 'add' ){
            for(let edit of this.modEdits){
                if(edit.c_editable ) {
                    log.push(`${edit.c_name}:${md[edit.c_column]}`);
                }
            }
            await cmpage.model('admin/log').addLog(this.mod.user, log.join(', '),this.mod.id, md[this.pk], cmpage.enumStatusExecute.SUCCESS, cmpage.enumLogType.ADD);
        }else if(flag === 'update'){
            //debug(this.mod,'page.pageSaveLog - this.mod');
            let oldMd = {};
            if(think.isEmpty(parms["old_record"])){
                oldMd = await this.getDataRecord();
            }else{
                oldMd = JSON.parse(parms["old_record"]);
            }
            //debug(oldMd,'page.pageSaveLog - oldMd');
            log.push(`${this.pk}:${md[this.pk]}`);
            for(let edit of this.modEdits){
                if(edit.c_editable && edit.c_column !=='c_time' && edit.c_column !=='c_user' && edit.c_column.indexOf('c_')===0 && edit.c_type.indexOf('readonly') === -1) {
                    if(edit.c_coltype === 'timestamp'){
                        md[edit.c_column] =  cmpage.datetime(md[edit.c_column],'yyyy-MM-dd HH:mm:ss');
                        oldMd[edit.c_column] =  cmpage.datetime(oldMd[edit.c_column],'yyyy-MM-dd HH:mm:ss');
                    }
                    //cmpage.debug(edit,'this.mod.pageSaveLog - edit - 值有变化的字段保存到日志');
                    //cmpage.debug(md[edit.c_column],'this.mod.pageSaveLog - md[edit.c_column] ');
                    let newValue = cmpage.objToString(md[edit.c_column]).replace(/'/g,'');
                    if(oldMd[edit.c_column] !=newValue) {
//                        console.log(cmpage.objToString(md[edit.c_column]));
                        log.push(`${edit.c_name}: ${oldMd[edit.c_column]} --> ${newValue}`);
                    }else if(edit.c_column === 'c_name'){
                        log.push(`c_name:${md.c_name}`);
                    }
                }
            }
//            console.log(log.join(', '));
            await cmpage.model('admin/log').addLog(this.mod.user, log.join(', '),this.mod.id, md[this.pk], cmpage.enumStatusExecute.SUCCESS,  cmpage.enumLogType.UPDATE);
        }
    }

    //判断某个列是否存在于某个表中
    isExistColumn(column, list){
        for(let col of list){
            if(col.column === column){
                return true;
            }
        }
        return false;
    }

    //替换备注设置中的特殊字符,需要组成SQL
    getReplaceToSpecialChar(memo){
        //let ret = memo.split('*').join('\&').split(/##/).join("\'");
        if(think.isEmpty(memo)){
            return '';
        }
        let parms = memo.split('*');
        if(parms.length >1){
            for(let parm of parms){
                if(parm.indexOf('[[')==0){      // [[ 开头表示从parmsUrl中取值
                    let key =parm.substr(2,parm.length -2).trim();
                    let parmsUrl = this.mod.parmsUrl;
                    let val = parmsUrl[`${key}`];
                    parms[parms.indexOf(parm)] = `${key}=${val}`;
                    //console.log(parms);
                }
            }
        }
        //let ret = memo.replace(/\*/ig,'\&').replace(/##/ig,"\'");
        return parms.join('\&').replace(/##/g,"'");
    }

    /**
     * 取查看页面的设置，组合成列表数据的HTML输出</br>
     * 如果需要改变查看页面的逻辑，可以重写本方法，或者修改 this.modCols的设置值后调用 super.htmlGetView()
     * @method  htmlGetView
     * @return {string} HTML页面片段
     * @param {boolean} [isPrintStyle] 是否是打印的风格
     */
  async htmlGetView(isPrintStyle) {
      isPrintStyle = !think.isEmpty(isPrintStyle);
    let html = [];
    if(this.mod.editID <=0){
      return '<tr><td>----</td><td>----</td><td>----</td><td>该数据不存在！</td><td>----</td><td>----</td><td>----</td></tr>';
    }
    let list = await this.query(`select ${this.getListFields()} from ${this.mod.c_datasource} where ${this.pk}=${this.mod.editID}`);
    let md =list[0];
        //cmpage.debug(md);
    html.push('<tr>');
    let k =0;
    for(let col of this.modCols){
      if (!col.c_isview ){
        continue;
      }
      //html.push(`<td ${think.isEmpty(col.c_style) ? "":"style=" + col.c_style}>
      if(isPrintStyle){
          html.push(`<td class="td3" width="21%"> ${col.c_name}</td><td>`);
      }else{
          html.push(`<td> <label class="control-label x85">${col.c_name}: </label>`);
      }
      if (col.c_type === "checkbox"){
        //   if(isPrintStyle){
        //       html.push(md[col.c_column] ? "是" : "否");
        //   }else{
              html.push(`<input type="checkbox"  data-toggle="icheck" value="1" disabled  ${md[col.c_column] ? "checked" : ""} />`);
//          }
      }else if (col.c_type === "kindeditor") {
        html.push(`<div style="display: inline-block; vertical-align: middle;">${md[col.c_column]} </div>`);
      }else if(col.c_type === "html"){
        let input = think.isEmpty(col.c_memo) ? md[col.c_column] : col.c_memo.replace(/#value#/ig,md[col.c_column]);
        //debug(input,'page.htmlGetView - input.html');
        html.push(input);
    }else if (col.c_coltype === "float") {
        html.push(cmpage.formatNumber(Number(md[col.c_column]), {pattern: col.c_format}));
      } else if(col.c_coltype === "timestamp") {
        html.push(cmpage.datetime(md[col.c_column],col.c_format));
      } else if(col.c_coltype === "date") {
        html.push(cmpage.datetime(md[col.c_column],'yyyy-MM-dd'));
      } else if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
          html.push(await this.getReplaceText(md[col.c_column], col.c_memo));
      } else  {
        html.push(md[col.c_column]);
      }
      html.push('</td>');
      k +=1;
      if(k >= (this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE ? 1 : this.mod.c_edit_column)){
          html.push('</tr><tr>');
          k =0;
      }
    }
    if(k>0 && k <this.mod.c_edit_column && isPrintStyle){
        html.push('<td> </td><td> </td>');
    }
    html.push('</tr>');
    //debug(html.join(' '),'page.htmlGetView - return');
    return html.join(' ');
  }

  async htmlGetViewBtn(){
      let html =[];
      let listIds = this.mod.listIds.split(',');
      if (listIds.length > 0) {
          let prevID = 0, nextID = 0;
          let k = 0;
          for (let id of listIds) {
              if (id == this.mod.editID) {
                  k = listIds.indexOf(id);
                  break;
              }
          }
          if (k > 0) {
              prevID = listIds[k - 1];
          }
          if (k < listIds.length - 1) {
              nextID = listIds[k + 1];
          }
          html.push(`<li class="left" style="margin-left: -40px;"><button type="button" class="btn-default" ${k == 0 ? 'style="display:none"' : ''} data-icon="arrow-left"
                  onclick="return pageGotoView('${this.mod.c_modulename}',${prevID});">上一条</button></li>`);
          html.push(`<li class="left" ><button type="button" class="btn-default" ${nextID == 0 ? 'style="display:none"' : ''} data-icon="arrow-right"
                  onclick="return pageGotoView('${this.mod.c_modulename}',${nextID});">下一条</button></li>`);
      }
      html.push('<li><button type="button" class="btn-close" data-icon="close">关闭</button></li>');
      return html.join('');
  }

  /**
   * 取查看页面的设置，组合成打印页面的HTML输出
   * @method  htmlGetPrint
   * @return {string} HTML页面片段
   */
    async htmlGetPrint() {
        let html = [];
        //主表部分
        html.push('<table class="printTable" style="BORDER-COLLAPSE: collapse" bordercolor="#000000" cellSpacing=0 width="100%" align="center" bgcolor="#FFFFFF" border="1">');
        html.push(await this.htmlGetView(true));
        html.push('</table>');
        return html.join('');
    }

    /**
     * 删除记录,<br/>
     * 子类中可以重写本方法，实现其他的删除逻辑，如判断是否可以删除，删除相关联的其他记录等等
     * @method  pageDelete
     * @return {object} 记录对象
     */
    async pageDelete(){
        let ret={statusCode:200,message:'删除成功！',data:{}};

        if(this.mod.recID >0){
            if(think.isEmpty(this.mod.flag)){
                await this.model(this.mod.c_table).where(`${this.pk}=${this.mod.recID}`).update({c_status:-1});
            }else {
                await this.model(this.mod.c_table).where(`${this.pk}=${this.mod.recID}`).delete();
            }
        }
        return ret;
    }

    /**
     * 取分页列表的 footer 设置，组合成HTML输出，一般不需要重写本方法
     * @method  htmlGetFooter
     * @return {string}  HTML片段
     */
    htmlGetFooter() {
        if(this.mod.c_pager){
            let cnt = this.mod.user.listColumns === cmpage.ui.enumListColumns.MOBILE ?
                `${this.mod.pageSize > this.list.count ? this.list.count: this.mod.pageSize} / ${this.list.count}` : `每页&nbsp;${this.mod.pageSize}&nbsp;条，共  ${this.list.count} 条`;
            return `<div class="bjui-pageFooter">
                <div class="pages">
                    <span>${cnt}</span>
                </div>
                <div class="pagination-box" data-toggle="pagination" data-total="${this.list.count}" data-page-size="${this.mod.pageSize}"
                 data-page-current="${this.mod.pageIndex}" data-page-next="">
                </div>
            </div>`;
        }
        return '';
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
        debug(id,'page.updateStatus - id');
        if(id >0 && actID >0 && status >0){
            let rec = {c_status:status,c_act:actID,c_user:this.mod.user.id, c_time:think.datetime()};

            await this.model(this.mod.c_table).where(`${this.pk}=${id}`).update(rec);
            return {statusCode:200, message:'操作执行成功！'}
        }
        return {statusCode:300,message:'参数错误!'}
    }

    /**
     * 取模块列表的显示列设置，组合成时间轴HTML输出，一般在子类中通过重写这个方法来达到页面定制的效果
     * @method  htmlGetListTimeline
     * @return  {string}  HTML片段
     */
    async htmlGetListTimeline() {
        let html = [];

        await this.getDataList();
        //debug(this.list.data, 'page.htmlGetListTimeline - this.list.data');
        for(let row of this.list.data){
            //debug(row, 'page.htmlGetListTimeline - row'+this.list.data.indexOf(row));
            //处理替换值
            for(let col of this.modCols){
                if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                    //debug(col, 'page.htmlGetListTimeline - col'+this.modCols.indexOf(col));
                    row[col.c_column] = await this.getReplaceText(row[col.c_column], col.c_memo);
                }else if(col.c_coltype === 'timestamp'){
                    row[col.c_column] = think.datetime(row[col.c_column]);
                }
            }
            html.push('<li>');
            html.push(`<div class="time">${row.c_time}</div>`);
            html.push(`<div class="version">${row.c_status}</div>`);
            html.push(`<div class="number"></div>`);
            html.push(`<div class="content"><pre>${think.isEmpty(row.c_desc) ? '':'批注说明： '+row.c_desc}
${think.isEmpty(row.c_memo) ? '':'其他备注： ' +row.c_memo}</pre></div>`);
            html.push('</li>');
        }

        return html.join(' ');
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
    async getNameById(id,fieldNames,joinStr){
        if(id==0)   return '';
        let rec =await this.model(this.mod.c_table).where(`${this.pk}=${id}`).find();
        //debug(rec,'page.getNameById - rec');
        if(think.isEmpty(rec))  return '';
        if(think.isEmpty(fieldNames)){
            return rec.c_name;      //默认返回 c_name 字段值
        }else{
            return cmpage.strGetValuesByPropertyName(rec,fieldNames,joinStr)
        }
    }

}
