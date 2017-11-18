'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * page_rec model 实现主从表页面的编辑和查看
 */
const CMPage = require('./page_mob.js');

module.exports = class extends CMPage {

    htmlGetTabs(){
        //debug(this.mod,'page_ms.htmlGetTabs - this.mod');
        if(this.mod.editID ==0 || think.isEmpty(this.mod.c_module_slave.modulename))  return '';
        let html =[];
        html.push( `    <div id="rec${this.mod.c_modulename}Div" >
            <fieldset>
            <legend>-</legend>
            <ul class="nav nav-tabs" role="tablist">`);

        // for(let tab of this.mod.c_module_slave){
        //     html.push(`<li ${ tabs.indexOf(tab) ===0 ? "class=active":""}><a href="#page${tab.modulename}" role="tab" data-toggle="tab">${tab.title}</a></li>`);
        // }
        //暂时考虑一个TAB的情况
        let tab = this.mod.c_module_slave;
        debug(tab,'page_ms.htmlGetTabs - tab');
        html.push(`<li class="active"><a href="#page${tab.modulename}" role="tab" data-toggle="tab">${tab.title}</a></li>`);

        html.push(`</ul> <!-- Tab panes --> <div class="tab-content">`);

        // for(let tab of this.mod.c_module_slave){
        //     html.push(`<div class="tab-pane fade ${tabs.indexOf(tab) ==0 ? "active in":""}" id="page${tab.modulename}"  name="page${tab.modulename}"
        //         data-url="/cmpage/page/list?modulename=${tab.modulename}&${tab.key}=${this.mod.editID}&moduleOpen=div${think.isEmpty(this.mod.parmsUrl.readonly) ? '':'&readonly=1'}"
        //         data-toggle="autoajaxload">  </div>`);
        // }
        html.push(`<div class="tab-pane fade active in" id="page${tab.modulename}"  name="page${tab.modulename}"
            data-url="/cmpage/page/list?modulename=${tab.modulename}&${tab.key}=${this.mod.editID}&moduleOpen=div${think.isEmpty(this.mod.parmsUrl.readonly) ? '':'&readonly=1'}"
            data-toggle="autoajaxload">  </div>`);

        html.push('</div>   </fieldset>   </div>');
        //debug(html,'page_ms.htmlGetTabs - html');
        return html.join(' ');
    }

    /**
     * 取结果数据集，子类中重写本方法可以增加逻辑如：对结果集做进一步的数据处理等
     * @method  getDataList
     * @return {object} 结果集数据包 {count:xxx, list:[{record}]}
     */
    async getDataList(){
        await super.getDataList();
        this.list.ids = [];     //主从表编辑页面不需要 上一条，下一条按钮
    }



    /**
     * 取查看页面的设置，组合成打印页面的HTML输出
     * @method  htmlGetPrint
     * @return {string} HTML页面片段
     */
      async htmlGetPrint() {
          let html = [];
          //主表部分
          html.push(await super.htmlGetPrint());
          if(this.mod.editID ==0 || think.isEmpty(this.mod.c_module_slave.modulename)){
              return html.join('');
          }
          //子表部分
          let module = await cmpage.service("cmpage/module");
          let md = await module.getModuleByName(this.mod.c_module_slave.modulename);
          debug(md,'page_ms.htmlGetPrint - md');
          if(think.isEmpty(md.id))  return html.join('');
          let pageModel = cmpage.service(md.c_path);
          if(think.isEmpty(pageModel['htmlGetQuery']))  return html.join('');
          pageModel.mod = md;
          pageModel.mod.user = this.mod.user;
          pageModel.mod.c_pager = false;    //单页
          pageModel.mod.parmsUrl = {modulename:this.mod.c_module_slave.module};
          pageModel.mod.parmsUrl[this.mod.c_module_slave.key]=this.mod.editID;
          await pageModel.initPage();
          pageModel.modQuerys = await module.getModuleQuery(md.id);
          pageModel.modCols = await module.getModuleCol(md.id);
          await pageModel.getDataList();
          html.push('<table class="printTable" style="BORDER-COLLAPSE:collapse; margin-top:-1px;" bordercolor="#000000" cellSpacing=0 width="100%" align="center" bgcolor="#FFFFFF" border="1">');
          //标题
          for(let col of pageModel.modCols){
              if(col.c_isview)  html.push(`<td class="td4">${col.c_name}</td>`);
          }
          //数据行
          for(let item of pageModel.list.data){
              html.push('<tr>');
              for(let col of pageModel.modCols){
                  if(col.c_isview){
                      html.push(`<td style="${col.c_style}" >`);
                      if (item[pageModel.pk] !== 0 ) {
                          if (!think.isEmpty(col.c_format)) {
                              if (col.c_coltype === "float") {
                                  html.push(cmpage.formatNumber(Number(item[col.c_column]), {pattern: col.c_format}));
                              } else if(col.c_coltype === "timestamp" || col.c_coltype === "date") {
                                  html.push(cmpage.datetime(item[col.c_column], col.c_format));
                              }
                          } else if (col.c_type === "checkbox") {
                              html.push(`<input type="checkbox"  data-toggle="icheck" value="1" disabled  ${item[col.c_column] || item[col.c_column]===1 ? "checked" : ""} />`);
                          } else if (!think.isEmpty(item[col.c_column]) && col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
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
              html.push('</tr>');
          }
          html.push(await pageModel.htmlGetListSumRow(false));  //合计
          html.push('</table>');

          return html.join('');
      }


}
