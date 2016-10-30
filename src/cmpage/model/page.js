'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**

 @module cmthis.mod.model
 */

/**
 * 普通页面的数据处理类，实现了具体的操作方法
 * @class cmthis.mod.model.page
 */
export default class extends think.model.base {

        mod = {};   //模块主设置信息，及传入的参数等
        modQuerys = {}; //模块查询列设置信息
        modCols = {};    //模块显示列设置信息
        modEdits = {};   //模块编辑列设置信息
        modBtns = {};    //模块按钮设置信息
        list = {};     //结果列表集
        rec = {};      //当前记录

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
                if(k >2 && k !== -1){
                    for(let h of html){    html0.push(h);       }
                    html0.push('<button type="button" class="showMoreSearch" data-toggle="moresearch" data-name="custom"><i class="fa fa-angle-double-down"></i></button>');
                    html =[];
                    k = -1;
                }
                if(!think.isEmpty(this.mod.query[col.c_column])){
                    col.c_default = this.mod.query[col.c_column];
                }
                if(col.c_type !== "hidden" && col.c_type !== "provinceSelect" && col.c_type !== "citySelect" && col.c_type !== "countrySelect" && col.c_type !== "fixed")
                {
                    html.push(`<label  >${col.c_name}</label>`);
                    if(k !== -1){ k += 1; }
                }
                if (col.c_type === "hidden")
                {
                    html.push(`<input name="${col.c_column}" type="hidden" value="${col.c_default}"   />`);
                }else  if (col.c_coltype === "datetime" || col.c_coltype === "date" || col.c_coltype === "timestamp")
                {
                    html.push(`<input type="text" name="${col.c_column}" value="${col.c_default}" data-toggle="datepicker" data-rule="date" size="12" class="form-control" />`);
                }
                else if (col.c_coltype === "bool")
                {
                    html.push(`<input type="checkbox" name="${col.c_column}" data-toggle="icheck" value="true" data-label="是"
                        ${col.c_default ? "checked=checked" : ""} class="form-control" />`);
                }
                else if (col.c_type === "select")
                {
                    let options = await this.getOptions(col,true);
                    html.push(`<select name="${col.c_column}" data-toggle="selectpicker" > ${options} </select>`);
                }
                else if (col.c_type === "lookup")
                {
                    html.push(`<input name="${col.c_column}" type="lookup" size="${col.c_width}" value="${col.c_default}"  data-width="800" data-height="600"
                        data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${this.getReplaceToSpecialChar(col.c_memo)}" readonly="readonly" />`);
                }
                else if (col.c_type === "provinceSelect")
                {
                    html.push(`<select name="c_province" data-toggle="selectpicker"  data-nextselect="#city${this.mod.c_modulename}Query"
                        data-refurl="/cmpage/utils/get_citys?province={value}">  ${await global.model('cmpage/area').getProvinceItems(col.c_default,true)} </select>`);
                    provinceValue = col.c_default;
                }
                else if (col.c_type === "citySelect")
                {
                    html.push(`<select name="c_city" id="city${this.mod.c_modulename}Query" data-toggle="selectpicker" data-nextselect="#country${this.mod.c_modulename}Query"
                        data-refurl="/cmpage/utils/get_countrys?city={value}">${await global.model('cmpage/area').getCityItems(col.c_default,true,provinceValue )} </select>`);
                    cityValue = col.c_default;
                }
                else if (col.c_type === "countrySelect")
                {
                    html.push(`<select name="c_country" id="country${this.mod.c_modulename}Query" data-toggle="selectpicker" >${await global.model('cmpage/area').getCountryItems(col.c_default,true,cityValue)} </select>`);
                }
                else if( col.c_type !== "fixed")
                {
                    html.push(`<input name="${col.c_column}" type="${col.c_type}" size="${col.c_width}" value="${col.c_default}" data-rule="${col.c_memo}" class="form-control"  />`);
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
     * @return {Array}  查询的HTML片段，包括 bjui-moreSearch 部分
     * @param   {object} md 下拉项的设置，其中md.c_default为默认值，可以在调用本方法前修改
     * @param   {bool} [isBlank=false]   下拉项中是否增加空项，一般查询项是需要的
     */
    async getOptions(md, isBlank){
        let items = [];
        if (md.c_type == "select") {          //下拉框设置
            //global.debug(md.c_memo);
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
                    let fnModel = global.model(its[0]);     //通过某个模块的某个方法取下拉设置
                    if(think.isFunction(fnModel[its[1]])){
                        if(its.length === 3){
                            parms = await fnModel[ its[1] ](its[2]);
                        }else{
                            parms = await fnModel[ its[1] ]();
                        }
                    }
                    //global.debug(parms);
                    for (let parm of parms) {
                        items.push(`<option value='${parm.id}' "  ${parm.id == md.c_default ? "selected" : ""} >${parm.c_name}</option>`);
                    }
                }
            }
        }
//        global.debug(items.join(' '));
        return items.join(' ');
    }

    /**
     * 根据设置取显示的替换值
     * @method  getReplaceText
     * @return {string}  替换的字符串
     * @param   {string} value 当前值
     * @param   {string} replaceItems  替换的设置值，支持两种方式
     *                      1. 函数如：admin/code:getXXXXXX
     *                      2. json如：[{##value##:true,##text##:##男##},{##value##:false,##text##:##女##}]
     */
    async getReplaceText(value,replaceItems){
        if (/^\[{\w+/.test(replaceItems)) {
            let items = (think.isString(replaceItems) ? JSON.parse(replaceItems.replace(/##/ig,'\"')):replaceItems);
            for(let item of items){
                if(item.value === value){
                    return item.text;
                }
            }
        }else
        {
            let its = replaceItems.split(':');        //设置如： admin/code:getNameById
            if(its.length >1){
                let fnModel = global.model(its[0]);     //通过某个模块的某个方法取下拉设置
                if(think.isFunction(fnModel[its[1]])){
                    let args =[];
                    args.push(value);
                    if(its.length > 2){
                        for(let arg of its[2].split(',')){
                            args.push(arg);
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
      for(let btn of this.modBtns){
            if(btn.c_isshow ){
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
        for(let btn of this.modBtns){
            if (btn.c_isshow && btn.c_location > 10 ) {
                let btnUrl = this.getReplaceToSpecialChar(btn.c_url.replace(/#id#/,rec['id']));
                let btnClick = this.getReplaceToSpecialChar(btn.c_onclick.replace(/#id#/,rec['id']));
                let options = this.getReplaceToSpecialChar(btn.c_options);
                if(btn.c_object.indexOf('.Edit') >0){
                    btnUrl += `&listIds=${this.list.ids.join(',')}`;
                }
                html.push(` <a type="button" class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${options}" title="${btn.c_title}"
                             data-on-load="pageRecList_load"  data-on-close="page${this.mod.c_modulename}Edit_onClose" data-icon="${btn.c_icon}" href="${btnUrl}"
                            onclick="${btnClick}" data-title="${btn.c_title}"  style="${btn.c_style}" >${btn.c_label}</a> `);
            }
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
    let isShowBtn = this.isShowRowBtns();

    for (let col of this.modCols) {
        if (col.c_isshow) {
            html.push(`<th width="${col.c_width}" style="text-align:center;">${col.c_name} </th>`);
        }
    }
    if (this.mod.c_multiselect) {
        html.push('<th width="26"><input type="checkbox" class="checkboxCtrl" data-group="ids" data-toggle="icheck"></th>');
    }
    if (isShowBtn) {
        html.push('<th width="100" >操作</th>');
    }
    html.push('</tr> </thead>');

    //数据列
    await this.getDataList();
//    global.debug(this.list.data);

    html.push('<tbody>');
    for (let item of this.list.data) {
        html.push(`<tr id="row${item['id']}" data-id="${item['id']}" onclick="pageRowSelect(${item['id']},this);" >`);
        for (let col of this.modCols) {
            if (col.c_isshow) {
//                global.debug(col);
                html.push(`<td style="${item["id"] === 0 ? "font-weight:bold;" + col.c_style : col.c_style}" >`);
                if (item["id"] !== 0 && col.c_type_sum === "none") {
                    if (!think.isEmpty(col.c_format)) {
                        if (col.c_coltype === "decimal") {
                            html.push(global.formatNumber(item[col.c_column], {pattern: col.c_format}));
                        } else if(col.c_coltype === "timestamp" || col.c_coltype === "date") {
                            html.push(global.datetime(item[col.c_column], col.c_format));
                        }
                    } else if (col.c_type === "checkbox") {
                        html.push(`<input type="checkbox"  data-toggle="icheck" value="1" disabled  ${item[col.c_column] || item[col.c_column]===1 ? "checked" : ""} />`);
                    } else if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                        html.push(await this.getReplaceText(item[col.c_column], col.c_memo));
                    } else if (col.c_type === "html") {
                        html.push(item[col.c_column]);
                    } else if (col.c_type === "navtab") {
                        html.push(`<a href="${item[col.c_column]}" class="btn btn-blue" data-toggle="navtab" ${col.c_memo.replace(/#id#/, item["id"]).split(/##/).join( "\'")}
                        data-id="gotoTabPage" data-icon="share" data-on-load="pageRecList_load">${col.c_format}</a>`);
                    } else if (col.c_type == "dialog") {
                        html.push(`<a href="${item[col.c_column]}" class="btn btn-blue" data-toggle="navtab" ${col.c_memo.replace(/#id#/, item["id"]).split(/##/).join( "\'")}
                        data-id="gotoTabPage" data-icon="share" data-options="{mask:true,width:600,height:450}">${col.c_format}</a>`);
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
            html.push(`<td><input type="checkbox" name="ids" data-toggle="icheck" value="${item["id"]}"></td>`);
        }
        if (isShowBtn) {
            html.push('<td >');
            let btnHtml =await this.htmlGetBtnList(item);
//            global.debug(btnHtml);
            html.push(btnHtml);
            html.push('</td >');
        }
        html.push('</tr >');
    }
    html.push('</tbody >');

    return html.join(' ');
  }

    /**
     * 是否显示列表中的按钮，子类中重写本方法可以改变按钮显示的逻辑
     * @method  isShowRowBtns
     * @return {boolean} 是否显示
     */
    isShowRowBtns(){
        let isShow = false;
        for (let btn of this.modBtns) {
            if (btn.c_location > 9) {
                isShow = true;
                break;
            }
        }
        return isShow;
    }

    /**
     * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
     * @method  getDataList
     * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
     */
    async getDataList(){
        let where=await this.getQueryWhere();
        global.debug(`select count(id) as count from ${this.mod.c_datasource} ${where} `);

        let cnt = await this.query(`select count(id) as count from ${this.mod.c_datasource} ${where} `);
        this.list.count = cnt[0].count;
        this.list.data = [];
        this.list.ids = [];
        if(this.list.count >0 ) {
            //global.debug(this.mod);
            if (this.mod.c_pager) {
                this.list.data = await this.query(`select ${this.getListFields(this.modCols)} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by}
                limit ${this.mod.c_page_size} offset ${this.mod.c_page_size * (this.mod.pageIndex - 1)}`);
            } else {
                this.list.data = await this.query(`select ${this.getListFields()} from ${this.mod.c_datasource} ${where} order by ${this.mod.c_sort_by} `);
            }
            for (let rec of this.list.data) {
                this.list.ids.push(rec.id);
            }
        }
    }

    /**
     * 取查询项的设置，结合POST参数，得到Where字句，重写本方法可以定制或修改SQL的where子句
     * @method  getQueryWhere
     * @return {string} where 子句， 形如： where xxx and xxx
     */
    async getQueryWhere(){
        let ret =[' where 1=1'];
        let parmsUrl =JSON.parse(this.mod.parmsUrl);
        for(let md of this.modQuerys){
            if (md.c_type === "fixed"){         //如果是‘固定’，则直接增加c_memo中的设置值
                let wh = ` (${md.c_memo.replace(/#userID#/,this.mod.user.id).replace(/#groupID#/,this.mod.user.groupID).split(/##/).join('\'')})`;
                wh = wh.replace(/#value#/,parmsUrl[md.c_column]);
                ret.push(wh);
                continue;
            }
            if (md.c_isshow && md.c_op!=='NO') {
                if(!think.isEmpty(this.mod.query[md.c_column])){
                    if((md.c_coltype === 'int' && parseInt(this.mod.query[md.c_column])===0) || (md.c_type.indexOf('select') === 0 && this.mod.query[md.c_column] == 0)){
                        continue;
                    }
                    //console.log(md.c_column);
                    md.c_default = this.mod.query[md.c_column];
                    let value = this.mod.query[md.c_column].split('\'').join(' ').split('\"').join(' ').trim();
                    if((md.c_column ==='c_province' || md.c_column ==='c_city' || md.c_column ==='c_country') && value ==='-1'){    continue;   }
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
        fields.push(`(${col.c_memo.replace(/##/,"\'")}) as ${col.c_column}`);
      }else{
        fields.push(`${col.c_desc} as ${col.c_column}`);
      }
    }

    //  global.debug(fields);
    return fields.join(',');
  }

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     */
    async pageEditInit(){
        let md ={};
        for(let edit of this.modEdits){
            if(edit.c_column === 'id'){ continue; }

            let key = edit.c_column.trim();
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
        //console.log(md);
        return md
    }

    /**
     * 根据 this.mod.c_other的设置，对页面相关参数进行设置 </br>
     * 区别于 htmlGetOther
     * @method  getPageOther
     * @return {object} 在page中增加相应属性并返回
     */
    getPageOther(){
        this.mod.editHeaderHtml = '';
        this.mod.editCloseBtn = true;
        if(!think.isEmpty(this.mod.c_other)){
            let its = this.mod.c_other.split(',');
            for(let item of its){
                let it = item.split(':');
                if(it[0] ==='editTitle'){
                    this.mod.editHeaderHtml = `<div class="bjui-pageHeader"><label data-height="30px" style="margin: 5px;">${it[1]}</label></div>`;
                }else if(it[0] ==='editCloseBtn'){
                    this.mod.editCloseBtn = (it[1] !== 'none');
                }
            }
        }
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
                    fields.push(`${edit.c_desc} as ${edit.c_column}`);
                }
            }
            let list = await this.model(this.mod.c_datasource).field(fields.join(',')).where({id:this.mod.editID}).select();
            md =list[0];
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

        html.push(`<input name='old_record' type='hidden' value='${JSON.stringify(md).replace(/'/g,'')}' />`);
//        global.debug(md);
        for(let col of this.modEdits){
            if (!col.c_editable || col.c_column === "id" ) {  continue; }
            let colValue = md[col.c_column];
            if(col.c_desc.indexOf('fn:')===0){    //非数据库字段
                let its = col.c_desc.trim().split(':');        //设置如： fn:admin/code:getNameByPid:c_status
                let fnModel = global.model(its[1]);     //通过某个模块的某个方法取下拉设置
                if(think.isFunction(fnModel[its[2]])){
                    if(its.length === 4){
                        colValue = await fnModel[ its[2] ]( md[its[3]]);
                    }else{
                        colValue = await fnModel[ its[2] ]();
                    }
                }
            }
            if(col.c_coltype === 'timestamp'){  colValue = think.datetime(colValue); }
            if (col.c_type === "hidden" && col.c_column!=="c_city" && col.c_column!=="c_province") {
                html.push(`<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="hidden" value="${colValue}" />`);
                continue;
            }
            col.c_format = col.c_format.trim();
            if(col.c_type !== "hidden"){
                html.push(` <label  class="row-label">${col.c_name}: </label>`);
            }
            let input ='';
            if (col.c_type === "datetime" ||col.c_type === "date") {
                input += `<input type="text" name="${col.c_column}" value="${ global.datetime(colValue,think.isEmpty(col.c_format) ? 'yyyy-MM-dd':col.c_format)}"
                    ${col.c_type === "readonly" ? "disabled":""} data-toggle="datepicker" data-pattern="${think.isEmpty(col.c_format) ? 'yyyy-MM-dd':col.c_format}"  size="15" />`;
            } else if (col.c_type === "select" || col.c_type === "selectBlank" ) {
                input += `<select name="${col.c_column}" data-toggle="selectpicker" ${col.c_isrequired ? "data-rule=required" : ""}>`;
                col.c_default = colValue;
                input += await this.getOptions(col,false);
                input += '</select>';
            } else if (col.c_type === "textarea") {
                input += `<textarea name="${col.c_column}" data-toggle="autoheight" cols="${col.c_width}" rows="1"  ${col.c_isrequired ? "data-rule=required" : ""}>${colValue}</textarea>`;
            } else if (col.c_type === "lookup") {
                input += `<input name="${col.c_column}" type="lookup" size="${col.c_width}" value="${colValue}"
                    data-width="800" data-height="600" data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${this.getReplaceToSpecialChar(col.c_memo)}" readonly="readonly" />
                      <!--<a class="bjui-lookup" href="javascript:;" ><i class="fa fa-search"></i></a>--> `;
            }else if (col.c_type == "areaSelect"){
                input += `<select name="c_province" data-toggle="selectpicker"  data-nextselect="#city${this.mod.c_modulename}" data-refurl="/cmpage/utils/get_citys?province={value}" >`;
                input += await global.model('cmpage/area').getProvinceItems(md['c_province'],true);
                if(col.c_column ==='c_country'){
                    input += `</select> <select name="c_city" id="city${this.mod.c_modulename}" data-toggle="selectpicker" data-nextselect="#country${this.mod.c_modulename}"
                        data-refurl="/cmpage/utils/get_countrys?city={value}" >`;
                    input += await global.model('cmpage/area').getCityItems(md['c_city'],true);
                    input += `</select> <select name="c_country" id="country${this.mod.c_modulename}" data-toggle="selectpicker" data-rule="required" >`;
                    input += await global.model('cmpage/area').getCountryItems(md['c_country'],true);
                }else if(col.c_column === 'c_city'){
                    input += `</select> <select name="c_city" id="city${this.mod.c_modulename}" data-toggle="selectpicker" data-nextselect="#country${this.mod.c_modulename}" >`;
                    input += await global.model('cmpage/area').getCityItems(md['c_city'],true);
                }
                input += '</select>';
            } else if(col.c_type === "kindeditor"){
                input += `<div style="display: inline-block; vertical-align: middle;"> <textarea name="${col.c_column}" style="width: 960px;height:640px;"
                        data-toggle="kindeditor" data-minheight="460"> ${colValue}  </textarea> </div>`;
            } else if (col.c_type == "checkbox") {
                input += `<input type="checkbox" name="${col.c_column}" data-toggle="icheck" value="1" data-label="${col.c_memo}"  ${colValue == "1" ? "checked" : ""} />`;
            }else if (col.c_type === "readonly") {
                input += `<input name="${col.c_column}" type="text" size="${col.c_width}" value="${colValue}"  readonly="readonly"  />`; // style=background-color:#fde5d4;
            }else if (col.c_type === "readonlyReplace") {
//                global.debug(col,'this.mod.getHtmlEdit --- col readonlyReplace');
//                global.debug(md,'this.mod.getHtmlEdit --- md readonlyReplace');
                input += `<input name="${col.c_column}" type="hidden"  value="${colValue}"  readonly="readonly"  />`;
                input += `<input name="${col.c_column}_text" type="text" size="${col.c_width}" value="${await this.getReplaceText(colValue, col.c_memo)}"  readonly="readonly"  />`; // style=background-color:#fde5d4;
            }else if(col.c_column !=='c_province' && col.c_column !=='c_city'){
                input += `<input id="${this.mod.c_modulename + col.c_column}" name="${col.c_column}" type="${col.c_type}" size="${col.c_width}" value="${colValue}"
                    ${col.c_isrequired ? "data-rule=required;" + col.c_memo : (think.isEmpty(col.c_memo) ? "" : "data-rule=" + col.c_memo)}  />`;
            }
            if (col.c_type !== "areaSelect"){
                input += col.c_suffix;
            }
            if(input.length >0){
                html.push(`<div class="row-input">${input}</div>`);
            }

        }
        return html.join('');
    }

    /**
     * 取编辑页面的按钮设置，组合按钮的HTML输出
     * @method  htmlGetEditBtns
     * @return {string} HTML页面片段
     */
    async htmlGetEditBtns() {
        global.debug(this.mod,'this.mod.htmlGetEditBtns -- this.mod')
        let html = [];
        if(this.mod.editCloseBtn){
            html.push('<li><button type="button" class="btn-close" data-icon="close">关闭</button></li>');
        }
        html.push('<li ><button type="submit" class="btn-green"  data-icon="save">保存</button></li>');

        if(this.mod.editID >0) {
            let parmsUrl = JSON.parse(this.mod.parmsUrl);
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
                onclick="return pageGotoEdit('${this.mod.c_modulename}',${prevID});">上一条</button></li>`)
                html.push(`<li class="left" ><button type="button" class="btn-default" ${nextID == 0 ? 'style="display:none"' : ''} data-icon="arrow-right"
                onclick="return pageGotoEdit('${this.mod.c_modulename}',${nextID});">下一条</button></li>`)

            }
        }

        return html.join('');
    }


    /**
     * 编辑页面保存,<br/>
     * 如果是多个表的数据产生的编辑页，则根据存在于this.mod.c_table中的列更新表，一般需要在子类中继承，例如： admin/user:pageSave
     * @method  pageSave
     * @return {object} 记录对象
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms){
        global.debug(parms,'this.mod.pageSave - parms - 递交的内容')
        //global.debug(this.modEdits,'this.mod.pageSave - this.modEdits')
        this.rec = {};
        for(let edit of this.modEdits){
            if(edit.c_editable && edit.c_column.indexOf('c_')===0 ) {      //&& this.isExistColumn(edit.c_column,colList)
                if(edit.c_type === 'checkbox'){
                    this.rec[edit.c_column] = think.isEmpty(parms[edit.c_column]) ? false : parms[edit.c_column];
                }else{
                    this.rec[edit.c_column] = parms[edit.c_column];
                }
            }
        }
        //global.debug(this.rec,'this.mod.pageSave - md - 保存内容')
        if(parms.id == 0){
            //let id = await this.query(global.getInsertSql(md,this.mod.c_table) +' returning id;');
            this.rec.id = await this.model(this.mod.c_table).add(global.checksql(this.rec));
            await this.pageSaveLog(parms,'add');
        }else {
            await this.model(this.mod.c_table).where({id:parseInt(parms.id)}).update(global.checksql(this.rec));
            this.rec.id = parms.id;
            await this.pageSaveLog(parms,'update');
        }

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
            await global.model('admin/log').addLog(this.mod.user, log.join(', '),this.mod.id, md.id, global.enumStatusExecute.SUCCESS, global.enumLogType.ADD);
        }else if(flag === 'update'){
            let oldMd = {};
            if(think.isEmpty(parms["old_record"])){
                oldMd = await this.getDataRecord();
            }else{
                oldMd = JSON.parse(parms["old_record"]);
            }
            //think.log(oldMd);
            log.push(`id:${md.id}`);
            for(let edit of this.modEdits){
                if(edit.c_editable && edit.c_column !=='c_time' && edit.c_column !=='c_user' && edit.c_column.indexOf('c_')===0 && edit.c_type.indexOf('readonly') === -1) {
                    if(edit.c_coltype === 'timestamp'){
                        md[edit.c_column] =  global.datetime(md[edit.c_column],'yyyy-MM-dd HH:mm:ss');
                        oldMd[edit.c_column] =  global.datetime(oldMd[edit.c_column],'yyyy-MM-dd HH:mm:ss');
                    }
                    //global.debug(edit,'this.mod.pageSaveLog - edit - 值有变化的字段保存到日志');
                    //global.debug(md[edit.c_column],'this.mod.pageSaveLog - md[edit.c_column] ');
                    let newValue = global.objToString(md[edit.c_column]).replace(/'/g,'');
                    if(oldMd[edit.c_column] !=newValue) {
//                        console.log(global.objToString(md[edit.c_column]));
                        log.push(`${edit.c_name}: ${oldMd[edit.c_column]} --> ${newValue}`);
                    }else if(edit.c_column === 'c_name'){
                        log.push(`c_name:${md.c_name}`);
                    }
                }
            }
//            console.log(log.join(', '));
            await global.model('admin/log').addLog(this.mod.user, log.join(', '),this.mod.id, md.id, global.enumStatusExecute.SUCCESS,  global.enumLogType.UPDATE);
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
                    let parmsUrl = JSON.parse(this.mod.parmsUrl);
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
     * 取查看页面的设置，组合成列表数据的HTML输出
     * @method  htmlGetView
     * @return {string} HTML页面片段
     */
  async htmlGetView() {
    let html = [];
    if(this.mod.viewID <=0){
      return '<tr><td>----</td><td>----</td><td>----</td><td>该数据不存在！</td><td>----</td><td>----</td><td>----</td></tr>';
    }
    let list = await this.query(`select ${this.getListFields()} from ${this.mod.c_datasource} where id=${this.mod.viewID}`);
    let md =list[0];
        //global.debug(md);
    for(let col of this.modCols){
      if (!col.c_isview ){
        continue;
      }
      html.push(`<tr><td ${think.isEmpty(col.c_style) ? "":"style=" + col.c_style}>
        <label class="control-label x85">${col.c_name}: </label>`);
      if (col.c_type === "checkbox"){
        html.push(`<input type="checkbox"  data-toggle="icheck" value="1" disabled  ${md[col.c_column] ? "checked" : ""} />`);
      }else if (col.c_type === "kindeditor") {
        html.push(`<div style="display: inline-block; vertical-align: middle;">${md[col.c_column]} </div>`);
      }else if (col.c_coltype === "decimal") {
        html.push(global.formatNumber(md[col.c_column], {pattern: col.c_format}));
      } else if(col.c_coltype === "timestamp") {
        html.push(global.datetime(md[col.c_column],col.c_format));
      } else if(col.c_coltype === "date") {
        html.push(global.datetime(md[col.c_column],'yyyy-MM-dd'));
      } else if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
          html.push(await this.getReplaceText(md[col.c_column], col.c_memo));
      } else  {
        html.push(md[col.c_column]);
      }
      html.push('</td></tr>');
    }
    return html.join(' ');
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
            if(this.mod.flag == 'true'){
                await model.where({id: this.mod.recID}).delete();
            }else {
                await model.where({id: this.mod.recID}).update({c_status:-1});
            }
        }
        return ret;
    }

}
