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
 * 实现了查找带回的功能，可继承本类做定制化的查找带回页面，调用： /cmpage/page/lookup?modulename=XXX*multiselect=false
 * @class cmpage.model.page_lookup
 */
import CMPage from './page.js';

export default class extends CMPage {

    /**
     * 是否显示列表中的按钮，子类中重写本方法可以改变按钮显示的逻辑
     * @method  isShowRowBtns
     * @return {boolean} 是否显示
     * @param   {object} page 页面按钮的设置
     */
    isShowRowBtns(pageBtns){
        return true;
    }

    /**
     * 取列表中按钮的设置，组合成HTML输出,<br/> 重写父类的方法，子类中也可重写本方法，更改返回的字段和值等
     * @method  htmlGetBtnList
     * @return  {string}  HTML片段
     * @param   {object} rec 每行的记录对象
     * @param   {object} page 页面对象，包括前端传过来的参数和当前的用户信息等
     * @param   {object} pageBtns 按钮设置
     */
    async htmlGetBtnList(rec,page,pageBtns){
        let html=[];
        let fields= [];
        if(!think.isEmpty(page.returnFields)){
            fields = page.returnFields.split(',');
        }
        let pageCols = await global.model('cmpage/module').getModuleCol(page.id);
        for(let col of pageCols){
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
        //global.debug(html.join(','));
        return ` <a href="javascript:;" data-toggle="lookupback" data-args="{${html.join(',')}}" class="btn btn-blue" title="选择本项" data-icon="check">选择</a>`;
        }

    /**
     * 顶部按钮不需要显示，<br/> 重写父类的方法，子类中也可重写本方法，增加其他按钮
     * @method  htmlGetBtnHeader
     * @return {string}  HTML片段
     * @param   {object} page 页面对象，包括前端传过来的参数和当前的用户信息等
     */
    async htmlGetBtnHeader(page){
        return ' ';
    }
}