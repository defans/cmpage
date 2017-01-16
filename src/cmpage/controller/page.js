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
            //cmpage.debug(http._get);
            parms.parmsUrl = this.get();
            parms.query = this.get();
        }else{
            parms.pageIndex = this.post('pageCurrent');
            parms.pageSize = this.post('pageSize');
            parms.parmsUrl = JSON.parse(this.post('parmsUrl'));
            parms.query = this.post();
        }
        parms.parmsUrl.readonly = !(think.isEmpty(parms.parmsUrl.readonly) || parms.parmsUrl.readonly !=1);
        parms.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(parms.id)){
            let error = new Error(parms.modulename + " 模块不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            let error = new Error(`${parms.modulename} 的实现类(${parms.c_path})不存在！`);
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        pageModel.modBtns = await module.getModuleBtn(parms.id,parms.user,parms.modulename);
        vb.queryHtml = await pageModel.htmlGetQuery();
        //      cmpage.debug(vb.queryHtml);
        //cmpage.debug(pageModel.mod, 'controller.page.list - pageModel.mod');
        vb.otherHtml = await pageModel.htmlGetOther();
        vb.btnHeaderHtml = await pageModel.htmlGetBtnHeader();
        //console.log(vb.btnHeaderHtml);
        vb.listHtml = await pageModel.htmlGetList();
        vb.listIds = pageModel.list.ids.join(',');
        vb.count = pageModel.list.count;
        vb.footerHtml = await pageModel.htmlGetFooter();
        //cmpage.debug(vb.listHtml);

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
        parms.parmsUrl = JSON.parse(this.get('parmsUrl'));

        parms.user = await this.session('user');
//    console.log(parms);
        if(think.isEmpty(parms.id)){
            let error = new Error(parms.modulename + " 模块不存在！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }

        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        await pageModel.getDataList();
        //cmpage.debug(data);
        let excel = await this.model('page_excel').excelExport(pageModel.list,pageModel.modCols);
        //cmpage.debug(vb.listHtml);
        this.header('Content-Type', 'application/vnd.openxmlformats');
        //let filename=[{filename:(think.isEmpty(page.c_alias) ? page.modulename : page.c_alias)}];
        this.header("Content-Disposition", "attachment; filename=" +parms.modulename +".xlsx");
        this.end(excel, 'binary');
    }

    /**
     * 删除记录的URL接口，调用： /cmpage/page/delete?modulename=xxx&id=xxx&flag=false</br>
     * flag=true: 记录真删除，否则修改记录状态 c_status = -1
     * @method  delete
     * @return {json}  删除成功状态
     */
    async deleteAction(){
        let page = await this.model('module').getModuleByName(this.get('modulename'));
        //page.id = this.get("id");
        page.user = await this.session('user');
        //cmpage.debug(page);
        let pageModel = cmpage.model(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        pageModel.mod = page;
        await pageModel.initPage();
        pageModel.mod.recID = this.get("id");
        pageModel.mod.flag = this.get("flag") == 'undefined' ? false : this.get('flag');
        let ret = await pageModel.pageDelete();

        return this.json(ret);
    }
    /**
     * 修改状态，供界面按钮直接调用，工作流相关方法（状态流转类）</br>
     * 调用： /cmpage/page/update_status?modulename=xxx&id=xxx&actID=xxx&status=xxx
     * @method  updateStatus
     * @return {json}  执行修改后的返回信息
     */
    async updateStatusAction(){
        let page = await this.model('module').getModuleByName(this.get('modulename'));
        page.user = await this.session('user');
        let pageModel = cmpage.model(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        pageModel.mod = page;
        await pageModel.initPage();
        let recID = this.get("id");
        let actID = this.get("actID");
        let status = this.get("status");
        let ret = await pageModel.updateStatus(recID,actID,status,true);

        return this.json(ret);
    }

    /**
     * 业务模块的编辑页面，一般调用： /cmpage/page/edit?modulename=xxx
     * @method  edit
     * @return {promise}  HTML片段
     */
    async editAction() {
        let module = cmpage.model('cmpage/module');
        let parms = await module.getModuleByName(this.get('modulename'));
        parms.parmsUrl = this.get();
        parms.editID = think.isEmpty(this.get("id")) ? this.get("c_id") : this.get("id");
        parms.listIds = think.isEmpty(this.get('listIds')) ? '':this.get('listIds');
        parms.user = await this.session('user');
        //debug(parms,'page.C.edit - parms');
        let pageModel = cmpage.model(think.isEmpty(parms.c_path) ? 'cmpage/page':parms.c_path);
        pageModel.mod = parms;
        await pageModel.initPage();
        if(think.isEmpty(pageModel.proc) && parms.parmsUrl.procID >0){
            pageModel.proc = await cmpage.model('flow/proc').getProcById(parms.parmsUrl.procID);
        }

        pageModel.modEdits = await module.getModuleEdit(parms.id);
        //pageModel.getPageOther();
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
    async editMsAction() {
        let module = this.model('module');
        let parms = await module.getModuleByName(this.get('modulename'));
        parms.parmsUrl = this.get();
        parms.parmsUrl.readonly = false;
        parms.editID =  think.isEmpty(this.get("id")) ? this.get("c_id") : this.get("id");
        parms.user = await this.session('user');
        //cmpage.debug(page);
        let pageModel = cmpage.model(parms.c_path);
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modEdits = await module.getModuleEdit(parms.id);
        let editHtml =await pageModel.htmlGetEdit();
        let tabsHtml = pageModel.htmlGetTabs();
        let btnHtml = await pageModel.htmlGetEditBtns();
        //let jsHtml = pageModel.htmlGetJS();

        this.assign('editHtml',editHtml);
        this.assign('tabsHtml',tabsHtml);
        //this.assign('jsHtml',jsHtml);
        parms.pk = pageModel.pk;
        this.assign('parms',parms);
        this.assign('btnHtml',btnHtml);
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
        //cmpage.debug(user);
        parms.c_user =user.id;
        parms.c_group = (think.isEmpty(parms.c_group) || parms.c_group == 0) ? user.groupID : parms.c_group;
        parms.c_time = think.datetime();
        parms.c_status= (think.isEmpty(parms.c_status) ? 0 : parms.c_status);
        let ret={statusCode:200,message:'保存成功!',tabid: `page${parms.modulename}`,data:{}};
        let parmsUrl = think.isEmpty(parms.parmsUrl) ? {}: JSON.parse(parms.parmsUrl);
        if(parms.modulename === 'CodeList'){
            cmpage.debug(parms.parmsUrl);
            ret = {statusCode:200,message:'保存成功!',divid: parmsUrl['target'],data:{}};
        }else if(!think.isEmpty(parmsUrl.moduleOpen)){
            //如果是弹出框打开 *moduleOpen=dialog
            if(parmsUrl.moduleOpen =='div'){
                ret = {statusCode:200,message:'保存成功!',divid: `page${parms.modulename}`,data:{}};
            }else{
                ret = {statusCode:200,message:'保存成功!',dialogid: `page${parms.modulename}`,data:{}};
            }
        }

        let md = await this.model('module').getModuleByName(parms.modulename);
        let pageModel = cmpage.model(think.isEmpty(md.c_path) ? 'cmpage/page':md.c_path);
        pageModel.mod = md;
        await pageModel.initPage();
        pageModel.mod.user = user;
        pageModel.mod.editID = parms[pageModel.pk] || 0;
        pageModel.modEdits = await cmpage.model('cmpage/module').getModuleEdit(md.id);
        parms.parmsUrl =parmsUrl;
        let saveRet = await pageModel.pageSave(parms);
        ret.data = pageModel.rec;
        ret.data.id = pageModel.rec[pageModel.pk];
        if(!think.isEmpty(saveRet) && saveRet.statusCode === 300){
            ret.statusCode =300;
            ret.message = saveRet.message;
        }

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
        let pageModel = cmpage.model(think.isEmpty(md.c_path) ? 'cmpage/page':md.c_path);
        pageModel.mod = md;
        await pageModel.initPage();
        pageModel.mod.listIds = think.isEmpty(this.get('listIds')) ? '':this.get('listIds');
        pageModel.mod.editID =parseInt( think.isEmpty(this.get('id')) ? this.get('c_id') : this.get('id'));
        pageModel.mod.user =  await this.session('user');
        pageModel.modCols = await module.getModuleCol(md.id);

        let viewHtml = await pageModel.htmlGetView()
        let btnHtml = await pageModel.htmlGetViewBtn()

        this.assign('mod',pageModel.mod);
        this.assign('viewHtml',viewHtml);
        this.assign('btnHtml',btnHtml);
        return this.display();
    }
    /**
     * 主从业务模块的查看页面，一般调用： /cmpage/page/view_ms?modulename=xxx
     * @method  viewMs
     * @return {promise}  HTML片段
     */
    async viewMsAction() {
        let module = this.model('module');
        let md = await module.getModuleByName(this.get('modulename'));
        let pageModel = cmpage.model(think.isEmpty(md.c_path) ? 'cmpage/page_ms':md.c_path);
        pageModel.mod = md;
        pageModel.mod.parmsUrl = this.get();
        pageModel.mod.parmsUrl.readonly = true;
        await pageModel.initPage();
        //pageModel.mod.listIds = think.isEmpty(this.get('listIds')) ? '':this.get('listIds');
        pageModel.mod.editID =parseInt( think.isEmpty(this.get('id')) ? this.get('c_id') : this.get('id'));
        pageModel.mod.user =  await this.session('user');
        pageModel.modCols = await module.getModuleCol(md.id);

        let viewHtml = await pageModel.htmlGetView()
        let tabsHtml = await pageModel.htmlGetTabs()

        this.assign('mod',pageModel.mod);
        this.assign('viewHtml',viewHtml);
        this.assign('tabsHtml',tabsHtml);
//        this.assign('btnHtml',btnHtml);
        return this.display();
    }

    /**
     * 查找带回页面，一般调用： /cmpage/page/lookup?modulename=xxx&multiselect=false
     * @method  lookup
     * @return {promise}  分页列表数据，字段是否返回的设置 c_isview (模块显示列设置)
     */
    async lookupAction(){
        let vb={};
        let module = this.model("cmpage/module");

        let parms ={};
        parms.query ={};
        if(this.method() === 'get'){
            parms.modulename =this.get('modulename');
            //parms.returnFields =this.get('returnFields');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.pageIndex = 1;
            parms.pageSize = parms.c_page_size;
            //cmpage.debug(http._get);
            parms.parmsUrl = this.get();
            parms.query = parms.parmsUrl;
        }else{
            parms.modulename= this.post('modulename');
            //parms.returnFields =think.isEmpty(this.get('returnFields')) ? this.post('returnFields') : this.get('returnFields');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.query = this.post();
            parms.pageIndex = this.post('pageIndex');
            parms.pageSize = this.post('pageSize');
            parms.parmsUrl = JSON.parse(this.post('parmsUrl'));
        }
        parms.user = await this.session('user');
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        pageModel.modBtns = await module.getModuleBtn(parms.id);

        vb.queryHtml = await pageModel.htmlGetQuery();
        //cmpage.debug(vb.queryHtml);
        vb.otherHtml = await pageModel.htmlGetOther();
        vb.btnHeaderHtml = await pageModel.htmlGetBtnHeader();
        //    cmpage.debug(vb.btnHeaderHtml);
        vb.listHtml = await pageModel.htmlGetList();
        vb.listIds = pageModel.list.ids.join(',');
        vb.count = pageModel.list.count;
        vb.footerHtml = await pageModel.htmlGetFooter();
        //cmpage.debug(vb.listHtml);

        this.assign('vb',vb);
        this.assign('mod',pageModel.mod);

        return this.display();
    }
    /**
     * 上传文件的URL接口，调用： /cmpage/page/upload_file </br>
     * 如果多个文件上传，则前端循环调用本接口
     * @method  updateFile
     * @return {json}  状态，包含保存后的路径名称，可以作为前端的表单项保存
     */
    async uploadFileAction(){
        var path = require('path');
        var fs = require('fs');
        let parms = this.post();
        debug(parms,'page.C.updateFile - parms');
        let uploadPath = `${think.ROOT_PATH}${think.sep}www${think.sep}static${think.sep}upfiles${think.sep}${parms.link_type}${think.sep}${cmpage.datetime().substring(0,4)}`; //${parms.name}`;
        think.mkdir(uploadPath);
        let file = think.extend({}, this.file());
        debug(file,'page.C.updateFile - file');
        if(think.isEmpty(file)){
            return this.json({statusCode:300, message:'您上传了无效的文件！', filename:''});
        }

//        debug(uploadPath,'page.C.updateFile - path');
        let fileInfo = file.file;
        if(think.isEmpty(fileInfo)){
            for(let p in file){
                if(!think.isEmpty(file[p])){
                    fileInfo = file[p];
                    break;
                }
            }
        }
        let newPath =  uploadPath + think.sep + fileInfo.originalFilename;
        fs.renameSync(fileInfo.path, newPath);

        let filename = `/static/upfiles/${parms.link_type}/${cmpage.datetime().substring(0,4)}/${fileInfo.originalFilename}`;
        return this.json({statusCode:200, message:'', filename: filename});
    }

    /**
     * 时间轴展示页面，一般调用： /cmpage/page/timeline?modulename=xxx
     * @method  timeline
     * @return {promise}  时间轴列表数据，取模块的显示列设置
     */
    async timelineAction(){
        let vb={};
        let module = this.model("cmpage/module");

        let parms ={};
        parms.query ={};
        if(this.method() === 'get'){
            parms.modulename =this.get('modulename');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.pageIndex = 1;
            parms.pageSize = 50;    //parms.c_page_size;
            parms.parmsUrl = this.get();
            parms.query = parms.parmsUrl;
        }
        parms.user = await this.session('user');
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        cmpage.debug(parms,'page.timelineAction - parms');
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        pageModel.modBtns = await module.getModuleBtn(parms.id);

//        vb.queryHtml = await pageModel.htmlGetQuery();
        //cmpage.debug(vb.queryHtml);
        // vb.otherHtml = await pageModel.htmlGetOther();
        // vb.btnHeaderHtml = await pageModel.htmlGetBtnHeader();
        //    cmpage.debug(vb.btnHeaderHtml);
//        vb.listHtml = await pageModel.htmlGetList();
        vb.listHtml = await pageModel.htmlGetListTimeline();
        // vb.count = pageModel.list.count;
        // vb.footerHtml = await pageModel.htmlGetFooter();
        //cmpage.debug(vb.listHtml);

        this.assign('vb',vb);
//        this.assign('mod',pageModel.mod);

        return this.display();
    }

}
