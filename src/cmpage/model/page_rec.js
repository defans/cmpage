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
import CMPage from './page.js';

export default class extends CMPage {
    /**
     * 取列表中按钮的设置，组合成HTML输出
     */
    async htmlGetBtnList(rec){
      let html=[];
      for(let col of this.modCols){
        if (col.c_isview) {
          html.push(`${col.c_column}:'${rec[col.c_column]}'`);
        }
      }
        //global.debug(html.join(','));
      return ` <a href="javascript:;" data-toggle="lookupback" data-args="{${html.join(',')}}" class="btn btn-blue" title="选择本项" data-icon="check">选择</a>`;
    }

    htmlGetTabs(){
        let tabs = this.mod.c_module_rec.split(',');
        let html =[];
        html.push( `    <div id="rec${this.mod.c_modulename}Div" >
            <fieldset>
            <legend>-</legend>
            <ul class="nav nav-tabs" role="tablist">`);

        for(let tab of tabs){
            let rec = tab.split(':');           //如： DocuArriveRec:物料明细:c_docu
            let i = tabs.indexOf(tab);
            html.push(`<li ${ i===0 ? "class=active":""}><a href="#rec${this.mod.c_modulename}List${i}" role="tab" data-toggle="tab">${rec[1]}</a></li>`);
        }

        html.push(`</ul> <!-- Tab panes --> <div class="tab-content">`);

        for(let tab of tabs){
            let rec = tab.split(':');
            let i = tabs.indexOf(tab);
            html.push(`<div class="tab-pane fade ${i ==0 ? "active in":""}" id="rec${this.mod.c_modulename}List${i}"  name="rec${this.mod.c_modulename}List${i}"
                dataurl="/cmpage/page/list?modulename=${rec[0]}&${rec[2]}=${this.mod.editID}&page_rec_view_flag=false" >  </div>`);
        }

        html.push('</div>   </fieldset>   </div>');

        return html.join(' ');
    }

    htmlGetJS() {
        let tabs = this.mod.c_module_rec.split(',');
        html = [];
        html.push(` <script type="text/javascript">
         function rec${this.mod.c_modulename}Appr_onClick(flowID,action){
            $(this).alertmsg("confirm", "是否确定要"+action+"？",{
                okCall:function(){
                    $.ajax({
                        type: "POST",
                        url: "/cmpage/page/edit_rec_appr",
                        data: "docuID=${this.mod.editID}&flowID="+flowID +"&note="+$("#${this.mod.c_modulename}_c_note").val()
                        +"&tableName=${this.mod.c_table}&parms=${this.mod.parmsUrl}"+"&moduleName=${this.mod.c_modulename}",
                        async: false,
                        success: function (data) {
                            var ret =eval("("+data+")");
                            $(this).alertmsg(ret.statusCode=="200" ? "info":"error",ret.message);
                            if(ret.statusCode=="200")
                            {
                                $.CurrentNavtab.navtab('reload', { })
                            }
                        }
                    });
                }
            });

            return false;
        } </script>`);

        html.push(`<script type="text/javascript">
        function rec${this.mod.c_modulename}Save_onClick(){
            $.ajax({
                type: "POST",
                url: "/cmpage/page/save",
                data: $("#rec${this.mod.c_modulename}Form").serialize(),
                async: false,
                success: function (data) {
                    var ret =eval("("+data+")");
                    $(this).alertmsg((ret.statusCode=="200" ? "info":"error"),ret.message);
                    if(ret.statusCode=="200")
                    {
                        if(ret.newID >0)
                        {
                            $("#rec${this.mod.c_modulename}ID").val(ret.newID);
                            $.CurrentNavtab.navtab('reload', { url:"/cmpage/page/edit_rec?modulename=${this.mod.c_modulename}&id="+ret.newID, type:"GET", onLoad:"rec${this.mod.c_modulename}List_load2"})
                        }
                    }
                }
            });
        } </script>`);

        html.push(`<script type="text/javascript">
            function rec${this.mod.c_modulename}List_load2(){
                var id = $("#rec${this.mod.c_modulename}ID").val();
                `);

        for(let tab of tabs){
            let rec = tab.split(':');           //如： DocuArriveRec:物料明细:c_docu
            let i = tabs.indexOf(tab);
            html.push(`$(this).bjuiajax('doLoad', {target:$("#rec${this.mod.c_modulename}List${i}"), url:"/cmpage/page/list?modulename=${rec[0]}&${rec[2]}=${this.mod.editID}&page_rec_view_flag=false" });`);
        }

        html.push('}</script>');
        return html.join(' ');
    }
}
