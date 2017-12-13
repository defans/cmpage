'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.service
 */

/**
 * 实现了文件列表页面的功能，定制了移动端的页面
 * @class cmpage.service.file_list
 */
const CMPage = require('../cmpage/page.js');

module.exports = class extends CMPage {

    /**
     * 取模块列表中的MUI设置，组合成HTML输出，一般在子类中通过重写这个方法来达到页面定制的效果
     * @method  mobHtmlGetList
     * @return  {string}  HTML片段
     */
    async mobHtmlGetList() {
        let html = [];

        this.mobGetPageMuiSetting();
        await this.getDataList();
        html.push('<div class="mui-content-padded">');
        for (let row of this.list.data) {
            //处理替换值
            for (let col of this.modCols) {
                if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
                    row[col.c_column] = await this.getReplaceText(row[col.c_column], col.c_memo);
                } else if (col.c_coltype === 'timestamp') {
                    row[col.c_column] = think.datetime(row[col.c_column]);
                }
                if (col.c_column === 'c_path') {
                    row[col.c_column] = '#domainName#' + row[col.c_column];
                }
            }
            html.push(`<p>${row.c_name}</p>`);
            if (!think.isEmpty(row.c_memo)) html.push(`<p>${row.c_name}</p>`);
            if (cmpage.isImageFile(row.c_path)) {
                html.push(`<p><img style="width: 100%;" src="${row.c_path}" data-preview-src="" data-preview-group="1" /></p>`);
            } else {
                html.push(`<p><a href="${row.c_path}" />下载请至电脑端</a></p>`)
            }
        }

        return html.join(' ');
    }

    async mobHtmlGetHeaderBtns() {
        //不用输出头部按钮，手机端自己设置
        return ['', '']
    }

}