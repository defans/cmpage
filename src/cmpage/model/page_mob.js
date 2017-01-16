'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * page_mob model 实现手机APP的模块接口
 */
/**
 @module cmpage.model
 */

/**
 * 实现了手机APP的模块接口，可继承本类对手机APP的业务模块做定制化的HTML输出和功能操作, 方法名加了mob做前导，以示区分
 * @class cmpage.model.page_mob
 */
import CMPage from './page.js';

export default class extends CMPage {

    /**
     * 取模块列表中的MUI设置，组合成HTML输出，一般在子类中通过重写这个方法来达到页面定制的效果
     * @method  mobHtmlGetList
     * @return  {string}  HTML片段
     */
    async mobHtmlGetList() {
        let html = [];

        this.mobGetPageMuiSetting();
        //debug(this.mui.row, 'page_mob.mobHtmlGetList - this.mui.row');
        await this.getDataList();
        for(let row of this.list.data){
            //处理替换值
            for(let col of this.modCols){
                if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                    row[col.c_column] = await this.getReplaceText(row[col.c_column], col.c_memo);
                }else if(col.c_coltype === 'timestamp'){
                    row[col.c_column] = cmpage.datetime(row[col.c_column], col.c_format);
                }
            }
            html.push('<li class="mui-table-view-cell mui-media">');

            //加入按钮组
            html.push(await this.mobHtmlGetListBtns(row));
            if(this.list.data.indexOf(row) ==1){
                debug(await this.mobHtmlGetListBtns(row), 'page_mob.rowBtns');
            }

            //组合生成列表每项的内容
            html.push("<a class=\"mui-slider-handle list-item\" >");
            html.push(await this.mobHtmlGetListRow(row));
            // if(this.list.data.indexOf(row) ==1){
            //     debug(await this.mobHtmlGetListRow(row), 'page_mob.rowHtml');
            // }
            html.push('</a> </li>');
        }

        return html.join(' ');
    }

    /**
     * 生成列表每一行的按钮组HTML输出，一般在子类中通过重写这个方法来达到定制输出按钮的效果
     * @method  mobHtmlGetListBtns
     * @return  {string}  HTML片段
     * @param   {object} row 记录对象
     */
    async mobHtmlGetListBtns(row) {
        let html =[];
        html.push('<div class="mui-slider-right mui-disabled">');
        html.push('<style> .list-btn {	padding-left: 15px !important;	padding-right: 15px !important;	}	</style>');
        for(let btn of this.modBtns){
            if (btn.c_location > 10 && btn.c_isshow){
                btn.c_url = cmpage.objPropertysReplaceToStr(btn.c_url, row);
                if (btn.c_object.indexOf(".View") > 0){
                    html.push(`<a class='mui-btn mui-btn-blue list-btn cmpage-btn-view' href='#'
                            data-type='view'  data-id='${row['id']}' >查看</a>`);
                }else if (btn.c_object.indexOf(".Edit") > 0){
                    html.push(`<a class='mui-btn mui-btn-green list-btn cmpage-btn-view' href='#'
                            data-type='edit' data-parmsUrl='${JSON.stringify(this.mod.parmsUrl)}'  data-id='${row['id']}' >编辑</a>`);
                }else if (btn.c_object.indexOf(".FileList") > 0){
                    html.push(`<a class='mui-btn mui-btn-yellow list-btn cmpage-btn-view' href='#'
                            data-type='list_file' data-modulename='FileList'  data-parmsUrl='${JSON.stringify(cmpage.parmsFromUrl(this.getReplaceToSpecialChar(btn.c_url)))}' >附件</a>`);
                }else if (btn.c_object.indexOf(".Del") > 0){
                    html.push(`<a class='mui-btn mui-btn-red list-btn cmpage-btn-action' href='/cmpage/page/delete?modulename=${this.mod.c_modulename}&table=${this.mod.c_table}&id=${row['id']}&flag=false'
                             >删除</a>`);
                }
            }
        }
        html.push('</div>');
        return html.join(' ');
    }

    /**
     * 生成列表头部按钮组HTML输出，一般在子类中通过重写这个方法来达到定制输出按钮的效果
     * @method  mobHtmlGetHeaderBtnsFromModule
     * @return  {string}  HTML片段
     */
     async mobHtmlGetHeaderBtnsFromModule() {
         let html =[];
         for(let btn of this.modBtns){
             if (btn.c_location <= 10 && btn.c_isshow){
                 if (btn.c_object.indexOf(".Add") > 0){
                     html.push(`<a class='mui-icon mui-icon-plus list-btn cmpage-btn-view' href='#'
                             data-type='edit' data-modulename='${this.mod.c_modulename}' data-parmsUrl='${JSON.stringify(this.mod.parmsUrl)}'  data-id='0' ></a>`);
                 }
             }
         }
         return html;
     }
    async mobHtmlGetHeaderBtns() {
        let headerHtml =`<a href="cmpage-search.html" class="mui-icon mui-icon-search mui-pull-right cmpage-btn-search"></a>
        <h1 id="title" class="mui-title">${this.mod.c_alias}</h1>`;
        let html = await this.mobHtmlGetHeaderBtnsFromModule();
        if(html.length >1){
            //增加调用弹出菜单的按钮
            return [`${headerHtml} <a id="menu" class="mui-action-menu mui-icon mui-icon-bars mui-pull-left"></a></div>`, html.join(' ')];
        }else if(html.length == 1){
            //直接显示按钮
            return [`${headerHtml} ${html[0]}</div>`, ' '];
        }else{
            //增加回退按钮
            return [`${headerHtml} <a class="mui-action-back mui-icon mui-icon-left-nav mui-pull-left"></a></div>`, ' '];
        }
    }

    /**
     * 取模块的MUI设置，一般在子类中通过重写这个方法来增加MUI的配置信息，需要手机端做相应的逻辑实现
     * @method  mobGetPageMuiSetting
     */
    mobGetPageMuiSetting(){
        this.mui = cmpage.objFromString(this.mod.c_mui);
        // mui.editurl = think.isEmpty(mui.editurl) ? '/html/cmpage/cmpage-edit.html' : mui.editurl;
        // mui.viewurl = think.isEmpty(mui.viewurl) ? '/html/cmpage/cmpage-view.html' : mui.viewurl;
    }

    /**
     * 生成列表每一行的内容HTML输出，一般在子类中通过重写这个方法来达到定制分页列表的显示效果，例如： demo/customer:mobHtmlGetListRow
     * @method  mobHtmlGetListRow
     * @return  {string}  HTML片段
     * @param   {object} row 记录对象
     */
    async mobHtmlGetListRow(row) {
        let html =[];
        if(think.isEmpty(this.mui) || think.isEmpty(this.mui.row)){
            for(let col of this.modCols){
                if (!think.isEmpty(col.c_mui)){
                    let its = col.c_mui.split(',');
                    html.push(`<${its[0]}> ${ its[1].replace(/#value#/, row[col.c_column]).replace(/#title#/, col.c_name.trim())} </${its[0]}>`);
                }
            }
        }else{
            html.push(cmpage.objPropertysReplaceToStr(this.mui.row, row));
        }
        return html.join(' ');
    }

    /**
     * 取业务模块中的查询列设置，组合成APP端HTML输出，为保持和PC端的一致性，一般不需要重写
     * @method  mobHtmlGetQuery
     * @return  {string}  HTML片段
     */
    async mobHtmlGetQuery(){
        let html =[];
        html.push(`<input type='hidden' name='modulename' value='${this.mod.c_modulename}' />`);
        html.push(`<input type='hidden' name='parmsUrl' value='${this.mod.parmsUrl}' />`);
        html.push("<input type='hidden' name='pageCurrent' value='1' />");
        html.push(`<input type='hidden' name='pageSize' value='8' />`);

        let provinceValue ='';
        let cityValue='';

        debug(this.mod.query, 'page_mob.mobHtmlGetQuery - this.mod.query');
        for(let md of this.modQuerys){
            if(!think.isEmpty(this.mod.query[md.c_column])){
                md.c_default = this.mod.query[md.c_column];
            }
            if (md.c_isshow)
            {
                if (md.c_coltype === "bool"){
                    html.push("<div class='mui-input-row mui-checkbox'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(`<input type='checkbox' name='${md.c_column}'${ md.c_default === 'true' ? " checked" : ""} />`);
                }else if (md.c_type === "select" || md.c_type === "selectBlank" ){
                    html.push("<div class='mui-input-row mui-select'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(`<select name='${md.c_column}' >`);
                    html.push( await this.getOptions(md,true) );
                    html.push("</select>");
                }else if (md.c_type === "countrySelect"){
                    let countryValue = md.c_default;
                    let areaModel = cmpage.model('cmpage/area');
                    let provinceName = await areaModel.getProvinceName(provinceValue);
                    let cityName = await areaModel.getCityName(cityValue);
                    let countryName = await areaModel.getCountryName(countryValue);
                    html.push("<div class='mui-input-row'>");
                    html.push("<label>地区选择:</label>");
                    html.push(`<button class='mui-btn mui-btn-block cmpage-picker-country' style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'
                        data-ref='${this.mod.c_modulename}_c_country' type='button'>${provinceName} ${cityName} ${countryName} </button>
                        <input type='hidden' id='${this.mod.c_modulename}_c_country' name='c_country' value='${provinceValue},${cityValue},${countryValue}' />`);
                }else if (md.c_coltype == "datetime"){
                    let dateTitle = md.c_default;    // DateTime.Parse(dr[edit.c_column].ToString()).ToString(md.c_format);
                    let dateType = {type:'date'};
                    if (md.c_format.indexOf("HH:") >= 0){
                        dateTitle = "选择时间 ...";
                        dateType =  {type:'time'};
                        if (md.c_format.indexOf("yyyy-") >=0){
                            dateTitle = "选择日期 ...";
                            dateType = {};
                        }
                    }
                    html.push("<div class='mui-input-row'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(`<button data-options='${JSON.stringify(dateType)}' data-ref='" ${this.mod.c_modulename + md.c_column}' class='btn mui-btn mui-btn-block cmpage-picker-datetime'
                        style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'> ${dateTitle}</button>
                        <input type='hidden' id='${this.mod.c_modulename + md.c_column}' name='${md.c_column}' value='${ md.c_default}' />`);
                }
                else if (md.c_type == "provinceSelect") {
                    provinceValue = md.c_default;
                }else if (md.c_type == "citySelect") {
                    cityValue = md.c_default;
                }else if (md.c_type == "lookup") {
                    let parmsUrl = cmpage.objFromString(md.c_memo);    //形如：{modulename:'xxx', ...}
                    parmsUrl = think.isEmpty(parmsUrl) ? cmpage.parmsFromUrl(this.getReplaceToSpecialChar(md.c_memo)) : parmsUrl; //形如： /cmpage/page/lookup? ...
                    let inputHtml = `<button id='${md.c_column}' name='${md.c_column}' class='btn mui-btn mui-btn-block  mui-btn-warning mui-btn-outlined cmpage-btn-lookup'
                        data-parmsUrl='${ JSON.stringify(parmsUrl)}' data-modulename='${parmsUrl.modulename}'
                        style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'> ${md.c_default}</button>`;
                    debug(inputHtml,'page_mob.mobHtmlGetQuery - lookup');
                    html.push("<div class='mui-input-row'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(inputHtml);
                }else{
                    if(md.c_type != 'hidden'){
                        html.push("<div class='mui-input-row'>");
                        html.push(`<label>${md.c_name}:</label>`);
                    }
                    html.push(`<input name='${md.c_column}' type='${md.c_type}' value='${md.c_default}' class='mui-input-clear'  />`);
                }
                if (md.c_type !== "provinceSelect" && md.c_type !== "citySelect" && md.c_type != 'hidden') {
                    html.push("</div>");
                }
            }
        }
        return html.join(' ');
    }

    /**
     * 取业务模块中的编辑列设置，组合成APP端HTML输出，为保持和PC端的一致性，一般不需要重写
     * @method  mobHtmlGetEdit
     * @return  {string}  HTML片段
     */
    async mobHtmlGetEdit() {
        let html =[];
        let md = await this.getDataRecord();

//        cmpage.debug(md);
        html.push(`<input type='hidden' name='modulename' value='${this.mod.c_modulename}' />`);
        html.push(`<input name='old_record' type='hidden' value='${JSON.stringify(md)}' />`);
        for(let col of this.modEdits){
            if (!col.c_editable  ) {  continue; }
            let colValue = md[col.c_column];
            if(typeof(colValue) === 'undefined'){
                colValue = col.c_coltype ==='int' || col.c_coltype ==='float' ? 0 :(col.c_coltype ==='bool' ? false : '');
            }
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
            }

            if(col.c_coltype === 'timestamp'){  colValue = think.datetime(colValue); }
            if (col.c_type === "hidden" && col.c_column!=="c_city" && col.c_column!=="c_province") {
                html.push(`<input id="${col.c_column}" name="${col.c_column}" type="hidden" value="${colValue}" />`);
                continue;
            }
            col.c_format = col.c_format.trim();

            let inputHtml ='';
            if (col.c_type === "datetime" ||col.c_type === "date") {
                //debug(col.c_format,'page_mob.mobHtmlGetEdit - datetime.col.c_format');
                //col.c_format = think.isEmpty(col.c_format) ? "yyyy-MM-dd" : col.c_format;
                //colValue =cmpage.datetime(colValue,col.c_format);
                let dateTitle = '';
                let dateType = {type:'date'};
                if (col.c_format.indexOf("HH:") >= 0){
                    dateTitle = think.isEmpty(dateTitle) ? "选择时间 ...": dateTitle;
                    dateType =  {type:'time'};
                    if (col.c_format.indexOf("yyyy-") >=0){
                        dateTitle = think.isEmpty(dateTitle) ? "选择日期 ...": dateTitle;
                        dateType = {};
                    }
                }else{
                    colValue = colValue.substr(0,10);
                }
                inputHtml = `<button data-options='${JSON.stringify(dateType)}' data-ref='${col.c_column}' class='btn mui-btn mui-btn-block cmpage-picker-datetime'
                        style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'> ${think.isEmpty(dateTitle) ? colValue : dateTitle}</button>
                        <input type='hidden' id='${col.c_column}' name='${col.c_column}' value='${colValue}' />`;
                //debug(inputHtml,'page_mob.mobHtmlGetEdit - datetime.inputHtml');
            } else if (col.c_type === "select" || col.c_type === "selectBlank" || col.c_type === "readonlyReplace") {
                col.c_default = colValue;
                let isBlank = (col.c_type === "selectBlank" || col.c_type === "readonlyReplace");
                inputHtml = `<select id='${col.c_column}' name='${col.c_column}' > ${await this.getOptions(col,isBlank )} </select>`;
            } else if (col.c_type === "textarea") {
                inputHtml = `<textarea  id='${col.c_column}' name='${col.c_column}'  rows="4" >${colValue}</textarea>`;
            } else if (col.c_type === "checkbox") {
                inputHtml = `<input type='checkbox' id='${col.c_column}' name='${col.c_column}'  ${colValue ? " checked" : ""} />`;
            }else if (col.c_type == "areaSelect"){
                let areaModel = cmpage.model('cmpage/area');
                let areaName = `${await areaModel.getProvinceName(md['c_province'])}${await areaModel.getCityName(md['c_city'])} ${await areaModel.getCountryName(md['c_country'])}`;
                inputHtml = `<button class='mui-btn mui-btn-block cmpage-picker-country' style='width:65%; border:none; text-align:left; padding-left:0px;'
                    data-ref='c_country' type='button'>${think.isEmpty(areaName) ? '请选择':areaName}</button>
                    <input type='hidden' id='c_country' name='c_country' value='${md['c_province']},${md['c_city']},${md['c_country']}' />`;
            }else if (col.c_type === "readonly") {
                inputHtml = `<input id='${col.c_column}' name='${col.c_column}'  class='mui-input-clear mui-input' type="text" value="${colValue}"  readonly="readonly"  />`;
            }else if (col.c_type === "lookup") {
                let parmsUrl = cmpage.objFromString(col.c_memo);    //形如：{modulename:'xxx', ...}
                parmsUrl = think.isEmpty(parmsUrl) ? cmpage.parmsFromUrl(this.getReplaceToSpecialChar(col.c_memo)) : parmsUrl; //形如： /cmpage/page/lookup? ...
                inputHtml = `<button id='${col.c_column}' name='${col.c_column}' class='btn mui-btn mui-btn-block  mui-btn-warning mui-btn-outlined cmpage-btn-lookup'
                    data-parmsUrl='${ JSON.stringify(parmsUrl)}' data-modulename='${parmsUrl.modulename}'
                    style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'> ${colValue}</button>`;
                debug(inputHtml,'page_mob.mobHtmlGetEdit - lookup');
            }else if(col.c_column !=='c_province' && col.c_column !=='c_city'){
                inputHtml = `<input type='text' name='${col.c_column}' class='mui-input-clear mui-input' placeholder='请输入${col.c_name}' value='${colValue}' />`;
            }

            if(inputHtml.length >0){
                inputHtml = await this.mobHtmlGetEditInput(col,colValue,inputHtml);
            }
            if(col.c_type !== "hidden"){
                html.push(`<div class='mui-input-row ${col.c_type === "select" ? "mui-select" : (col.c_coltype === "bool" ? "mui-checkbox":"")}'>`);
                html.push(`<label>${col.c_name.trim()}:</label>`);
                html.push(`${inputHtml}</div>`);
            }
        }
        return html.join(' ');
    }

    /**
     * 改变某些编辑列的样式，子类中可以重写本方法类增加模块编辑页面的操作逻辑
     * @method  mobHtmlGetEditInput
     * @return {string} Edit页面的Input的HTML片段
     * @params {object} col Edit页面的当前编辑列设置
     * @params {string} colValue Input的值
     * @params {string} input Edit页面的Input的HTML片段
     */
    async mobHtmlGetEditInput(col,colValue,input) {
        //增加模块编辑页面的操作逻辑，也可以配合页面js方法

        return input;
    }
    async mobHtmlGetView(){
        let html = [];
        let rec = await this.getDataRecord();
        //debug(rec,'page_mob.mobHtmlGetView - rec');

        html.push("<ul class='mui-table-view mui-table-view-chevron'>");
        html.push("<input type='hidden' name='modulename' value='" + this.mod.c_modulename + "' />");
        for(let col of this.modCols){
            if(!col.c_isview) continue;
            let value = rec[col.c_column];
            if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                value = await this.getReplaceText(value, col.c_memo);
            }else if(col.c_coltype === 'timestamp'){
                value = cmpage.datetime(value, col.c_format);
            }
            html.push(`<div class='mui-input-row ${col.c_type == "select" ? "mui-select" : (col.c_coltype == "bit" ? "mui-checkbox" : "")}'>`);
            html.push(`<label>${col.c_name}: </label>`);
            html.push(`<input type='text' readonly=readonly value='${value}' />`);
            html.push("</div>");
            html.push("</ul>");
        }

        return html.join('');
    }
}
