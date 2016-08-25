'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * model 普通页面的输出
 */
export default class extends think.model.base {
    /**
     * 取查询项的设置，组合成HTML输出
     */
    async htmlGetQuery(page){
        let html =[];
        let pageQuerys = await this.model('module',{},'cmpage').getModuleQuery(page.id);
        let provinceValue ='';
        let cityValue='';
        for(let col of pageQuerys){
            if (col.c_isshow) {
                if(!think.isEmpty(page.query[col.c_column])){
                    col.c_default = page.query[col.c_column];
                }
                if(col.c_type !== "hidden" && col.c_type !== "provinceSelect" && col.c_type !== "citySelect" && col.c_type !== "countrySelect" && col.c_type !== "fixed")
                {
                    html.push(`<label  >${col.c_name}</label>`);
                }
                if (col.c_type === "hidden")
                {
                    html.push(`<input name="${col.c_column}" type="hidden" value="${col.c_default}"   />`);
                }else  if (col.c_coltype === "datetime" || col.c_coltype === "date" || col.c_coltype === "timestamp")
                {
                    html.push(`<input type="text" name="${col.c_column}" value="${col.c_default}" data-toggle="datepicker" data-rule="date" size="15" class="form-control" />`);
                }
                else if (col.c_coltype === "bool")
                {
                    html.push(`<input type="checkbox" name="${col.c_column}" data-toggle="icheck" value="true" data-label="是"
                        ${col.c_default ? "checked=checked" : ""} class="form-control" />`);
                }
                else if (col.c_type === "select")
                {
                    let options = await this.getOptions(col);
                    html.push(`<select name="${col.c_column}" data-toggle="selectpicker" > ${options} </select>`);
                }
                else if (col.c_type === "lookup")
                {
                    html.push(`<input name="${col.c_column}" type="lookup" size="${col.c_width}" value=""  data-width="800" data-height="600"
                        data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${this.getReplaceToSpecialChar(col.c_memo,page)}" readonly="readonly" />`);
                }
                else if (col.c_type === "provinceSelect")
                {
                    html.push(`<select name="c_province" data-toggle="selectpicker"  data-nextselect="#city${page.c_modulename}Query"
                        data-refurl="/cmpage/common/get_citys?province={value}">  ${await this.model('cmpage/area').getProvinceItems(col.c_default,true)} </select>`);
                    provinceValue = col.c_default;
                }
                else if (col.c_type === "citySelect")
                {
                    html.push(`<select name="c_city" id="city${page.c_modulename}Query" data-toggle="selectpicker" data-nextselect="#country${page.c_modulename}Query"
                        data-refurl="/cmpage/common/get_countrys?city={value}">${await this.model('cmpage/area').getCityItems(col.c_default,true,provinceValue )} </select>`);
                    cityValue = col.c_default;
                }
                else if (col.c_type === "countrySelect")
                {
                    html.push(`<select name="c_country" id="country${page.c_modulename}Query" data-toggle="selectpicker" >${await this.model('cmpage/area').getCountryItems(col.c_default,true,cityValue)} </select>`);
                }
                else if( col.c_type !== "fixed")
                {
                    html.push(`<input name="${col.c_column}" type="${col.c_type}" size="${col.c_width}" value="${col.c_default}" data-rule="${col.c_memo}" class="form-control"  />`);
                }
            }
        }

        return html.join(' ');
    }

  async htmlGetOther(page){
    return ``;
  }

  /**
   * 下拉框的选择集
   */
    async getOptions(md){
        let items = [];
        if (md.c_type == "select") {          //下拉框设置
            //global.debug(md.c_memo);
            items.push('<option value="0"> </option>');
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
                    if(its.length === 3){
                        let fnModel = this.model(its[0]);     //通过某个模块的某个方法取下拉设置
                        if(think.isFunction(fnModel[its[1]])){
                            //let func =fnModel[ its[1] ];
                            parms = await fnModel[ its[1] ](its[2]);
                            //global.debug(parms);
                        }
                    }
                   // global.debug(parms);
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
     * 取设置的替换值
     * replaceItems:
     * 1) code_XXXXX
     * 2) [{##value##:true,##text##:##男##},{##value##:false,##text##:##女##}]
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
                let fnModel = this.model(its[0]);     //通过某个模块的某个方法取下拉设置
                if(think.isFunction(fnModel[its[1]])){
                    return await fnModel[ its[1] ](value);
                }
            }
        }

        return "";
    }

  /**
  * 取顶部按钮的设置，组合成列表头的HTML输出
  */
  async htmlGetBtnHeader(page){
      let html =[];
      let htmlRight =[];
      let pageBtns = await this.model('module',{},'cmpage').getModuleBtn(page.id);
      for(let btn of pageBtns){
            if(btn.c_isshow ){
                if(btn.c_location <6){
                    html.push(`<a class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${this.getReplaceToSpecialChar(btn.c_options,page)}"  data-on-close="page${page.c_modulename}Edit_onClose"
                      data-icon="${btn.c_icon}" href="${this.getReplaceToSpecialChar(btn.c_url,page)}" data-title="${btn.c_title}" data-on-load="pageRecList_load"
                      onclick="${this.getReplaceToSpecialChar(btn.c_onclick,page)}">${btn.c_label}</a>`);
                }else if(btn.c_location >5 && btn.c_location <10){      //靠右放置
                    htmlRight.push(`<a class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${this.getReplaceToSpecialChar(btn.c_options,page)}"  data-on-close="page${page.c_modulename}Edit_onClose"
                      data-icon="${btn.c_icon}" href="${this.getReplaceToSpecialChar(btn.c_url,page)}" data-title="${btn.c_title}" data-on-load="pageRecList_load"
                      onclick="${this.getReplaceToSpecialChar(btn.c_onclick,page)}">${btn.c_label}</a>`);
                }
            }
      }
      return html.join(' ')+(htmlRight.length >0 ? '<div class="pull-right">'+htmlRight.join(' ')+'</div>': '');
  }

  /**
   * 取列表中按钮的设置，组合成HTML输出
   */
  async htmlGetBtnList(rec,page,pageBtns){
    let html=[];
     for(let btn of pageBtns){
       if (btn.c_isshow && btn.c_location > 10 ) {
         let btnUrl = this.getReplaceToSpecialChar(btn.c_url.replace(/#id#/,rec['id']),page);
         let btnClick = this.getReplaceToSpecialChar(btn.c_onclick.replace(/#id#/,rec['id']),page);
         let options = this.getReplaceToSpecialChar(btn.c_options,page);
         html.push(` <a type="button" class="${btn.c_class}" data-toggle="${btn.c_opentype}" data-options="${options}" title="${btn.c_title}"
                         data-on-load="pageRecList_load"  data-on-close="page${page.c_modulename}Edit_onClose" data-icon="${btn.c_icon}" href="${btnUrl}"
         onclick="${btnClick}" data-title="${btn.c_title}"  style="${btn.c_style}" >${btn.c_label}</a> `);
       }
     }
    return html.join(' ');
  }

    /**
     * 取分页列表项的设置，组合成列表数据的HTML输出
     */
  async htmlGetList(page,dataList) {
    let html = ['<thead> <tr >'];
    let pageCols = await this.model('module',{},'cmpage').getModuleCol(page.id);
    let pageBtns = await this.model('module',{},'cmpage').getModuleBtn(page.id);
    let isShowBtn = false;

    for (let btn of pageBtns) {
      if (btn.c_location > 9) {
        isShowBtn = true;
        break;
      }
    }

    for (let col of pageCols) {
        if (col.c_isshow) {
            html.push(`<th width="${col.c_width}" style="text-align:center;">${col.c_name} </th>`);
        }
    }
    if (page.c_multiselect) {
        html.push('<th width="26"><input type="checkbox" class="checkboxCtrl" data-group="ids" data-toggle="icheck"></th>');
    }
    if (isShowBtn) {
        html.push('<th width="100" >操作</th>');
    }
    html.push('</tr> </thead>');

    //数据列
//    let dataList = await this.getDataList(page,pageCols);
//    global.debug(dataList);

    html.push('<tbody>');
    for (let item of dataList) {
        html.push(`<tr data-id="${item['id']}" onclick="$('#idSelect${page.c_modulename}').val(${item['id']});" >`);
        for (let col of pageCols) {
            if (col.c_isshow) {
//                global.debug(col);
                html.push(`<td style="${item["id"] === 0 ? "font-weight:bold;" + col.c_style : col.c_style}" >`);
                if (item["id"] !== 0 && col.c_type_sum === "none") {
                    if (!think.isEmpty(col.c_format)) {
                        if (col.c_coltype === "decimal") {
                            html.push(global.formatNumber(item[col.c_column], {pattern: col.c_format}));
                        } else {
                            html.push(item[col.c_column]);
                        }
                    } else if (col.c_type === "checkbox") {
                        html.push(`<input type="checkbox"  data-toggle="icheck" value="1" disabled  ${item[col.c_column] ? "checked" : ""} />`);
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
                            if (col.c_coltype === "decimal") {
                                html.push(global.formatNumber(item[col.c_column], {pattern: col.c_format}));
                            } else if(col.c_coltype === "timestamp") {
                                html.push(think.datetime(item[col.c_column]));
                            } else if(col.c_coltype === "date") {
                                html.push(think.datetime(item[col.c_column],"YYYY-MM-DD"));
                            } else  {
                                html.push(item[col.c_column]);
                            }
                        }
                    }
                }
                html.push('</td>')
            }
        }
        if (page.c_multiselect) {
            html.push(`<td><input type="checkbox" name="ids" data-toggle="icheck" value="${item["id"]}"></td>`);
        }
        if (isShowBtn) {
            html.push('<td >');
            let btnHtml =await this.htmlGetBtnList(item, page,pageBtns);
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
     * 取数据列表
     */
    async getDataList(page){
        let pageCols = await this.model('module',{},'cmpage').getModuleCol(page.id);
        let data = {};
        let where=await this.getQueryWhere(page);

        let cnt = await this.query(`select count(id) as count from ${page.c_datasource} ${where} `);
        data.count = cnt[0].count;
        if(data.count ==0 ) {
            data.list = [];
            return data;
        }

        //      global.debug(where);
        if(page.c_pager) {
            data.list = await this.query(`select ${this.getListFields(pageCols)} from ${page.c_datasource} ${where} order by ${page.c_sort_by} limit ${page.c_page_size} offset ${page.c_page_size * (page.pageIndex - 1)}`);
        }else {
            data.list = await this.query(`select ${this.getListFields(pageCols)} from ${page.c_datasource} ${where} order by ${page.c_sort_by} `);
        }
        return data;
    }

    /**
    * 取查询项的设置，结合POST参数，得到Where字句
    */
    async getQueryWhere(page){
        let ret =[' where 1=1'];
        let pageQuerys = await this.model('module',{},'cmpage').getModuleQuery(page.id);
        for(let md of pageQuerys){
            if (md.c_type === "fixed"){         //如果是‘固定’，则直接增加c_memo中的设置值
                let wh = ` (${md.c_memo.replace(/#userID#/,page.user.id).replace(/#groupID#/,page.user.groupID).split(/##/).join('\'')})`;
                wh = wh.replace(/#value#/,page.parmsUrl[md.c_column]);
                ret.push();
                continue;
            }
            if (md.c_isshow) {
                if(!think.isEmpty(page.query[md.c_column])){
                    if(md.c_coltype === 'int4' && parseInt(page.query[md.c_column])===0){
                        continue;
                    }
                    md.c_default = page.query[md.c_column];
                    let value = page.query[md.c_column].split('\'').join(' ').split('\"').join(' ').trim();
                    if((md.c_column ==='c_province' || md.c_column ==='c_city' || md.c_column ==='c_country') && value ==='-1'){    continue;   }
                    ret.push(md.c_column + ' '+this.getOpValue(md.c_op, value, md.c_coltype));
                }
            }
        }
        return ret.join(' and ');
    }

  /**
   * 把查询条件的操作符转换成SQL字句
   */
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
   * 取得页面显示列表返回字段设置
   */
  getListFields(pageCols){
    let fields = [];
    for(let col of pageCols){
      if (!col.c_isretrieve) continue;
      if (col.c_type === "replace" && (col.c_isshow || col.c_isview) && (/^select\w+/.test(col.c_memo))) //以select开头
      {
        fields.push(`(${col.c_memo.replace(/##/,"\'")}) as ${col.c_column}`);
      }else {
        fields.push(`${col.c_desc} as ${col.c_column}`);
      }
    }

    return fields.join(',');
  }

    /**
     * 初始化编辑页面的值
     */
    async pageEditInit(pageEdits,page){
        let md ={};
        for(let edit of pageEdits){
            if(edit.c_column === 'id'){ continue; }

            let key = edit.c_column.trim();
            if(edit.c_coltype === 'int4' || edit.c_coltype === 'integer' || edit.c_coltype === 'decimal') {
                md[key] = 0;
            }else if(edit.c_coltype === 'bool'){
                md[key] = true;
            }else if(edit.c_coltype === 'datetime' || edit.c_coltype === 'timestamp'){
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
     * 取编辑页面的设置，组合成列表数据的HTML输出
     */
    async htmlGetEdit(page) {
        let html = ['<thead> <tr >'];
        //let pageEdits = await think.cache(`moduleEdit${page.id}`);
      let pageEdits = await this.model('module',{},'cmpage').getModuleEdit(page.id);
        let md = {};
        if(page.editID >0) {
            let fields = [];
            for (let edit of pageEdits) {
                fields.push(`${edit.c_desc} as ${edit.c_column}`);
            }
            //global.debug(fields);
            let list = await this.query(`select ${fields.join(',')} from ${page.c_datasource} where id=${page.editID}`);
            md =list[0];
        }else{
            md = await this.pageEditInit(pageEdits,page);
        }
//        global.debug(md);
        for(let col of pageEdits){
            if (!col.c_editable || col.c_column === "id" ) {  continue; }
            if (col.c_type === "hidden" && col.c_column!=="c_city" && col.c_column!=="c_province") {
                html.push(`<input name="${col.c_column}" type="hidden" value="${md[col.c_column]}" />`);
                continue;
            }
            let colValue = md[col.c_column];
            col.c_format = col.c_format.trim();
            if(col.c_type !== "hidden"){
                html.push(`<tr><td> <label class="control-label x85">${col.c_name}: </label>`);
            }

            if (col.c_type === "datetime") {
                html.push(`<input type="text" name="${col.c_column}" value="${think.datetime(colValue,col.c_format)}"
                    ${col.c_type === "readonly" ? "disabled":""} data-toggle="datepicker" data-pattern="${think.isEmpty(col.c_format) ? 'yyyy-MM-dd':col.c_format}" data-rule="required;date" size="15" />`);
            } else if (col.c_type === "select" || col.c_type === "selectBlank" || col.c_type === "readonlyReplace") {
                html.push(`<select name="${col.c_column}" data-toggle="selectpicker" ${col.c_isrequired ? "data-rule=required" : ""}>`);
                col.c_default = colValue;
                html.push(await this.getOptions(col));
                html.push('</select>');
            } else if (col.c_type === "textarea") {
                html.push(`<textarea name="${col.c_column}" data-toggle="autoheight" cols="${col.c_width}" rows="1"  ${col.c_isrequired ? "data-rule=required" : ""}>${colValue}</textarea>`);
            } else if (col.c_type === "lookup") {
                html.push(`<input name="${col.c_column}" type="lookup" size="${col.c_width}" value="${colValue}"   ${col.c_isrequired ? "data-rule=required" : ""}
                    data-width="800" data-height="600" data-toggle="lookup" data-title="${col.c_name} 选择" data-url="${this.getReplaceToSpecialChar(col.c_memo,page)}" readonly="readonly" />`);
            }else if (col.c_type == "areaSelect"){
                html.push(`<select name="c_province" data-toggle="selectpicker"  data-nextselect="#city${page.c_modulename}" data-refurl="/cmpage/common/get_citys?province={value}" >`);
                html.push(await this.model('cmpage/area').getProvinceItems(md['c_province'],true));
                if(col.c_column ==='c_country'){
                    html.push(`</select> <select name="c_city" id="city${page.c_modulename}" data-toggle="selectpicker" data-nextselect="#country${page.c_modulename}"
                        data-refurl="/cmpage/common/get_countrys?city={value}" >`);
                    html.push(await this.model('cmpage/area').getCityItems(md['c_city'],true));
                    html.push(`</select> <select name="c_country" id="country${page.c_modulename}" data-toggle="selectpicker" data-rule="required" >`);
                    html.push(await this.model('cmpage/area').getCountryItems(md['c_country'],true));
                }else if(col.c_column === 'c_city'){
                    html.push(`</select> <select name="c_city" id="city${page.c_modulename}" data-toggle="selectpicker" data-nextselect="#country${page.c_modulename}" >`);
                    html.push(await this.model('cmpage/area').getCityItems(md['c_city'],true));
                }
                html.push('</select>');
            } else if(col.c_type === "kindeditor"){
                html.push(`<div style="display: inline-block; vertical-align: middle;"> <textarea name="${col.c_column}" style="width: 960px;height:640;"
            data-toggle="kindeditor" data-minheight="460"> ${colValue}  </textarea> </div>`);
            } else if (col.c_type == "checkbox") {
                html.push(`<input type="checkbox" name="${col.c_column}" data-toggle="icheck" value="1" data-label="${col.c_memo}"  ${colValue == "1" ? "checked" : ""} />`);
            }else if (col.c_type === "readonly") {
                html.push(`<input name="${col.c_column}" type="text" size="${col.c_width}" value="${colValue}"  readonly="readonly"  />`); // style=background-color:#fde5d4;
            }else if(col.c_column !=='c_province' && col.c_column !=='c_city'){
                html.push(`<input name="${col.c_column}" type="${col.c_type}" size="${col.c_width}" value="${colValue}"
                    ${col.c_isrequired ? "data-rule=required;" + col.c_memo : (think.isEmpty(col.c_memo) ? "" : "data-rule=" + col.c_memo)}  />`);
            }
            if (col.c_type !== "areaSelect"){
                html.push(col.c_suffix);
            }
            html.push('</td></tr>');
        }
        return html.join(' ');
    }

    /**
     * 编辑页面保存,
     * 如果是多个表的视图，则根据存在于page.c_table中的列更新表，一般需要在子类中继承
     */
    async pageSave(page,parms){
        let model =this.model('module',{},'cmpage');
        //page.parmsUrl = parms.parmsUrl;
        //page.editID = prams.id;
        let pageEdits = await model.getModuleEdit(page.id);
        //let colList = await model.getAllColumns(page.c_table);
        let md = {};
        for(let edit of pageEdits){
            if(edit.c_editable && edit.c_column.indexOf('c_')===0 ) {      //&& this.isExistColumn(edit.c_column,colList)
                if(edit.c_type === 'checkbox'){
                    md[edit.c_column] = think.isEmpty(parms[edit.c_column]) ? false : parms[edit.c_column];
                }else{
                    md[edit.c_column] = parms[edit.c_column];
                }
            }
        }
        //global.debug(JSON.stringify(md));
        if(parms.id == 0){
            //let id = await this.query(global.getInsertSql(md,page.c_table) +' returning id;');
            md.id = await this.model(page.c_table).add(md);
        }else {
            await this.model(page.c_table).where({id:parseInt(parms.id)}).update(md);
            //await this.query(global.getUpdateSql(md,page.c_table));
        }
        return md.id;
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
    getReplaceToSpecialChar(memo,page){
        //let ret = memo.split('*').join('\&').split(/##/).join("\'");
        let parms = memo.split('*');
        if(parms.length >1){
            for(let parm of parms){
                if(parm.indexOf('[[')==0){      // [[ 开头表示从parmsUrl中取值
                    let key =parm.substr(2,parm.length -2).trim();
                    let parmsUrl = JSON.parse(page.parmsUrl);
                    let val = parmsUrl[`${key}`];
                    parms[parms.indexOf(parm)] = `${key}=${val}`;
                    //console.log(parms);
                }
            }
        }
        //let ret = memo.replace(/\*/ig,'\&').replace(/##/ig,"\'");
        return parms.join('\&').split(/##/).join("\'");;
    }

    /**
   * 取查看页面的设置，组合成列表数据的HTML输出
   */
  async htmlGetView(page) {
    let html = [];
    //let pageEdits = await think.cache(`moduleEdit${page.id}`);
    let pageCols = await this.model('module',{},'cmpage').getModuleCol(page.id);
    if(page.viewID <=0){
      return '<tr><td>----</td><td>----</td><td>----</td><td>该数据不存在！</td><td>----</td><td>----</td><td>----</td></tr>';
    }
    let list = await this.query(`select ${this.getListFields(pageCols)} from ${page.c_datasource} where id=${page.viewID}`);
    let md =list[0];
    //global.debug(md);
    for(let col of pageCols){
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
        html.push(think.datetime(md[col.c_column]));
      } else if(col.c_coltype === "date") {
        html.push(think.datetime(md[col.c_column],'YYYY-MM-DD'));
      } else  {
        html.push(md[col.c_column]);
      }
      html.push('</td></tr>');
    }
    return html.join(' ');
  }
}
