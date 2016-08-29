'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * model
 */

export default class extends think.model.base {

    //数据库中字段的类型
    colTypes(){
        return ["varchar", "int4","integer","date","timestamp","bool","decimal","float" ];
    }
    //分页列表中各项的显示类型
    showTypes(){
        return [{value:"text",text:"文本"},{value:"checkbox",text:"是否选中"},{value:"replace",text:"替换"},{value:"html",text:"HTML"},
        {value:"navtab",text:"Tab页面"},{value:"dialog",text:"对话框"},{value:"kindeditor",text:"富文本"}];
    }
    //分页列表中最后一行是合计的设置类型
    sumTypes(){
        return [{value:"none",text:"无"},{value:"text",text:"文本"},{value:"sum",text:"合计"},{value:"avg",text:"平均"}];
    }
    //编辑页面的控件类型
    editTypes(){
        return [{value:"text",text:"文本"},{value:"textarea",text:"多行文本"},{value:"number",text:"数字"},{value:"datetime",text:"日期"},
            {value:"checkbox",text:"是否选中"},{value:"select",text:"下拉选择"},{value:"selectBlank",text:"下拉可空"},{value:"lookup",text:"查找带回"},
            {value:"hidden",text:"隐藏"},{value:"areaSelect",text:"地区联动"},{value:"readonly",text:"只读"},{value:"readonlyReplace",text:"只读替换"},{value:"kindeditor",text:"富文本"}];
    }
    //查询项的控件类型
    queryTypes(){
        return [{value:"text",text:"文本"},{value:"number",text:"数字"},{value:"datetime",text:"时间"},{value:"checkbox",text:"是否选中"},{value:"select",text:"下拉选择"},
            {value:"fixed",text:"固定"},{value:"lookup",text:"查找带回"},{value:"hidden",text:"隐藏"},
            {value:"provinceSelect",text:"省份选择"},{value:"citySelect",text:"城市选择"},{value:"countrySelect",text:"区县选择"}];
    }

    //查询条件中的操作符
    operations(){
        return [{op:'EQ',des:'等于'},{op:'NE',des:'不等于'},{op:'CN',des:'包含'},{op:'NC',des:'不包含'},{op:'IN',des:'在其中'},{op:'NI',des:'不在其中'},
            {op:'GE',des:'大于等于'},{op:'LE',des:'小于等于'},{op:'GT',des:'大于'},{op:'LT',des:'小于'}];
    }

    //从数据源取字段名称和类型
    async getAllColumns(table){
        let sql=`SELECT
                a.attnum,
                a.attname AS column,
                t.typname AS type,
                case when a.attlen >0 then a.attlen else a.atttypmod end AS length,
                a.attnotnull AS notnull,
                col_description(a.attrelid,a.attnum) as comment
        FROM
                pg_class c,
                pg_attribute a,
                pg_type t
        WHERE
                c.relname = '${table}'
                and a.attnum > 0
                and a.attrelid = c.oid
                and a.atttypid = t.oid `;
        let list= await this.query(sql);

        //let list =await this.model.getSchema(table);
        return list;
    }
    //从table的字段列表中取字段说明
    getColumnComment(comments, column){
        for(let item of comments){
            if(item.column === column ){
                return (think.isEmpty(item.comment) ? column : item.comment);
            }
        }
        return column;
    }

    async resetModuleCol(moduleID){
        if(moduleID <=0){
            return {statusCode:300,message:'模块不存在！'};
        }
        let md = await this.model('t_module').where({id:moduleID}).find();
        let model =this.model('t_module_col');
//        let count=await model.query(`select count(*) from pg_class where relname='${md.c_datasource}'`);
        let tableMd = await this.model('pg_class').where({relname:md.c_datasource}).find();
        if(tableMd.length <=0){
            return {statusCode:300,message:'该数据源不存在！'};
        }
        await model.execute('delete from t_module_col where c_module='+md.id);
        let columns = await this.getAllColumns(md.c_datasource);
        let comments = [];
        if(md.c_datasource !== md.c_table){
            comments = await this.getAllColumns(md.c_table);;
        }else{
            Object.assign(comments,columns);
        }
        for (let [k,col] of columns.entries()) {
            let colmd = {c_module:md.id, c_column:col.column, c_coltype:col.type, c_scale:col.length, c_name:this.getColumnComment(comments,col.column),
                c_desc : col.column, c_type:'text', c_format: "", c_order:(k+1), c_width:50, c_style:'',
                c_isretrieve:true, c_isshow:(col.column !== 'id'),c_isview:(col.column !== 'id'), c_user:0, c_time: think.datetime(),
                c_type_sum:'none', c_memo:'', c_mui:''};
            model.add(colmd);
        }
        return {statusCode:200,message:''};
    }

    async resetModuleEdit(moduleID){
        if(moduleID <=0){
            return {statusCode:300,message:'模块不存在！'};
        }
        let md = await this.model('t_module').where({id:moduleID}).find();
        let model =this.model('t_module_edit');
        let tableMd = await this.model('pg_class').where({relname:md.c_datasource}).find();
        if(tableMd.length <=0){
            return {statusCode:300,message:'该数据源不存在！'};
        }
        model.where({id: ["=", md.id]}).delete();
        //await model.execute('delete from t_module_edit where c_module='+md.id);
        let columns = await this.getAllColumns(md.c_datasource);
        let comments = [];
        if(md.c_datasource !== md.c_table){
            comments = await this.getAllColumns(md.c_table);;
        }else{
            Object.assign(comments,columns);
        }
        for (let [k,col] of columns.entries()) {
            let colmd = {c_module:md.id, c_column:col.column, c_coltype:col.type, c_scale:col.length, c_name:this.getColumnComment(comments,col.column),
                c_desc : col.column,c_editable:true, c_type:(['id','c_time','c_user','c_group'].indexOf(col.column) !== -1 ? 'hidden':(col.type==='bool'? 'checkbox':'text')),
                c_format:'', c_order:(k+1), c_width:35, c_style:'',
                c_suffix:'', c_isshow:true,c_isrequired:false, c_user:0, c_time: think.datetime(), c_memo:'', c_mui:'',c_validate_rules:''};
            model.add(colmd);
        }
        return {statusCode:200,message:''};
    }

    async resetModuleQuery(moduleID){
        if(moduleID <=0){
            return {statusCode:300,message:'模块不存在！'};
        }
        let md = await this.model('t_module').where({id:moduleID}).find();
        let model =this.model('t_module_query');
        let tableMd = await this.model('pg_class').where({relname:md.c_datasource}).find();
        if(tableMd.length <=0){
            return {statusCode:300,message:'该数据源不存在！'};
        }
        model.where({c_module:md.id}).delete();
        //await model.execute('delete from t_module_query where c_module='+md.id);
        let columns = await this.getAllColumns(md.c_datasource);
        let comments = [];
        if(md.c_datasource !== md.c_table){
            comments = await this.getAllColumns(md.c_table);;
        }else{
            Object.assign(comments,columns);
        }
        for (let [k,col] of columns.entries()) {
            let colmd = {c_module:md.id, c_column:col.column, c_coltype:col.type, c_scale:col.length, c_name:this.getColumnComment(comments,col.column),
                c_desc : col.column,c_type:(col.column ==='id' ? 'hidden':'text'),c_default:'', c_format:'', c_order:(k+1), c_width:20, c_style:'',
                c_suffix:'', c_isshow:false,c_panel_index:0, c_user:0, c_time: think.datetime(), c_memo:'', c_mui:''};
            model.add(colmd);
            //await model.execute(global.getInsertSql(colmd,'t_module_query'));
        }
        return {statusCode:200,message:''};
    }

    async resetModuleBtn(moduleID){
        if(moduleID <=0){
            return {statusCode:300,message:'模块不存在！'};
        }
        let md = await this.model('t_module').where({id:moduleID}).find();
        let model =this.model('t_module_btn');
        let tableMd = await this.model('pg_class').where({relname:md.c_datasource}).find();
        if(tableMd.length <=0){
            return {statusCode:300,message:'该数据源不存在！'};
        }
        model.where({c_module:md.id}).delete();
        //await model.execute('delete from t_module_btn where c_module='+md.id);

        let colmd = {c_module:md.id, c_isshow:true,c_style:'',c_opentype:'dialog',c_class:'btn btn-green', c_onclick:'', c_memo:'', c_mui:'',
            c_title:'新增',c_label:'新增',c_location:0,c_object:md.c_modulename+'.Add', c_url:`/cmpage/page/edit?modulename=${md.c_modulename}*id=0`,
            c_options:`{id:##page${md.c_modulename}Edit##, mask:true, width:600, height:400 }`, c_icon:'plus'};
        model.add(colmd);
        //await model.execute(global.getInsertSql(colmd,'t_module_btn'));

        colmd = {c_module:md.id, c_isshow:true,c_style:'',c_opentype:'#',c_class:'btn btn-orange', c_onclick:`return page${md.c_modulename}ExportData(this);`, c_memo:'', c_mui:'',
            c_title:'导出',c_label:'导出',c_location:5,c_object:md.c_modulename+'.ExportData', c_url:'#', c_options:'', c_icon:'file-excel-o'};
        model.add(colmd);
        //await model.execute(global.getInsertSql(colmd,'t_module_btn'));

        colmd = {c_module:md.id, c_isshow:true,c_style:'',c_opentype:'dialog',c_class:'btn btn-default', c_onclick:'', c_memo:'', c_mui:'',
            c_title:'查看',c_label:'',c_location:11,c_object:md.c_modulename+'.View', c_url:`/cmpage/page/view?modulename=${md.c_modulename}*id=#id#`,
            c_options:`{id:##page${md.c_modulename}View##, mask:true, width:600, height:400 }`, c_icon:'info'};
        model.add(colmd);
        //await model.execute(global.getInsertSql(colmd,'t_module_btn'));

        colmd = {c_module:md.id, c_isshow:true,c_style:'',c_opentype:'dialog',c_class:'btn btn-green', c_onclick:'', c_memo:'', c_mui:'',
            c_title:'编辑',c_label:'编辑',c_location:12,c_object:md.c_modulename+'.Edit', c_url:`/cmpage/page/edit?modulename=${md.c_modulename}*id=#id#`,
            c_options:`{id:##page${md.c_modulename}Edit##, mask:true, width:600, height:400 }`, c_icon:'edit'};
        model.add(colmd);
        //await model.execute(global.getInsertSql(colmd,'t_module_btn'));

        colmd = {c_module:md.id, c_isshow:true,c_style:'',c_opentype:'#',c_class:'btn btn-red', c_onclick:`return page${md.c_modulename}Del(#id#,this);`, c_memo:'', c_mui:'',
            c_title:'删除',c_label:'',c_location:13,c_object:md.c_modulename+'.Del', c_url:'#', c_options:'', c_icon:'times'};
        model.add(colmd);
        //await model.execute(global.getInsertSql(colmd,'t_module_btn'));

        return {statusCode:200,message:''};
    }

//    //按模块名称和ID取模块设置，放入缓存
//    async setModuleCache(){
//        let isSet = await think.cache('isSetModuleCache');
//        if(think.isEmpty(isSet)) {
//            let modules = await this.query('select * from t_module where c_status=0 order by id');
//            //let modules = await this.model('t_module').where({c_status:0}).order('id asc').select();
////        global.debug(modules);
//            for (let module of modules) {
//                let moduleCol = await    this.query(`select * from t_module_col where c_module=${module.id} order by c_order`);
//                let moduleQuery = await  this.query(`select * from t_module_query where c_module=${module.id} order by c_order`);
//                let moduleEdit = await   this.query(`select * from t_module_edit where c_module=${module.id} order by c_order`);
//                let moduleBtn = await   this.query(`select * from t_module_btn where c_module=${module.id} order by c_location`);
//
//                await think.cache(`module${module.id}`, module);
//                await think.cache(`modulename${module.c_modulename}`, module);
//                await think.cache(`moduleCol${module.id}`, moduleCol);
//                await think.cache(`moduleQuery${module.id}`, moduleQuery);
//                await think.cache(`moduleEdit${module.id}`, moduleEdit);
//                await think.cache(`moduleBtn${module.id}`, moduleBtn);
//            }
//            await think.cache('isSetModuleCache', 'true');
//        }
//    }
    //清空模块缓存
    async clearModuleCache(){
        let modules = await this.query('select * from t_module where c_status=0 order by id');
        for(let module of modules){
            await think.cache(`module${module.id}`,null);
            await think.cache(`modulename${module.c_modulename}`,null);
            await think.cache(`moduleCol${module.id}`,null);
            await await await await think.cache(`moduleQuery${module.id}`,null);
            await think.cache(`moduleEdit${module.id}`,null);
            await think.cache(`moduleBtn${module.id}`,null);
        }
        await think.cache('isSetModuleCache', null);
    }

    //取模块主信息，如果不存在，则刷新模块缓存
    async getModuleFromCache(modulename){
        let page = await think.cache(`modulename${modulename}`);
        if(think.isEmpty(page)){
            await this.setModuleCache();
            page = await think.cache(`modulename${modulename}`);
        }
        return page;
    }

    //拷贝模块信息
    async copyToNewModule(modulename){
        let list = await this.query(`select * from t_module where c_modulename ='${modulename}_copy'`);
        if(list.length >0) {
            return {statusCode: 300, message: `模块 ${modulename}_copy 已经存在！`};
        }

        await this.query(`select f_module_copy('${modulename}')`);

        return {statusCode: 200, message: `模块复制成功！`};
    }
    /*******************从缓存中取模块设置，如果没有，则刷新缓存********--begin--****************/
    async getModuleById(moduleID){
        return await think.cache(`module${moduleID}`, () => {
            return  this.query(`select * from t_module where id = ${moduleID}`);  //model('t_module').where({id:moduleID}).find(); //
        });
    }
    async getModuleNameById(moduleID){
        let md = await this.getModuleById(moduleID);
        return !think.isEmpty(md) ? md[0].c_modulename: '';
    }
    async getModuleAliasById(moduleID){
        let md = await this.getModuleById(moduleID);
        return !think.isEmpty(md) ? md[0].c_alias: '';
    }

    async getModuleByName(modulename){
        return await think.cache(`modulename${modulename}`, () => {
            return this.model('t_module').where({c_modulename:modulename,c_status:0}).find();  //query(`select * from t_module where c_modulename = '${modulename}' and c_status=0`);
        });
    }
    async getModuleCol(moduleID){
        return await think.cache(`moduleCol${moduleID}`, () => {
            return this.query(`select * from t_module_col where c_module = ${moduleID} order by c_order`);
        });
    }
    async getModuleEdit(moduleID){
        return await think.cache(`moduleEdit${moduleID}`, () => {
            return this.query(`select * from t_module_edit where c_module = ${moduleID} order by c_order`);
        });
    }
    async getModuleQuery(moduleID){
        return await think.cache(`moduleQuery${moduleID}`, () => {
            return this.query(`select * from t_module_query where c_module = ${moduleID} order by c_order`);
        });
    }
    async getModuleBtn(moduleID){
        return await think.cache(`moduleBtn${moduleID}`, () => {
            return this.query(`select * from t_module_btn where c_module = ${moduleID} order by c_location`);
        });
    }
    /*******************从缓存中取模块设置，如果没有，则刷新缓存********--end--****************/

}
