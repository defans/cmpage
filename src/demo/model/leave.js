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

    /**
     * 新增的时候，初始化编辑页面的值，子类重写本方法可以定制新增页面的初始值
     * @method  pageEditInit
     * @return {object} 新增的记录对象
     * @param   {object} pageEdits 业务模块的编辑列设置
     * @param   {object} page 页面对象，包括前端传过来的参数和当前的用户信息等
     */
    async pageEditInit(pageEdits,page){
        let md =await super.pageEditInit(pageEdits,page);
        let parmsUrl =JSON.parse(page.parmsUrl);
        md.c_user = page.user.id;
        md.c_status = 1192;     //系统参数 -- 工作流参数 -- 业务模块状态 -- 请假状态 -- 待申请
        //c_task 是通过URL参数传过来的，也就是说已经启动了新的流程实例，本新增页面是由流程来调用的
        //当然也可以用常规的‘新增’页面，保存的时候判断如果没有启动流程实例，则启动新的实例，不过这个需要修改流程模板了
        md.c_task = parmsUrl.c_task;

        return md
    }

    /**
     * 删除记录,<br/>
     * @method  pageDelete
     * @return {object} 记录对象
     * @param  {object} page 页面对象，包括前端传过来的参数和当前的用户信息等
     */
    async pageDelete(page){
        let ret={statusCode:200,message:'删除成功！',data:{}};

        let model = this.model(page.c_table);
        let md = await model.where({id:page.id}).find();
        //删除相应的工作流任务
        await this.query(`update fw_task set c_status=-1 where id=${md.c_task}`);
        await model.where({id: page.id}).update({c_status:-1});

        return ret;
    }

    ///**
    // * 生成列表每一行的内容
    // */
    //async mobHtmlGetListRow(row,pageCols) {
    //    return `<h5 style='color:black;font-weight:bold;'>${row["c_name"]} (${row["c_phone"]} / ${row["c_type"]})</h5>
    //            <p>职业：${row["c_occupation"]} / 购买意向：<label style="color:orange">${row["c_buy_type"]}</label> </p>
    //            <p style='color:#005094;'>地址：${row["c_address"]} / ${row["c_time"].substr(0,10)} </p>`;
    //}

    async isApprLevel3(){
        return true;
    }

}
