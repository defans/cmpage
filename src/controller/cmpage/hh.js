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
        string modulename = Request.QueryString["modulename"];
        t_module mod = new Module().GetModel(modulename);
        PageMob app = (PageMob)GetInstanceFromClassName(mod);
        app.InitPage();
        //app._pageMd.parmsUrl = new NameValue(Request.QueryString);
        //app._pageMd.query = new NameValue(Request.QueryString);
        //app._pageMd.pageIndex = 1;
        //app._pageMd.pageSize = 8;

        Module module = new Module();
        //            app._modCols = module.GetModuleColList(app._mod.c_id);
        app._modQuerys = module.GetModuleQueryList(app._mod.c_id);
        app._modBtns = module.GetModuleBtnList(app._mod.c_id, true);

        ViewBag.btnsHtml = app.HHGetHeaderBtns();
        ViewBag.queryHtml = app.MobGetQuery();
        //ViewBag.listHtml = app.MobGetList();
        //ViewBag.count = app._pageMd.totalCount;
        return this.display();
    }

    async indexAction(){
        int rootID = 1254;
        IList<t_code> menus = new UserPrivilege().GetPrivilegeTreeList(CMGlobal.UserID,CMGlobal.RoleID,rootID,"");
        IList<t_code> navs = new List<t_code>();
        foreach (t_code md in menus)
        {
            if (md.c_type == "N" && md.c_pid == rootID)
                navs.Add(md);
        }
        StringBuilder sb = new StringBuilder();
        foreach (t_code nav in navs)
        {
            sb.Append("<div class=\"mui-card\"> <div class=\"mui-card-header\">" + nav.c_name + "</div>" +
                "  <div class=\"mui-card-content\"> <ul class=\"mui-table-view mui-grid-view mui-grid-9\">");
            foreach (t_code menu in menus)
            {
                if(menu.c_pid == nav.c_id && menu.c_type == "M" && menu.isAllow)
                {
                    sb.Append("<li class=\"mui-table-view-cell mui-media mui-col-xs-4 mui-col-sm-3\"><a href = \"" + menu.c_desc +
                        "\" > <span class=\"mui-icon mui-icon-chatboxes mui-active\"></span> </a><div class=\"mui-media-body\">" +
                        menu.c_name + "</li>");
                }
            }
            sb.Append("</div>	</div>");
        }

        ViewBag.menuHtml = sb.ToString();
        return this.display();    
    }    


    async editAction(){
        string modulename = Request.QueryString["modulename"];
        t_module mod = new Module().GetModel(modulename);
        PageMob app = (PageMob)GetInstanceFromClassName(mod);
        app.InitPage();
        app._pageMd.parmsUrl = new NameValue(Request.QueryString);  //URL参数保存
        app._pageMd.query = new NameValue(Request.QueryString);
        app._pageMd.editID = Request.QueryString["id"].ToInt();
        app._pageMd.listIds = "";
        Module module = new Module();
        app._modEdits = module.GetModuleEditList(mod.c_id);

        ViewBag.mod = mod;
        ViewBag.listIds = app._pageMd.listIds;
        ViewBag.parmsUrl = app._pageMd.parmsUrl.ToString(",");
        ViewBag.editID = app._pageMd.editID.ToString();
        ViewBag.editTitleHtml = app.HtmlGetEditTitle();
        ViewBag.editHtml = app.MobGetEdit();
        ViewBag.btnHtml = app.HtmlGetEditBtns();

        return this.display();
    }

    //不验证登陆
    async __before(){
      //部分 action 下不检查,
    }
}
