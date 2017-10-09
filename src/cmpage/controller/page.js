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
const Base = require('./base.js');

module.exports = class extends Base {
    /**
     * 业务模块展示的全页面，加载所需的js文件等，调用page/list等URL展示具体内容，
     * 一般供外系统调用： /cmpage/page/index?method=list&modulename=xxx
     * @method  index
     * @return {promise}  HTML页面
     */
    async indexAction(){
        //验证用户token，
        //取用户信息，写入session
        //显示页面
        let url = this.get('url');
        if(think.isEmpty(url)){
            url = "/cmpage/page/"+this.get('method')+"?modulename="+this.get('modulename');
        }
        let vb = {title:'外部页面', url:url};
        debug(vb,'page.C.index - vb');
        this.assign('vb',vb);
        return this.display();
    }
    /**
     * 业务模块展示的主界面，分页列表，一般调用： /cmpage/page/list?modulename=xxx
     * @method  list
     * @return {promise}  HTML片段
     */
    async listAction(){
        let vb={};
        let parms ={};
        parms.query ={};
        parms.modulename =(this.isGet ? this.get('modulename'):this.post('modulename'));
        if(parms.modulename.length >20){
            return this.json({statusCode:'300',message:parms.modulename + " 模块名错误！"});
        }
        let moduleModel = this.model("module");
        let md = await moduleModel.getModuleByName(parms.modulename);
        Object.assign(parms,md);

        if(this.isGet){
            parms.pageIndex = 1;
            parms.pageSize = md.c_page_size;
            parms.parmsUrl = this.get();
            parms.query = this.get();
        }else{
            parms.pageIndex = this.post('pageCurrent');
            parms.pageSize = this.post('pageSize');
            parms.parmsUrl = JSON.parse(this.post('parmsUrl'));
            parms.query = this.post();
        }
        delete parms.parmsUrl['_'];
        parms.parmsUrl.readonly = !(think.isEmpty(parms.parmsUrl.readonly) || parms.parmsUrl.readonly !=1);
        parms.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(parms.id)){
            return this.json({statusCode:'300',message:parms.modulename + " 模块不存在！"});
        }
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            return this.json({statusCode:'300',message: `${parms.modulename} 的实现类(${parms.c_path})不存在！`});
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modQuerys = await moduleModel.getModuleQuery(parms.id);
        pageModel.modCols = await moduleModel.getModuleCol(parms.id);
        pageModel.modBtns = await moduleModel.getModuleBtn(parms.id,parms.user,parms.modulename);
        //debug(pageModel.modBtns,'page.C.list - pageModel.modBtns');
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
    async excel_exportAction(){
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
        //debug(parms.query,'page.C.excelExport - parms.query');
        //console.log(parms.query);

        if(think.isEmpty(parms.id)){
            return this.json({statusCode:'300',message:parms.modulename + " 模块不存在！"});
        }

        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        await pageModel.initPage();
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        await pageModel.getDataList();
        //cmpage.debug(pageModel.list,'page.C.excelExport - pageModel.list');
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
    async update_statusAction(){
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
        delete parms.parmsUrl['_'];
        parms.parmsUrl.readonly = false;
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
     * 业务模块的编辑页面，主从页面，一般调用： /cmpage/page/edit_ms?modulename=xxx
     * @method  editMs
     * @return {promise}  HTML片段
     */
    async edit_msAction() {
        let module = this.model('module');
        let parms = await module.getModuleByName(this.get('modulename'));
        parms.parmsUrl = this.get();
        delete parms.parmsUrl['_'];
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
        //debug(pageModel.pk,'page.C.save - pageModel.pk');
        pageModel.mod.editID = parms["id"] || parms["c_id"] || 0;
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
    async view_msAction() {
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
     * 业务模块的编辑页面，主从页面，一般调用： /cmpage/page/print?modulename=xxx
     * @method  print
     * @return {promise}  HTML片段
     */
    async printAction() {
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
        pageModel.modCols = await module.getModuleCol(parms.id);
        let printHtml =await pageModel.htmlGetPrint();

        this.assign('printHtml',printHtml);
        this.assign('mod',pageModel.mod);
        return this.display();
    }

    /**
     * 查找带回页面，一般调用： /cmpage/page/lookup?modulename=xxx&multiselect=false
     * @method  lookup
     * @return {promise}  分页列表数据，字段是否返回的设置 c_isview (模块显示列设置)
     */
    async lookupAction(){
        let vb={};
        let module = this.model("module");

        let parms ={};
        parms.query ={};
        if(this.isGet){
            parms.modulename =this.get('modulename');
            //parms.returnFields =this.get('returnFields');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.pageIndex = 1;
            parms.pageSize = parms.c_page_size;
            parms.parmsUrl = this.get();
            delete parms.parmsUrl['_'];
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
            delete parms.parmsUrl['_'];
        }
        if(think.isEmpty(parms.id)){
            return this.json({statusCode:'300',message:parms.modulename + " 模块不存在！"});
        }
        parms.user = await this.session('user');
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
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
        //    cmpage.debug(vb.btnHeaderHtml);
        vb.listHtml = await pageModel.htmlGetList();
        vb.btnHeaderHtml = await pageModel.htmlGetBtnHeader();
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
    async upload_fileAction(){
        const fs = require('fs');
        const path = require('path');
        const rename = think.promisify(fs.rename, fs); // 通过 promisify 方法把 rename 方法包装成 Promise 接口

        let parms = this.post();
        debug(parms,'page.C.uploadFile - parms');

        const file = this.file('file');
        if(think.isEmpty(file)){
            return this.json({statusCode:300, message:'您上传了无效的文件！', filename:''});
        }
        // console.log(file);
        let fileName = `/static/upfiles/${parms.link_type}/${cmpage.datetime().substring(0,4)}/${file.name}`;
        let saveFile =  path.join(think.ROOT_PATH,  `www${fileName}`);
        debug(saveFile,'page.C.uploadFile - saveFile');

        think.mkdir(path.dirname(saveFile));
        var readStream = fs.createReadStream(file.path)
        var writeStream = fs.createWriteStream(saveFile);                 
        readStream.pipe(writeStream);
        readStream.on('end',function() {
            fs.unlinkSync(file.path);
        });

        return this.json({statusCode:200, message:'', filename: fileName});
    }

    /**
     * 时间轴展示页面，一般调用： /cmpage/page/timeline?modulename=xxx
     * @method  timeline
     * @return {promise}  时间轴列表数据，取模块的显示列设置
     */
    async timelineAction(){
        let vb={};
        let module = cmpage.model("module");

        let parms ={};
        parms.query ={};
        if(this.isGet){
            parms.modulename =this.get('modulename');
            let md = await module.getModuleByName(parms.modulename);
            Object.assign(parms,md);
            parms.pageIndex = 1;
            parms.pageSize = 50;    //parms.c_page_size;
            parms.parmsUrl = this.get();
            delete parms.parmsUrl['_'];
            parms.query = parms.parmsUrl;
        }
        parms.user = await this.session('user');
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel['htmlGetQuery'])){
            return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
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
