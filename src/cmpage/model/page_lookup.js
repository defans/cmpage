'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * lookup model 实现查找带回的功能
 */
import CMPage from './page.js';

export default class extends CMPage {
    /**
     * 取列表中按钮的设置，组合成HTML输出
     */
    async htmlGetBtnList(rec,page,pageBtns){
      let html=[];
      let pageCols = await global.model('cmpage/module').getModuleCol(page.id);
      for(let col of pageCols){
        if (col.c_isview) {
          html.push(`${col.c_column}:'${rec[col.c_column]}'`);
        }
      }
        //global.debug(html.join(','));
      return ` <a href="javascript:;" data-toggle="lookupback" data-args="{${html.join(',')}}" class="btn btn-blue" title="选择本项" data-icon="check">选择</a>`;
    }

    async htmlGetBtnHeader(page){
        return ' ';
    }
}