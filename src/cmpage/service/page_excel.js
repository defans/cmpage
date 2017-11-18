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
 * 实现了excel导出等处理，可继承本类做定制化的excel文件导出
 * @class cmpage.service.page_excel
 */
var nodeExcel = require('excel-export');

module.exports = class extends think.Model {

    /**
     * 根据查询结果集和模块的列设置把数据导出成excel文件
     * @method  excelExport
     * @return {object}  excel文件格式的对象
     * @param   {object} list  结果记录集对象
     * @param   {object} modCols 页面显示列设置
     */
    async excelExport(list,modCols) {
        let conf = {};
        conf.stylesXmlFile = think.ROOT_PATH + "/www/static/css/excel_styles.xml";
        //设置每列的属性
        conf.cols = [];
        for(let col of modCols){
            if (col.c_isshow) {
                conf.cols.push(this.getColStyle(col));
            }
        }
        conf.rows = [];
        for(let rec of list.data){
            let row = [];
            for(let col of modCols){
                if(col.c_isshow && col.c_column !=='id'){
                    row.push(await this.getColData(rec,col))
                }
            }
            conf.rows.push(row);
        }

        return nodeExcel.execute(conf);
    }

    /**
     * 根据业务模块显示列的设置信息得到某一列的excel样式
     * @method  getColStyle
     * @return {object}  excel列的样式对象
     * @param   {object} col  业务模块显示列的设置,某个字段
     */
    getColStyle(col){
        let ret = {};
        if(['decimal','int4','integer','float'].indexOf(col.c_coltype) !== -1){
            ret = {caption:col.c_name, type:'number'};
        }else {
            ret = {caption:col.c_name, type:'string'};
        }
        return ret;
    }

    /**
     * 根据业务模块显示列的设置信息得到某一行某一列的值，子类中重写本方法，可以定制输出值
     * @method  getColData
     * @return {object}  excel列的样式对象
     * @param   {object} item  记录对象，一条
     * @param   {object} col  业务模块显示列的设置,某个字段
     */
    async getColData(item,col){
        if (!think.isEmpty(col.c_format) && col.c_coltype === "decimal") {
            return cmpage.formatNumber(item[col.c_column], {pattern: col.c_format});
        } else if (col.c_type === "checkbox") {
            return item[col.c_column] ? "是" : "否";
        } else if (col.c_type === "replace" && !(/^select/.test(col.c_memo))) {
            return await this.model('page').getReplaceText(item[col.c_column], col.c_memo);
        } else {
            if (!think.isEmpty(col.c_column)) {
                if(col.c_coltype === "timestamp") {
                    return think.datetime(item[col.c_column]);
                } else if(col.c_coltype === "date") {
                    return think.datetime(item[col.c_column],"YYYY-MM-DD");
                } else  {
                    return item[col.c_column];
                }
            }
        }
    }
}
