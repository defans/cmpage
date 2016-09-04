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
import CMPage from './page.js';

export default class extends CMPage {
    /**
     * 取模块列表中的MUI设置，组合成HTML输出，一般在子类中通过重写这个方法来达到页面定制的效果
     */
    async mobHtmlGetList(page,dataList) {
        let html = [];
        let modelPage = global.model('cmpage/module');
        let pageCols = await modelPage.getModuleCol(page.id);
        let pageBtns = await modelPage.getModuleBtn(page.id);

        for(let row of dataList){
            //处理替换值
            for(let col of pageCols){
                if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                    row[col.c_column] = await this.getReplaceText(row[col.c_column], col.c_memo);
                }else if(col.c_coltype === 'timestamp'){
                    row[col.c_column] = think.datetime(row[col.c_column]);
                }
            }
            html.push('<li class="mui-table-view-cell mui-media">');

            //加入按钮组
            html.push(await this.mobHtmlGetListBtns(row,pageBtns,page));

            //组合生成列表每项的内容
            html.push("<a class=\"mui-slider-handle list-item\" >");
            html.push(await this.mobHtmlGetListRow(row,pageCols));
            html.push('</a> </li>');
        }

        return html.join(' ');
    }

    /**
     * 生成列表每一行的按钮组
     */
    async mobHtmlGetListBtns(row,pageBtns,page) {
        let html =[];
        let mui = this.getPageMuiSetting(page);
        html.push('<div class="mui-slider-right mui-disabled">');
        for(let btn of pageBtns){
            if (btn.c_location > 10 && btn.c_isshow){
                if (btn.c_object.indexOf(".Edit") > 0)
                    html.push(`<a class='mui-btn mui-btn-green list-btn' href='${mui.editurl}'
                            data-type='view'  data-id='${row['id']}' >编辑</a>"`);
                else if (btn.c_object.indexOf(".Del") > 0)
                    html.push(`<a class='mui-btn mui-btn-red list-btn' href='/cmpage/page/delete?table=${page.c_datatable}&id=${row['id']}&flag=false'
                            data-type='action' >删除</a>`);
            }
        }
        html.push('</div>');
        return html.join(' ');
    }

    /**
     * 取模块的MUI设置
     */
    getPageMuiSetting(page){
        let mui = {editurl:'/html/commpage/commpage-edit.html'};
        for(let item of page.c_mui.split(',')){
            let its = item.split(':');
            if(its[0] === 'editurl'){
                mui.editurl = its[1];
            }
        }
        return mui;
    }

    /**
     * 生成列表每一行的内容
     */
    async mobHtmlGetListRow(row,pageCols) {
        let html =[];
        for(let col of pageCols){
            if (!think.isEmpty(col.c_mui)){
                let its = col.c_mui.split(',');
                html.push(`<${its[0]}> ${ its[1].replace(/#value#/, row[col.c_column]).replace(/#title#/, col.c_name.trim())} </${its[0]}>`);
            }
        }
        return html.join(' ');
    }

    /**
     * 生成查询页面
     */
    async mobHtmlGetQuery(page){
        let html =[];
        html.push(`<input type='hidden' name='modulename' value='${page.c_modulename}' />`);
        html.push(`<input type='hidden' name='parmsUrl' value='${page.parmsUrl}' />`);
        html.push("<input type='hidden' name='pageCurrent' value='1' />");
        html.push(`<input type='hidden' name='pageSize' value='${page.pageSize}' />`);

        let pageQuerys = await global.model('cmpage/module').getModuleQuery(page.id);
        let provinceValue ='';
        let cityValue='';

        for(let md of pageQuerys){
            if (md.c_isshow)
            {
                if (md.c_coltype === "bool"){
                    html.push("<div class='mui-input-row mui-checkbox'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(`<input type='checkbox' name='${md.c_column}'${ md.c_default === 'true' ? " checked" : ""} />`);
                }else if (md.c_type === "select"){
                    html.push("<div class='mui-input-row mui-select'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(`<select name='${md.c_column}' >`);
                    html.push( await this.getOptions(md) );
                    html.push("</select>");
                }else if (md.c_type === "countrySelect"){
                    let countryValue = md.c_default;
                    let areaModel = global.model('cmpage/area');
                    let provinceName = await areaModel.getProvinceName(provinceValue);
                    let cityName = await areaModel.getCityName(cityValue);
                    let countryName = await areaModel.getCountryName(countryValue);
                    html.push("<div class='mui-input-row'>");
                    html.push("<label>地区选择:</label>");
                    html.push(`<button class='mui-btn mui-btn-block citypicker' style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'
                        data-ref='${page.c_modulename}_c_country' type='button'>${provinceName} ${cityName} ${countryName} </button>
                        <input type='hidden' id='${page.c_modulename}_c_country' name='c_country' value='${provinceValue},${cityValue},${countryValue}' />`);
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
                    html.push(`<button data-options='${JSON.stringify(dateType)}' data-ref='" ${page.c_modulename + md.c_column}' class='btn mui-btn mui-btn-block datepicker'
                        style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'> ${dateTitle}</button>
                        <input type='hidden' id='${page.c_modulename + md.c_column}' name='${md.c_column}' value='${ md.c_default}' />`);
                }
                else if (md.c_type == "provinceSelect") {
                    provinceValue = md.c_default;
                }else if (md.c_type == "citySelect") {
                    cityValue = md.c_default;
                }else{
                    html.push("<div class='mui-input-row'>");
                    html.push(`<label>${md.c_name}:</label>`);
                    html.push(`<input name='${md.c_column}' type='${md.c_type}' value='${md.c_default}' class='mui-input-clear'  />`);
                }
                if (md.c_type !== "provinceSelect" && md.c_type !== "citySelect") {
                    html.push("</div>");
                }
            }
        }
        return html.join(' ');
    }

    /**
     * 生成APP端编辑页面
     */
    async mobHtmlGetEdit(page) {
        let html =[];
        let pageEdits = await global.model('cmpage/module').getModuleEdit(page.id);
        let md = {};
        if(page.editID >0) {
            let fields = [];
            for (let edit of pageEdits) {
                fields.push(`${edit.c_desc} as ${edit.c_column}`);
            }
            //global.debug(fields);
            let list = await this.model(page.c_datasource).field(fields.join(',')).where({id:page.editID}).select();
            md =list[0];
        }else{
            md = await this.pageEditInit(pageEdits,page);
        }
//        global.debug(md);
        html.push(`<input type='hidden' name='modulename' value='${page.c_modulename}' />`);
        html.push(`<input name='old_record' type='hidden' value='${JSON.stringify(md)}' />`);
        for(let col of pageEdits){
            if (!col.c_editable  ) {  continue; }
            let colValue = md[col.c_column];
            if(col.c_coltype === 'timestamp'){  colValue = think.datetime(colValue); }
            if (col.c_type === "hidden" && col.c_column!=="c_city" && col.c_column!=="c_province") {
                html.push(`<input name="${col.c_column}" type="hidden" value="${colValue}" />`);
                continue;
            }
            col.c_format = col.c_format.trim();
            if(col.c_type !== "hidden"){
                html.push(`<div class='mui-input-row ${col.c_type === "select" ? "mui-select" : (col.c_coltype === "bool" ? "mui-checkbox":"")}'>`);
                html.push(`<label>${col.c_name.trim()}:</label>`);
            }
            if (col.c_type === "datetime" ||col.c_type === "date") {
                let dateTitle = colValue;
                let dateType = {type:'date'};
                if (md.c_format.indexOf("HH:") >= 0){
                    dateTitle = think.isEmpty(dateTitle) ? "选择时间 ...": dateTitle;
                    dateType =  {type:'time'};
                    if (md.c_format.indexOf("yyyy-") >=0){
                        dateTitle = think.isEmpty(dateTitle) ? "选择日期 ...": dateTitle;
                        dateType = {};
                    }
                }
                html.push(`<button data-options='${JSON.stringify(dateType)}' data-ref='" ${page.c_modulename + md.c_column}' class='btn mui-btn mui-btn-block datepicker'
                        style='width:65%; border:none; text-align:left; padding-left:0px; height:100%;'> ${dateTitle}</button>
                        <input type='hidden' id='${page.c_modulename + md.c_column}' name='${md.c_column}' value='${ md.c_default}' />`);
            } else if (col.c_type === "select" || col.c_type === "selectBlank" || col.c_type === "readonlyReplace") {
                col.c_default = colValue;
                let isBlank = (col.c_type === "selectBlank" || col.c_type === "readonlyReplace");
                html.push(`<select name="${col.c_column}" > ${await this.getOptions(col,isBlank )} </select>`);
            } else if (col.c_type === "textarea") {
                html.push(`<textarea name="${col.c_column}" rows="4" >${colValue}</textarea>`);
            } else if (col.c_type === "checkbox") {
                html.push(`<input type='checkbox' name='${col.c_column}' ${colValue ? " checked" : ""} />`);
            }else if (col.c_type == "areaSelect"){
                let areaModel = global.model('cmpage/area');
                html.push(`<button class='mui-btn mui-btn-block citypicker' style='width:65%; border:none; text-align:left; padding-left:0px;'
                    data-ref='${page.c_modulename}_c_country' type='button'>${await areaModel.getProvinceName(md['c_province'])}
                    ${await areaModel.getCityName(md['c_city'])} ${await areaModel.getCountryName(md['c_country'])} </button>
                    <input type='hidden' id='${page.c_modulename}_c_country' name='c_country' value='${md['c_province']},${md['c_city']},${md['c_country']}' />`);
            }else if (col.c_type === "readonly") {
                html.push(`<input name="${col.c_column}" class='mui-input-clear mui-input' type="text" value="${colValue}"  readonly="readonly"  />`);
            }else if(col.c_column !=='c_province' && col.c_column !=='c_city'){
                html.push(`<input type='text' name='${col.c_column}' class='mui-input-clear mui-input' placeholder='请输入${col.c_name}' value='${colValue}' />`);
            }
            html.push('</div>');
        }
        return html.join(' ');
    }

}

