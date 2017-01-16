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
 * 实现了查找带回的功能，可继承本类做定制化的查找带回页面，调用： /cmpage/page/lookup?modulename=xxx*multiselect=0 </br>
 * 实现了选择加入的功能，可继承本类做定制化的选择加入页面，调用： /cmpage/page/lookup?modulename=xxx*selectadd=1*key=c_id*callmodel=docu/docu_rec*callfn=goodsAdd*callparms=xxx,
 * 其中key是需要回传的字段名称，callmodel是回调的thinkjs模块，callfn 是回调的函数名称, callparms 是额外的参数，例如：单据主ID等 </br>
 * @class cmpage.model.page_lookup
 */
import CMPage from './page_mob.js';

export default class extends CMPage {

    /**
     * 是否显示列表中的按钮，子类中重写本方法可以改变按钮显示的逻辑
     * @method  isShowRowBtns
     * @return {boolean} 是否显示
     * @param   {object} page 页面按钮的设置
     */
    isShowBtns(rec,btn){
        return true;
    }

    /**
     * 取列表中按钮的设置，组合成HTML输出,<br/>
     * 重写父类的方法，子类中也可重写本方法，更改返回的字段和值等
     * @method  htmlGetBtnList
     * @return  {string}  HTML片段
     * @param   {object} rec 每行的记录对象
     */
    async htmlGetBtnList(rec){
        let ret ='';
        if(think.isEmpty(this.mod.parmsUrl.callmodulename)){
            let html =await this.getLookupResult(rec);
            ret= ` <a href="javascript:;" data-toggle="lookupback" data-args="{${html.join(',')}}" class="btn btn-blue" title="选择本项" data-icon="check">选择</a>`;
        }else{
            let value = 0;
            for(let col of this.modCols){
                if (col.c_isview && col.c_desc == this.pk) {
                    value = rec[col.c_column];
                    break;
                }
            }
            if(value >0){
                let parms = think.isEmpty(this.mod.parmsUrl.callparms) ? value : `${value},${this.mod.parmsUrl.callparms}`;
                ret = ` <a href="javascript:;" onclick="return pageSelectAdd(this,'${this.mod.parmsUrl.callmodulename}','${this.mod.parmsUrl.callfn}','${parms}');"
                    class="btn btn-blue" title="选择加入" data-icon="check">加入</a>`;
            }
        }
        return ret;
    }
    /**
     * 取查找带回页面中选择行的返回字段及值
     * @method  getLookupResult
     * @return  {Array}  返回字段组成的数组
     * @param   {object} rec 每行的记录对象
     */
    async getLookupResult(rec){
        let html=[];
        let fields= [];
        if(think.isString(this.mod.parmsUrl))  this.mod.parmsUrl = JSON.parse(this.mod.parmsUrl);
        //console.log(this.mod);
        //cmpage.debug(this.mod,'page_lookup.htmlGetBtnList - this.mob');
        if(!think.isEmpty(this.mod.parmsUrl['returnFields'])){
            fields = String(this.mod.parmsUrl['returnFields']).split(',');
        }
        cmpage.debug(fields,'page_lookup.htmlGetBtnList - fields');
        for(let col of this.modCols){
            if (col.c_isview) {
                if(fields.length >0){
                    for(let field of fields){
                        if(field === col.c_column){
                            html.push(`${col.c_column}:'${rec[col.c_column]}'`);
                            break;
                        }
                    }
                }else{
                    html.push(`${col.c_column}:'${rec[col.c_column]}'`);
                }
            }
        }
        //debug(html.join(','),'page_lookup.getLookupResult - data-args');
        return html;
    }

    /**
     * 顶部按钮不需要显示，<br/> 重写父类的方法，子类中也可重写本方法，增加其他按钮
     * @method  htmlGetBtnHeader
     * @return {string}  HTML片段
     * @param   {object} page 页面对象，包括前端传过来的参数和当前的用户信息等
     */
    async htmlGetBtnHeader(){
        if(think.isEmpty(this.mod.parmsUrl.callmodulename)) {
            let html = [];
            for(let col of this.modCols){
                if (col.c_isview) {
                    html.push(`${col.c_column}:'${col.c_coltype === 'int' ? 0 : ' '}'`);
                }
            }
            return `<a href="javascript:;" data-toggle="lookupback" data-args="{${html.join(',')}}" class="btn btn-orange" title="清除所选" data-icon="eraser">清除</a>`;
        }
        return '';
    }

    /**
     * 取模块列表中的MUI设置，组合成HTML输出，一般在子类中通过重写这个方法来达到页面定制的效果
     * @method  mobHtmlGetList
     * @return  {string}  HTML片段
     */
    async mobHtmlGetList() {
        let html = [];

        this.mobGetPageMuiSetting();
        await this.getDataList();
        for(let row of this.list.data){
            //处理替换值
            for(let col of this.modCols){
                if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                    row[col.c_column] = await this.getReplaceText(row[col.c_column], col.c_memo);
                }else if(col.c_coltype === 'timestamp'){
                    row[col.c_column] = think.datetime(row[col.c_column]);
                }
            }
            html.push('<li class="mui-table-view-cell mui-media">');

            //加入按钮组
            //html.push(await this.mobHtmlGetListBtns(row));
            let btn =await this.getLookupResult(row);
            btn = `{${btn.join(',')}}`;
            //debug(btn,'page_lookup.mobHtmlGetListBtns - btn');

            //组合生成列表每项的内容
            html.push(`<a class='mui-slider-handle list-item cmpage-lookup-back'  href='aaa.html' data-result='${JSON.stringify(cmpage.objFromString(btn))}' >`);
            html.push(await this.mobHtmlGetListRow(row));
            html.push('</a> </li>');
        }

        return html.join(' ');
    }

    async mobHtmlGetHeaderBtns() {
        let html =`<a href="cmpage-search.html" class="mui-icon mui-icon-search mui-pull-right cmpage-btn-search"></a>
        <h1 id="title" class="mui-title">${this.mod.c_alias}</h1>`;

        let btn = {};
        for(let col of this.modCols){
            if (col.c_isview) {
                btn[col.c_column] = col.c_coltype === 'int' ? 0 : ' ';
            }
        }
        //debug(btn,'page_lookup.mobHtmlGetHeaderBtns - btn');

        html += `<a class='mui-icon mui-icon-minus mui-pull-left cmpage-lookup-back'  href='aaa.html'
            data-result='${JSON.stringify(btn) }' ></a>`;

        //debug(html,'page_lookup.mobHtmlGetHeaderBtns - html');
        return [`${html} </div>`, ' '];
    }

}
