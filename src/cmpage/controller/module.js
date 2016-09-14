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
 * 业务模块设置的URL接口
 * @class cmpage.controller.module
 */
import Base from './base.js';

export default class extends Base {

  /**
   * 模块主信息设置，分页列表，调用： /cmpage/module/list
   * @method  list
   * @return {promise}  HTML片段
   */
  async listAction(){
    let http =this.http;
    let vb={numsPerPage:20,currentPage:1,orderField:"c_time",orderDirection:"desc"};  //初始化

    if(http.method=="GET")  //显示第一页
    {
      vb.where = http.get();
    }else if(http.method=="POST"){
      vb.where = http.post();
    }
    global.debug(vb);
    let model = this.model("module");

    let where=' c_status=0 ';
    if(!think.isEmpty(vb.where.c_modulename)){
      where += ` and c_modulename like '%${vb.where.c_modulename}%'`
    }
    if(!think.isEmpty(vb.where.c_datasource)){
      where += ` and c_datasource like '%${vb.where.c_datasource}%'`
    }

    let list = await  this.model('t_module').where(where).order('c_modulename ').page(vb.currentPage,vb.numsPerPage).countSelect();
      for(let rec of list.data){
          rec.c_time= think.datetime(rec.c_time)
      }
    Object.assign(vb,list);
    //global.debug(vb);
    this.assign("vb",vb);
    return this.display();
  }

  /**
   * 保存模块主信息记录， POST调用： /cmpage/module/save
   * @method  save
   * @return {Promise} []
   */
  async saveAction(){
    let ret={statusCode:200,message:'保存成功!',tabid: 'pageModule',data:{}};
    let parms =this.http.post();
    let md = global.objPropertysFromOtherObj({},parms,['c_modulename','c_datasource','c_table','c_page_size','c_sort_by','c_type','c_other',
      'c_module_rec','c_edit_column','c_mui','c_memo','c_path','c_alias']);
    md.c_multiselect = !think.isEmpty(parms.c_multiselect);
    md.c_pager = !think.isEmpty(parms.c_pager);
    md.c_time = think.datetime();
    md.c_status =0;
    //global.debug(md);

    let model = this.model('t_module');
    if(parms.id ==0){
      let rec = await model.where({c_modulename:parms.c_modulename}).find();
      if(think.isEmpty(rec)){
        md.id = await model.add(global.checksql(md));
      }else{
          md.id = rec.id;
          ret.statusCode = 300;
          ret.message = '该模块名称已经存在！';
      }
    }else if(parms.id >0){
        md.id = parms.id;
        await model.where({id:parms.id}).update(global.checksql(md));
    }

      await think.cache(`module${md.id}`,null);
      await think.cache(`modulename${md.c_modulename}`,null);
    return this.json(ret);
  }

    /**
     * 复制模块设置， 调用： /cmpage/module/copy?modulename=xxx
     * @method  copy
     * @return {json} 复制是否成功的信息
     */
    async copyAction(){
    let modulename =this.http.get('modulename');
    return this.json(await this.model('module').copyToNewModule(modulename));
  }

    /**
     * 模块主表编辑页面，调用：/cmpage/module/edit?id=xxx
     * @method  edit
     * @return {Promise} HTML页面
     */
  async editAction(){
    let http =this.http;
    let md={};
    if(http.get('id')=='0')
    {
      //如果新增，则初始化
      md.c_modulename=http.get('modulename');
      md.c_datasource = md.c_table = http.get('datasource');
      Object.assign(md, {id:0,c_multiselect:false, c_pager:true, c_page_size:20, c_sort_by:'id desc',c_edit_column:1, c_path:'cmpage/page',c_alias:md.c_modulename });
    }else{
      let tmp = await  this.model("t_module").where({id: http.get('id')}).find();
      Object.assign(md,tmp);
    }
    global.debug(JSON.stringify(md));

    this.assign("md",md);
    return this.display();
  }

    /**
     * 模块主表编辑页面，调用：/cmpage/module/reset_module_cache
     * @method  resetModuleCache
     * @return {json}
     */
  async resetModuleCacheAction(){
    let ret={statusCode:200,message:'缓存刷新成功!',tabid: '',data:{}};
    await this.model('module').clearModuleCache();
    await this.model('admin/code').clearCodeCache();

    return this.json(ret);
  }

    /**
     * 模块显示列编辑页面，调用：/cmpage/module/col_list?moduleid=xxx
     * @method  colList
     * @return {Promise} HTML页面
     */
  async colListAction(){
    let http =this.http;

    let md =await   this.model('t_module').where({id:http.get('moduleid')}).find();
    global.debug(md);

    let model = this.model("module");
    let vb={};
    vb.colTypes = model.colTypes();
    vb.showTypes = model.showTypes();
    vb.sumTypes = model.sumTypes();
    vb.editList = await  this.model('t_module_col').where({c_module:http.get('moduleid')}).order('c_order ').select();

    this.assign("vb",vb);
    this.assign("md",md);
    return this.display();
  }

    /**
     * 重新设置模块显示列，调用：/cmpage/module/col_reset?moduleid=xxx
     * @method  colReset
     * @return {json}
     */
  async colResetAction(){
    let http = this.http;

    let model = this.model("module");
    let ret = await model.resetModuleCol(http.get('moduleid'));

    return this.json(ret);
  }

    /**
     * 保存显示列设置， POST调用： /cmpage/module/col_save
     * @method  col_save
     * @return {json} 保存记录的状态信息
     */
  async colSaveAction(){
    let http = this.http;
    let model = this.model("t_module_col");
    //let moduleID = http.get('moduleid');
    //let posts = http.post();
    let posts = http.post();

    //global.debug(posts[`editList[0].c_name`]);
    for(let i=0; i< 100 ; i++){
      if (!posts[`editList[${i}].c_order`]){
        break;
      }
//      global.debug(posts[`editList[${i}].c_column`]);
      if(!think.isEmpty(posts[`editList[${i}].c_column`])){
        let md={c_time:think.datetime()};
        md.c_module = posts['c_module'];
        md.c_order = posts[`editList[${i}].c_order`].trim();
        md.c_column = posts[`editList[${i}].c_column`].trim();
        md.c_coltype = posts[`editList[${i}].c_coltype`].trim();
        md.c_name = posts[`editList[${i}].c_name`].trim();
        md.c_desc = posts[`editList[${i}].c_desc`].trim();
        md.c_isretrieve = !think.isEmpty(posts[`editList[${i}].c_isretrieve`]);
        md.c_isshow = !think.isEmpty(posts[`editList[${i}].c_isshow`]);
        md.c_isview = !think.isEmpty(posts[`editList[${i}].c_isview`]);
        md.c_type = posts[`editList[${i}].c_type`].trim();
        md.c_format = posts[`editList[${i}].c_format`].trim();
        md.c_width = posts[`editList[${i}].c_width`];
        md.c_style = posts[`editList[${i}].c_style`];
        md.c_type_sum = posts[`editList[${i}].c_type_sum`].trim();
        md.c_mui = posts[`editList[${i}].c_mui`];
        md.c_memo = posts[`editList[${i}].c_memo`];
        //global.debug(JSON.stringify(md));
        if(think.isEmpty(posts[`editList[${i}].id`])){
          await model.add(global.checksql(md));
        }else{
          await model.where({id: parseInt(posts[`editList[${i}].id`])}).update(global.checksql(md));
        }

      }
    }
      await think.cache(`moduleCol${ posts['c_module']}`,null);
      return this.json({statusCode:200,message:'保存成功！'});
  }

    /**
     * 模块显示列编辑页面，调用：/cmpage/module/edit_list?moduleid=xxx
     * @method  editList
     * @return {Promise} HTML页面
     */
  async editListAction(){
    let http =this.http;

    let md =await   this.model('t_module').where({id:http.get('moduleid')}).find();
    let model = this.model("module");

    let vb={};
    vb.colTypes = model.colTypes();
    vb.editTypes = model.editTypes();
    vb.editList = await  this.model('t_module_edit').where({c_module:http.get('moduleid')}).order('c_order ').select();

    this.assign("vb",vb);
    this.assign("md",md);
    return this.display();
  }

    /**
     * 重新设置模块编辑列，调用：/cmpage/module/edit_reset?moduleid=xxx
     * @method  editReset
     * @return {json}
     */
  async editResetAction(){
    let model = this.model("module");
    let ret = await model.resetModuleEdit(this.get('moduleid'));

    return this.json(ret);
  }

    /**
     * 保存业务模块编辑列的设置， POST调用： /cmpage/module/edit_save
     * @method  edit_save
     * @return {json} 保存记录的状态信息
     */
    async editSaveAction(){
    let http = this.http;
    let model = this.model("t_module_edit");
    let posts = http.post();

    for(let i=0; i< 100 ; i++){
      if (!posts[`editList[${i}].c_order`]){
        break;
      }
      if(!think.isEmpty(posts[`editList[${i}].c_column`])){
        let md={c_time:think.datetime()};
        md.c_module = posts['c_module'];
        md.c_order = posts[`editList[${i}].c_order`];
        md.c_column = posts[`editList[${i}].c_column`].trim();
        md.c_coltype = posts[`editList[${i}].c_coltype`].trim();
        md.c_name = posts[`editList[${i}].c_name`].trim();
        md.c_desc = posts[`editList[${i}].c_desc`].trim();
        md.c_editable = !think.isEmpty(posts[`editList[${i}].c_editable`]);
        md.c_isshow = !think.isEmpty(posts[`editList[${i}].c_isshow`]);
        md.c_isrequired = !think.isEmpty(posts[`editList[${i}].c_isrequired`]);
        md.c_type = posts[`editList[${i}].c_type`].trim();
        md.c_format = posts[`editList[${i}].c_format`].trim();
        md.c_width = posts[`editList[${i}].c_width`];
        md.c_style = posts[`editList[${i}].c_style`].trim();
        md.c_suffix = posts[`editList[${i}].c_suffix`];
        md.c_validate_rules = posts[`editList[${i}].c_validate_rules`];
        md.c_mui = posts[`editList[${i}].c_mui`];
        md.c_memo = posts[`editList[${i}].c_memo`];
        global.debug(JSON.stringify(md));
          if(think.isEmpty(posts[`editList[${i}].id`])){
              await model.add(global.checksql(md));
          }else{
              await model.where({id: parseInt(posts[`editList[${i}].id`])}).update(global.checksql(md));
          }

      }
    }
      await think.cache(`moduleEdit${ posts['c_module']}`,null);
    return this.json({statusCode:200,message:'保存成功！'});
  }

    /**
     * 模块查询列编辑页面，调用：/cmpage/module/query_list?moduleid=xxx
     * @method  queryList
     * @return {Promise} HTML页面
     */
  async queryListAction(){
    let http =this.http;

    let md =await   this.model('t_module').where({id:http.get('moduleid')}).find();
    let model = this.model("module");

    let vb={};
    vb.colTypes = model.colTypes();
    vb.queryTypes = model.queryTypes();
    vb.operations = model.operations();
    vb.editList = await  this.model('t_module_query').where({c_module:http.get('moduleid')}).order('c_order ').select();

    this.assign("vb",vb);
    this.assign("md",md);
    return this.display();
  }

    /**
     * 重新设置模块查询列，调用：/cmpage/module/query_reset?moduleid=xxx
     * @method  queryReset
     * @return {json}
     */
    async queryResetAction(){
    let http = this.http;

    let model = this.model("module");
    let ret = await model.resetModuleQuery(http.get('moduleid'));

    return this.json(ret);
  }

    /**
     * 删除不显示的查询列设置， POST调用： /cmpage/module/query_delete_no_show
     * @method  query_delete_no_show
     * @return {json} 状态信息
     */
  async queryDeleteNoShowAction(){
    let http = this.http;

    let ret = await this.model('t_module_query').query(`delete from t_module_query where c_module=${http.get('moduleid')} and c_isshow=FALSE`);

    return this.json(ret);
  }

    /**
     * 保存业务模块查询列的设置， POST调用： /cmpage/module/query_save
     * @method  query_save
     * @return {json} 保存记录的状态信息
     */
  async querySaveAction(){
    let http = this.http;
    let model = this.model("t_module_query");
    let posts = http.post();

    for(let i=0; i< 100 ; i++){
      if (!posts[`editList[${i}].c_order`]){
        break;
      }
      if(!think.isEmpty(posts[`editList[${i}].c_column`])){
        let md={c_time:think.datetime()};
        md.c_module = posts['c_module'];
        md.c_order = posts[`editList[${i}].c_order`];
        md.c_column = posts[`editList[${i}].c_column`];
        md.c_coltype = posts[`editList[${i}].c_coltype`];
        md.c_name = posts[`editList[${i}].c_name`];
        md.c_desc = posts[`editList[${i}].c_desc`];
        md.c_op = posts[`editList[${i}].c_op`];
        md.c_isshow = !think.isEmpty(posts[`editList[${i}].c_isshow`]);
        md.c_default = posts[`editList[${i}].c_default`];
        md.c_type = posts[`editList[${i}].c_type`];
        md.c_format = posts[`editList[${i}].c_format`];
        md.c_width = posts[`editList[${i}].c_width`];
        md.c_style = posts[`editList[${i}].c_style`];
        md.c_suffix = posts[`editList[${i}].c_suffix`];
        md.c_mui = posts[`editList[${i}].c_mui`];
        md.c_memo = posts[`editList[${i}].c_memo`];
        //global.debug(md);
          if(think.isEmpty(posts[`editList[${i}].id`])){
              await model.add(global.checksql(md));
          }else{
              await model.where({id: parseInt(posts[`editList[${i}].id`])}).update(global.checksql(md));
          }

      }
    }
      await think.cache(`moduleQuery${ posts['c_module']}`,null);
    return this.json({statusCode:200,message:'保存成功！'});
  }

    /**
     * 模块按钮设置页面，调用：/cmpage/module/btn_list?moduleid=xxx
     * @method  btnList
     * @return {Promise} HTML页面
     */
  async btnListAction(){
    let http =this.http;

    let md =await   this.model('t_module').where({id:http.get('moduleid')}).find();
    let model = this.model("module");

    let vb={};
    vb.editList = await  this.model('t_module_btn').where({c_module:http.get('moduleid')}).order('c_location ').select();
//console.log(vb.editList);
    this.assign("vb",vb);
    this.assign("md",md);
    return this.display();
  }

    /**
     * 重新设置模块按钮，调用：/cmpage/module/btn_reset?moduleid=xxx
     * @method  btnReset
     * @return {json}
     */
    async btnResetAction(){
        let model = this.model("module");
        let ret = await model.resetModuleBtn(this.get('moduleid'));
        await think.cache(`moduleBtn${ this.get('moduleid')}`,null);

        return this.json(ret);
    }

    /**
     * 保存业务模块的按钮设置， POST调用： /cmpage/module/btn_save
     * @method  btn_save
     * @return {json} 保存记录的状态信息
     */
  async btnSaveAction(){
    let http = this.http;
    let model = this.model("t_module_btn");
    let posts = http.post();

    for(let i=0; i< 100 ; i++){
      if(!think.isEmpty(posts[`editList[${i}].c_object`])){
        let md={};
        md.c_module = posts['c_module'];
        md.c_location = posts[`editList[${i}].c_location`];
        md.c_label = posts[`editList[${i}].c_label`];
        md.c_object = posts[`editList[${i}].c_object`];
        md.c_isshow = !think.isEmpty(posts[`editList[${i}].c_isshow`]);
        md.c_class = posts[`editList[${i}].c_class`];
        md.c_style = posts[`editList[${i}].c_style`];
        md.c_url = posts[`editList[${i}].c_url`];
        md.c_opentype = posts[`editList[${i}].c_opentype`];
        md.c_options = posts[`editList[${i}].c_options`];
        md.c_title = posts[`editList[${i}].c_title`];
        md.c_icon = posts[`editList[${i}].c_icon`];
        md.c_onclick = posts[`editList[${i}].c_onclick`];
        md.c_mui = posts[`editList[${i}].c_mui`];
        md.c_memo = posts[`editList[${i}].c_memo`];
        global.debug(JSON.stringify(md));
          if(think.isEmpty(posts[`editList[${i}].id`])){
              await model.add(global.checksql(md));
          }else{
              await model.where({id: parseInt(posts[`editList[${i}].id`])}).update(global.checksql(md));
          }
      }else{
        break;
      }
    }
      await think.cache(`moduleBtn${ posts['c_module']}`,null);
    return this.json({statusCode:200,message:'保存成功！'});
  }

}
