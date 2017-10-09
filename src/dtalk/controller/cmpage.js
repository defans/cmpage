'use strict';

const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async showAction(){
      let vb={};
      let module = cmpage.model("cmpage/module");

      let parms ={};
      parms.modulename =this.get('modulename');

      if(parms.modulename.length >20){
        return this.json({statusCode:'300',message:parms.modulename + " 模块名错误！"});
      }

      let md = await module.getModuleByName(parms.modulename);
      Object.assign(parms,md);

      //console.log(page);
      parms.user = await this.session('user');
      //    console.log(page);
      if(think.isEmpty(parms.id)){
        return this.json({statusCode:'300',message:parms.modulename + " 模块不存在！"});
      }

      let pageModel = cmpage.model(parms.c_path);
      if(think.isEmpty(pageModel)){
        return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
      }

      parms.parmsUrl = this.get();
      vb.mod = parms;
      pageModel.mod = parms;
      pageModel.mod.query = {};
      pageModel.modQuerys = await module.getModuleQuery(parms.id);
      pageModel.modBtns = await module.getModuleBtn(parms.id);
      vb.searchHtml = await pageModel.mobHtmlGetQuery();
      vb.btnsHtml = await pageModel.hhGetHeaderBtns();

      this.assign('vb',vb);
      return  this.display();
  }

    /**
     * 业务模块展示的主界面，分页列表，POST调用： /cmpage/mob/list
     * @method  list
     * @return {json}  包含HTML片段
     */
    async listAction(){
        let vb={};
        let module = cmpage.model("cmpage/module");

        let parms ={};
        parms.modulename =this.post('modulename');
        if(parms.modulename.length >20){
            return this.json({statusCode:'300',message:parms.modulename + " 模块名错误！"});
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
            return this.json({statusCode:'300',message:parms.modulename + " 模块不存在！"});
        }

        let pageModel = cmpage.model(parms.c_path);
        if(think.isEmpty(pageModel)){
            return this.json({statusCode:'300',message:parms.modulename + " 的实现类不存在！"});
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

        //vb.queryHtml = await pageModel.mobHtmlGetQuery();
        //let btnsHtml = await pageModel.mobHtmlGetHeaderBtns();
        //vb.headerBtnsHtml = btnsHtml[0];
        //vb.popBtnsHtml = btnsHtml[1];
        vb.listHtml = await pageModel.mobHtmlGetList();
        vb.listIds = pageModel.list.ids.join(',');
        vb.count = pageModel.list.count;
        //cmpage.debug(vb.listHtml);
        vb.statusCode =200;

        return this.json(vb);
    }



}
