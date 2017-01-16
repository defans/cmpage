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
import CMPage from './page_mob.js';

export default class extends CMPage {

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
        html.push(`<li "class=active"><a href="#page${tab.modulename}" role="tab" data-toggle="tab">${tab.title}</a></li>`);

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


}
