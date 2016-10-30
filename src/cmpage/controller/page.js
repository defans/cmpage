'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.controller
 */

/**
 * 业务模块展示及常用操作的URL接口
 * @class cmpage.controller.page
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 业务模块展示的主界面，分页列表，一般调用： /cmpage/page/list?modulename=xxx
     * @method  list
     * @return {promise}  HTML片段
     */
    async listAction(){
        let vb={};
        let parms ={};
        parms.query ={};
        parms.modulename =(this.method() === 'get' ? this.get('modulename'):this.post('modulename'));
        if(parms.modulename.length >20){
            let error = new Error(parms.modulename + " 模块名错误！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        let module = this.model("cmpage/module");
        let md = await module.getModuleByName(parms.modulename);
        Object.assign(parms,md);

        if(this.method() === 'get'){
            parms.pageIndex = 1;
            parms.pageSize = md.c_page_size;
            //global.debug(http._get);
            parms.parmsUrl = JSON.stringify(this.get());
            parms.query = this.get();
        }else{
            parms.pageIndex = this.post('pageCurrent');
            parms.pageSize = this.post('pageSize');
            parms.parmsUrl = this.post('parmsUrl');
            parms.query = this.post();
        }

        parms.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(parms.id)){
            let error = new Error(parms.modulename + " 模块不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        let pageModel = global.model(parms.c_path);
        if(think.isEmpty(pageModel)){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //global.debug(parms);
        pageModel.mod = parms;
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        pageModel.modBtns = await module.getModuleBtn(parms.id);
        vb.queryHtml = await pageModel.htmlGetQuery();
        //      global.debug(vb.queryHtml);
        //global.debug(pageModel.mod, 'controller.page.list - pageModel.mod');
        vb.otherHtml = await pageModel.htmlGetOther();
        vb.btnHeaderHtml = await pageModel.htmlGetBtnHeader();
        //console.log(vb.btnHeaderHtml);
        vb.listHtml = await pageModel.htmlGetList();
        vb.listIds = pageModel.list.ids.join(',');
        vb.count = pageModel.list.count;
        //global.debug(vb.listHtml);

        this.assign('vb',vb);
        this.assign('mod',pageModel.mod);
        return this.display();
    }

    /**
     * 模块主界面，导出excel文件，一般调用： /cmpage/page/excel_export?modulename=xxx
     * @method  excelExport
     * @return {file}  excel文件
     */
    async excelExportAction(){
        let module = this.model("module");
        let parms ={};
        parms.query ={};
        parms.modulename= this.get('modulename');
        let md = await module.getModuleByName(parms.modulename);
        Object.assign(parms,md);
        parms.query = this.get();
        parms.pageIndex = 1;
        parms.pageSize = 2000;   //最多2000行
        parms.parmsUrl = this.get('parmsUrl');

        parms.user = await this.session('user');
//    console.log(parms);
        if(think.isEmpty(parms.id)){
            let error = new Error(parms.modulename + " 模块不存在！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }

        let pageModel = global.model(parms.c_path);
        if(think.isEmpty(pageModel)){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //global.debug(parms);
        pageModel.mod = parms;
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        await pageModel.getDataList();
        //global.debug(data);
        let excel = await this.model('page_excel').excelExport(pageModel.list,pageModel.modCols);
        //global.debug(vb.listHtml);
        this.header('Content-Type', 'application/vnd.openxmlformats');
        //let filename=[{filename:(think.isEmpty(page.c_alias) ? page.modulename : page.c_alias)}];
        this.header("Content-Disposition", "attachment; filename=" +parms.modulename +".xlsx");
        this.end(excel, 'binary');
    }

    /**
     * 删除记录的URL接口，调用： /cmpage/xxx/delete?id=xxx
     * @method  delete
     * @return {json}  删除成功状态
     */
    async deleteAction(){
        let page = await this.model('module').getModuleByName(this.get('modulename'));
        //page.id = this.get("id");
        page.user = await this.session('user');
        //global.debug(page);
        let pageModel = global.model(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        pageModel.mod = page;
        pageModel.mod.recID = this.get("id");
        pageModel.mod.flag = this.get("flag");
        let ret = await pageModel.pageDelete();

        return this.json(ret);
    }

    /**
     * 业务模块的编辑页面，一般调用： /cmpage/page/edit?modulename=xxx
     * @method  edit
     * @return {promise}  HTML片段
     */
    async editAction() {
        let module = global.model('cmpage/module');
        let parms = await module.getModuleByName(this.get('modulename'));
        parms.parmsUrl = JSON.stringify(this.get());
        parms.editID = this.get("id");
        parms.listIds = think.isEmpty(this.get('listIds')) ? '':this.get('listIds');
        parms.user = await this.session('user');
        //global.debug(page);
        let pageModel = global.model(think.isEmpty(parms.c_path) ? 'cmpage/page':parms.c_path);
        pageModel.mod = parms;
        pageModel.modEdits = await module.getModuleEdit(parms.id);
        pageModel.getPageOther();
        let editHtml =await pageModel.htmlGetEdit();
        let btnHtml = await pageModel.htmlGetEditBtns();

        this.assign('editHtml',editHtml);
        this.assign('btnHtml',btnHtml);
        this.assign('parms',pageModel.mod);
        return this.display();
    }

    /**
     * 业务模块的编辑页面，主从页面，一般调用： /cmpage/page/rec_edit?modulename=xxx
     * @method  recEdit
     * @return {promise}  HTML片段
     */
    async recEditAction() {
        let module = this.model('module');
        let parms = await module.getModuleByName(this.get('modulename'));
        parms.parmsUrl = JSON.stringify(this.get());
        parms.editID = this.get("id");
        parms.user = await this.session('user');
        //global.debug(page);
        let pageModel = global.model(parms.c_path);
        pageModel.mod = parms;
        pageModel.modEdits = await module.getModuleEdit(parms.id);
        let editHtml =await pageModel.htmlGetEdit();
        let tabsHtml = pageModel.htmlGetTabs();
        let jsHtml = pageModel.htmlGetJS();

        this.assign('editHtml',editHtml);
        this.assign('tabsHtml',tabsHtml);
        this.assign('jsHtml',jsHtml);
        this.assign('parms',parms);
        return this.display();
    }

    /**
     * 保存业务模块记录信息， POST调用： /cmpage/page/save
     * @method  save
     * @return {json}
     */
    async saveAction(){
        let parms =this.post();
        let user = await this.session('user');
        //global.debug(user);
        parms.c_user =user.id;
        parms.c_group = (think.isEmpty(parms.c_group) || parms.c_group == 0) ? user.groupID : parms.c_group;
        parms.c_time = think.datetime();
        parms.c_status= (think.isEmpty(parms.c_status) ? 0 : parms.c_status);
        let ret={statusCode:200,message:'保存成功!',tabid: `page${parms.modulename}`,data:{}};
        if(parms.modulename === 'CodeList'){
            global.debug(parms.parmsUrl);
            let parmsUrl = JSON.parse(parms.parmsUrl);
            ret = {statusCode:200,message:'保存成功!',divid: parmsUrl['target'],data:{}};
        }

        let md = await this.model('module').getModuleByName(parms.modulename);
        let pageModel = global.model(think.isEmpty(md.c_path) ? 'cmpage/page':md.c_path);
        pageModel.mod = md;
        pageModel.mod.user = user;
        pageModel.modEdits = await global.model('cmpage/module').getModuleEdit(md.id);
        await pageModel.pageSave(parms);
        ret.data = pageModel.rec;

        return this.json(ret);
    }

    /**
     * 业务模块的查看页面，一般调用： /cmpage/page/view?modulename=xxx
     * @method  view
     * @return {promise}  HTML片段
     */
    async viewAction() {
        let module = this.model('module');
        let md = await module.getModuleByName(this.get('modulename'));
        let pageModel = global.model(think.isEmpty(md.c_path) ? 'cmpage/page':md.c_path);
        pageModel.mod = md;
        pageModel.mod.viewID =parseInt( this.get('id'));
        pageModel.mod.user =  await this.session('user');
        pageModel.modCols = await module.getModuleCol(md.id);

        let viewHtml = await pageModel.htmlGetView()

        this.assign('viewHtml',viewHtml);
        return this.display();
    }

    /**
     * 查找带回页面，一般调用： /cmpage/page/lookup?modulename=xxx&multiselect=false
     * @method  lookup
     * @return {promise}  分页列表数据，字段是否返回的设置 c_isview (模块显示列设置)
     */
    async lookupAction(){
        let http=this.http;
        let vb={};
        let module = this.model("cmpage/module");

        let parms ={};
        parms.query ={};
        if(this.method() === 'get'){
            parms.modulename =http.get('modulename');
            parms.returnFields =http.get('returnFields');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.pageIndex = 1;
            parms.pageSize = parms.c_page_size;
            //global.debug(http._get);
            parms.parmsUrl = JSON.stringify(http._get);
            parms.query = parms.parmsUrl;
        }else{
            parms.modulename= http.post('modulename');
            parms.returnFields =http.get('returnFields');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.query = http._post;
            parms.pageIndex = http.post('pageIndex');
            parms.pageSize = http.post('pageSize');
            parms.parmsUrl = http.post('parmsUrl');
        }
        parms.user = await this.session('user');
        let pageModel = global.model(parms.c_path);
        if(think.isEmpty(pageModel)){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //global.debug(parms);
        pageModel.mod = parms;
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        pageModel.modBtns = await global.model('cmpage/module').getModuleBtn(parms.id);

        vb.queryHtml = await pageModel.htmlGetQuery();
        //global.debug(vb.queryHtml);
        vb.otherHtml = await pageModel.htmlGetOther();
        vb.btnHeaderHtml = await pageModel.htmlGetBtnHeader();
        //    global.debug(vb.btnHeaderHtml);
        vb.listHtml = await pageModel.htmlGetList();
        vb.listIds = pageModel.list.ids.join(',');
        vb.count = pageModel.list.count;
        //global.debug(vb.listHtml);

        this.assign('vb',vb);
        this.assign('mod',pageModel.mod);

        return this.display();
    }

}