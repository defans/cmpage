'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ] 手机APP数据接口
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.controller
 */

/**
 * 移动端，业务模块展示及常用操作的URL接口
 * @class cmpage.controller.mob
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 业务模块展示的主界面，分页列表，POST调用： /cmpage/mob/list
     * @method  list
     * @return {json}  包含HTML片段
     */
    async listAction(){
        let vb={};
        let module = this.model("cmpage/module");

        let parms ={};
        parms.modulename =this.post('modulename');
        if(parms.modulename.length >20){
            let error = new Error(parms.modulename + " 模块名错误！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        parms.pageIndex = this.post('pageIndex');
        parms.pageSize = this.post('pageSize');
        parms.parmsUrl = JSON.parse(this.post('parmsUrl')) || {};
        Object.assign(vb,parms);
        //debug(parms,'cmpage.ctrl.mob - parms');

        let md = await module.getModuleByName(parms.modulename);
        Object.assign(parms,md);

        parms.query = this.post();
        parms.c_page_size = parms.pageSize;
        //console.log(page);
        parms.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(parms.id)){
            let error = new Error(parms.modulename + " 模块不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }

        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel)){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        debug(parms.query,'cmpage.C.mob - parms.query');
        if(!think.isEmpty(parms.query.c_country)){
            let area = parms.query.c_country.split(',');
            parms.query.c_province = '';
            parms.query.c_city = '';
            parms.query.c_country = area[2];
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        pageModel.modQuerys = await module.getModuleQuery(parms.id);
        pageModel.modCols = await module.getModuleCol(parms.id);
        pageModel.modBtns = await module.getModuleBtn(parms.id);

        vb.queryHtml = await pageModel.mobHtmlGetQuery();
        let btnsHtml = await pageModel.mobHtmlGetHeaderBtns();
        vb.headerBtnsHtml = btnsHtml[0];
        vb.popBtnsHtml = btnsHtml[1];
        vb.listHtml = await pageModel.mobHtmlGetList();
        vb.listIds = pageModel.list.ids.join(',');
        vb.count = pageModel.list.count;
        //cmpage.debug(vb.listHtml);
        vb.statusCode =200;

        return this.json(vb);
    }


    /**
     * 业务模块的编辑页面，调用： /cmpage/mob/edit
     * @method  edit
     * @return {json}  包含HTML片段
     */
    async editAction() {
        let module = this.model('cmpage/module');
        let parms = await module.getModuleByName(this.post('modulename'));
        parms.parmsUrl = JSON.stringify(this.post('parmsUrl'));
        parms.editID = this.post("editID");
        //console.log(page);
        parms.user = await this.session('user');
        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel)){
            let error = new Error(parms.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        //cmpage.debug(parms);
        pageModel.mod = parms;
        pageModel.modEdits = await module.getModuleEdit(parms.id);

        let editHtml =await pageModel.mobHtmlGetEdit();

        return this.json({statusCode:200, editHtml:editHtml});
    }

    /**
     * 保存业务模块记录信息， POST调用： /cmpage/mob/save
     * @method  save
     * @return {json}
     */
    async saveAction(){
        let parms =this.post();
        let user = await this.session('user');

        parms.c_user =user.id;
        parms.c_group = (think.isEmpty(parms.c_group) ? user.groupID : parms.c_group);
        parms.c_time = think.datetime();
        parms.c_status= (think.isEmpty(parms.c_status) ? 0 : parms.c_status);
        if(!think.isEmpty(parms.c_country)){    //地区联动，拆分
            let area = parms.c_country.split(',');
            parms.c_province = area[0];
            parms.c_city = area[1];
            parms.c_country = area[2];
        }
        let ret={statusCode:200,message:'保存成功!',tabid: `page${parms.modulename}`,data:{}};

        let module = this.model('module');
        let md = await module.getModuleByName(parms.modulename);
        let pageModel = cmpage.model(think.isEmpty(md.c_path) ? 'cmpage/page':md.c_path);
        pageModel.mod = md;
        pageModel.mod.user = user;
        pageModel.modEdits = await module.getModuleEdit(md.id);
        await pageModel.pageSave(parms);
        ret.data = pageModel.rec;

        return this.json(ret);
    }

    /**
     * 业务模块的查看页面，一般调用： /cmpage/mob/view
     * @method  view
     * @return {promise}  HTML片段
     */
    async viewAction() {
        let module = this.model('module');
        let md = await module.getModuleByName(this.post('modulename'));
        let pageModel = cmpage.model(think.isEmpty(md.c_path) ? 'cmpage/page':md.c_path);
        pageModel.mod = md;
        pageModel.mod.editID =parseInt( this.post('curID'));
        pageModel.mod.user =  await this.session('user');
        pageModel.modEdits = await module.getModuleEdit(md.id);
        pageModel.modCols = await module.getModuleCol(md.id);

        let viewHtml = await pageModel.mobHtmlGetView()
        return this.json({statusCode:200, viewHtml:viewHtml});
    }

//     /**
//      * 上传文件的URL接口，调用： /cmpage/mob/upload_file </br>
//      * 通用的附件上传，保持与表 t_file </br>
//      * 如果仅仅是单个文件上传，然后取得保存后的文件路径名，则调用 /cmpage/page/upload_file
//      * @method  updateFile
//      * @return {json}  状态
//      */
//     async uploadFileAction(){
//         var path = require('path');
//         var fs = require('fs');
//         let parms = this.post();
//         //debug(parms,'page.C.updateFile - parms');
//         let uploadPath = `${think.ROOT_PATH}${think.sep}www${think.sep}static${think.sep}upfiles${think.sep}${parms.link_type}${think.sep}${cmpage.datetime().substring(0,4)}`; //${parms.name}`;
//         think.mkdir(uploadPath);
//         let file = think.extend({}, this.file());
//         //debug(file,'page.C.updateFile - file');
//         if(think.isEmpty(file)){
//             return this.json({statusCode:300, message:'您上传了无效的文件！', filename:''});
//         }
//
// //        debug(uploadPath,'page.C.updateFile - path');
//         let newPath =  uploadPath + think.sep + file.file.originalFilename;
//         fs.renameSync(file.file.path, newPath);
//
//         let filename = `/static/upfiles/${parms.link_type}/${cmpage.datetime().substring(0,4)}/${file.file.originalFilename}`;
//         return this.json({statusCode:200, message:'', filename: filename});
//     }

}
