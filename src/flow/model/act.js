'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

import CMPage from '../../cmpage/model/page_mob.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        return where +' and c_status<>-1';
    }

    ///**
    // * 初始化编辑页面的值
    // */
    //async pageEditInit(pageEdits,page){
    //    let md = await super.pageEditInit(pageEdits,page);
    //    md.c_time_to = '2200-01-01 00:00:00';   //默认的截止日期
    //
    //    return md;
    //}

    ///**
    // * 编辑页面保存,
    // * 如果是多个表的视图，则根据存在于page.c_table中的列更新表，一般需要在子类中继承
    // */
    //async pageSave(page,parms){
    //    let md = super.pageSave(page,parms);
    //    if(parms.id ==0 ){
    //        //根据模板的类型自动生成活动节点
    //        await this.initActs(md);
    //    }
    //
    //}
    /**
     * 根据模板的类型自动生成活动节点
     */
    async initActs(proc){

    }

    ///**
    // * 列表查询的页面片段
    // */
    //async htmlGetQuery(page){
    //}
    //
    ///**
    // * 其他页面片段，可以加入额外的HTML，如按钮、DIV等
    // */
    //async htmlGetOther(page){
    //    return ``;
    //}
    //
    ///**
    // * 下拉框的选择集,isBlank:是否可以为空, md.c_default为默认值
    // */
    //async getOptions(md, isBlank){
    //
    //}
    //
    ///**
    // * 取设置的替换值
    // * replaceItems:
    // * 1) code_XXXXX
    // * 2) [{##value##:true,##text##:##男##},{##value##:false,##text##:##女##}]
    // */
    //async getReplaceText(value,replaceItems){
    //
    //}
    //
    ///**
    // * 取顶部按钮的设置，组合成列表头的HTML输出
    // */
    //async htmlGetBtnHeader(page){
    //
    //}
    //
    ///**
    // * 取列表中按钮的设置，组合成HTML输出
    // */
    //async htmlGetBtnList(rec,page,pageBtns){
    //
    //}
    //
    ///**
    // * 取分页列表项的设置，组合成列表数据的HTML输出
    // */
    //async htmlGetList(page,dataList) {
    //
    //}
    ///**
    // * 取数据列表
    // */
    //async getDataList(page){
    //
    //}
    //
    ///**
    // * 取得页面显示列表返回字段设置
    // */
    //getListFields(pageCols){
    //
    //}
    //
    ///**
    // * 取编辑页面的设置，组合成列表数据的HTML输出
    // */
    //async htmlGetEdit(page) {
    //
    //}

    //
    ///**
    // * 保存后的操作日志记录,，通过重写可在子类中定制日志的格式
    // */
    //async pageSaveLog(page,parms,md,pageEdits,flag){
    //
    //}
    //
    ////替换备注设置中的特殊字符,需要组成SQL
    //getReplaceToSpecialChar(memo,page){
    //
    //}
    //
    ///**
    // * 取查看页面的设置，组合成列表数据的HTML输出
    // */
    //async htmlGetView(page) {
    //
    //}

    /**********************以下是 mob页面的几个方法，需要从 cmpage/page_mob 继承 ********************************************************/
    ///**
    // * 取模块列表中的MUI设置，组合成HTML输出，一般在子类中通过重写这个方法来达到页面定制的效果
    // */
    //async mobHtmlGetList(page,dataList) {
    //
    //}
    //
    ///**
    // * 生成列表每一行的按钮组
    // */
    //async mobHtmlGetListBtns(row,pageBtns,page) {
    //
    //}
    //
    ///**
    // * 取模块的MUI设置
    // */
    //getPageMuiSetting(page){
    //
    //}
    //
    ///**
    // * 生成列表每一行的内容
    // */
    //async mobHtmlGetListRow(row,pageCols) {
    //
    //}
    //
    ///**
    // * 生成查询页面
    // */
    //async mobHtmlGetQuery(page){
    //
    //}
    //
    ///**
    // * 生成APP端编辑页面
    // */
    //async mobHtmlGetEdit(page) {
    //
    //}

}
