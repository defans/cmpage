'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


 //  微信的URL接口, 待定

const Base = require('./base.js');

const DEFULT_AUTO_REPLY = '功能正在开发中~';

module.exports = class extends Base {

    /**
     * index action
     * @return {Promise} []
     */
    async showAction(){
        let vb={};
        let moduleApp = cmpage.service("cmpage/module");

        let parms ={};
        parms.modulename =this.get('modulename');
        if(parms.modulename.length >20){
            return this.json({statusCode:'300',message:parms.modulename + " 模块名错误！"});
        }
        let md = await moduleApp.getModuleByName(parms.modulename);
        Object.assign(parms,md);
        parms.parmsUrl = this.get();
        parms.query = this.get();
        parms.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(parms.id)){
            return this.json({statusCode:'300',message:parms.modulename + " 模块不存在！"});
        }

        let pageModel = cmpage.service(parms.c_path);
        if(think.isEmpty(pageModel)){
            return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
        }
        await pageModel.initPage();
        debug(parms.query,'cmpage.C.hh - parms.query');
        //cmpage.debug(parms);
        pageModel.mod = parms;
        pageModel.modQuerys = await moduleApp.getModuleQuery(parms.id);
        pageModel.modBtns = await moduleApp.getModuleBtn(parms.id);

        vb.queryHtml = await pageModel.mobHtmlGetQuery();
        vb.btnsHtml = await pageModel.hhGetHeaderBtns(); 
        this.assign('vb',vb);

        return this.display();
    }

    async indexAction(){
        let user = await this.session('user');
         //console.log(user);
        let menuList = await cmpage.service('admin/privilege').userGetPrivilegeTree(user.id,user.c_role, 1254);
        let html = [];
        let navs = [];
        for (const nav of menuList) {
            if(nav.c_pid === 1254 && nav.isAllow){
                navs.push(nav);
            }
        }
        for(let nav of navs){
            html.push(`<div class="mui-card"> <div class="mui-card-header">${nav.c_name}</div> <div class="mui-card-content"> <ul class="mui-table-view mui-grid-view mui-grid-9">`);
            for (const menu of menuList) {
                if(menu.c_pid === nav.id && menu.c_type === 'M' && menu.isAllow){
                    html.push(`<li class="mui-table-view-cell mui-media mui-col-xs-4 mui-col-sm-4"><a href = "${menu.c_desc}" > 
                        <span class="mui-icon mui-icon-chatboxes mui-active"></span> </a><div class="mui-media-body">${menu.c_name}</li>`);
                }
            }
            html.push('</div>  </div>');
        }

        this.assign('menuHtml',html);
        return this.display();    
    }    


    async editAction(){
        let module = cmpage.service('cmpage/module');
        let parms = await module.getModuleByName(this.get('modulename'));
        parms.parmsUrl = this.get();
        parms.editID = this.get("id") || this.get('c_id');
        //console.log(page);
        parms.user = await this.session('user');
        let pageModel = cmpage.service(parms.c_path);
        if(think.isEmpty(pageModel)){
            return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
        }
        await pageModel.initPage();
        //cmpage.debug(parms);
        pageModel.mod = parms;
        pageModel.modEdits = await module.getModuleEdit(parms.id);

        let editHtml =await pageModel.mobHtmlGetEdit();
        this.assign('parms',parms);
        this.assign('editHtml',editHtml);
        this.assign('btnHtml',await pageModel.htmlGetEditBtns());

        return this.display();
    }

    //不验证登陆
    async __before(){
      //部分 action 下不检查,
    }
}
