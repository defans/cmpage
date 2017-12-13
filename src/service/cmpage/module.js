'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

const Base = require('./base.js');
module.exports = class extends Base {
    constructor() {
        super();
        this.connStr = 'cmpage';
    }
    //数据库连接配置的名称
    connNames() {
        return ["admin", "cmpage", "docu"];
    }
    //数据库中字段的类型
    colTypes() {
        return ["varchar", "int", "date", "timestamp", "bool", "float"];
    }
    //分页列表中各项的显示类型
    showTypes() {
        return [{
            value: "text",
            text: "文本"
        }, {
            value: "checkbox",
            text: "是否选中"
        }, {
            value: "replace",
            text: "替换"
        }, {
            value: "pic",
            text: "图片"
        }, {
            value: "html",
            text: "HTML"
        }]; //,
        //{value:"navtab",text:"Tab页面"},{value:"dialog",text:"对话框"},{value:"kindeditor",text:"富文本"}];
    }
    //分页列表中最后一行是合计的设置类型
    sumTypes() {
        return [{
            value: "none",
            text: "无"
        }, {
            value: "text",
            text: "文本"
        }, {
            value: "sum",
            text: "合计"
        }, {
            value: "avg",
            text: "平均"
        }];
    }

    //编辑页面的控件类型
    editTypes() {
        return [{
                value: "text",
                text: "文本"
            }, {
                value: "textarea",
                text: "多行文本"
            }, {
                value: "number",
                text: "数字"
            }, {
                value: "datetime",
                text: "日期时间"
            },
            {
                value: "checkbox",
                text: "是否选中"
            }, {
                value: "select",
                text: "下拉单选"
            }, {
                value: "selectMultiple",
                text: "下拉多选"
            }, {
                value: "lookup",
                text: "查找带回"
            },
            {
                value: "hidden",
                text: "隐藏"
            }, {
                value: "areaSelect",
                text: "地区联动"
            }, {
                value: "codeSelect",
                text: "代码联动"
            }, {
                value: "readonly",
                text: "只读"
            },
            {
                value: "kindeditor",
                text: "富文本"
            }, {
                value: "selectTree",
                text: "下拉树单选"
            }, {
                value: "selectTreeMultiple",
                text: "下拉树多选"
            }, {
                value: "fileUpload",
                text: "文件上传"
            }
        ];
    }
    //查询项的控件类型
    queryTypes() {
        return [{
                value: "text",
                text: "文本"
            }, {
                value: "number",
                text: "数字"
            }, {
                value: "datetime",
                text: "时间"
            }, {
                value: "checkbox",
                text: "是否选中"
            }, {
                value: "select",
                text: "下拉单选"
            }, {
                value: "selectMultiple",
                text: "下拉多选"
            },
            {
                value: "selectTree",
                text: "下拉树单选"
            }, {
                value: "selectTreeMultiple",
                text: "下拉树多选"
            }, {
                value: "fixed",
                text: "固定"
            }, {
                value: "lookup",
                text: "查找带回"
            }, {
                value: "hidden",
                text: "隐藏"
            },
            {
                value: "areaSelect",
                text: "地区联动"
            }, {
                value: "codeSelect",
                text: "代码联动"
            }
        ];
    }

    //查询条件中的操作符
    operations() {
        return [{
                op: 'EQ',
                des: '等于'
            }, {
                op: 'NE',
                des: '不等于'
            }, {
                op: 'CN',
                des: '包含'
            }, {
                op: 'NC',
                des: '不包含'
            }, {
                op: 'IN',
                des: '在其中'
            }, {
                op: 'NI',
                des: '不在其中'
            },
            {
                op: 'GE',
                des: '大于等于'
            }, {
                op: 'LE',
                des: '小于等于'
            }, {
                op: 'GT',
                des: '大于'
            }, {
                op: 'LT',
                des: '小于'
            }, {
                op: 'NO',
                des: '不操作'
            }
        ];
    }

    //从数据源取字段名称和类型
    async getAllColumns(datasource, table, path) {
        let configModel = think.config("model");
        //debug(configModel,'cmpage.module - getAllColumns');
        let config = configModel.admin;
        let sql = '';
        if (config.type === 'postgresql') {
            sql = `SELECT    a.attnum,  a.attname AS column,  t.typname AS type,   case when a.attlen >0 then a.attlen else a.atttypmod end AS length,  a.attnotnull AS notnull,  col_description(a.attrelid,a.attnum) as comment
                FROM   pg_class c,   pg_attribute a,   pg_type t WHERE   c.relname = '${datasource}'  and a.attnum > 0  and a.attrelid = c.oid  and a.atttypid = t.oid `;;
        } else if (config.type === 'mssql') {
            sql = `SELECT a.colorder, a.name as [column],b.name as [type],collen=a.length
                 FROM syscolumns a left join systypes b on a.xusertype=b.xusertype  inner join sysobjects d on a.id=d.id   and   d.name<>'dtproperties'
                where d.name='${datasource}' order by a.id,a.colorder`;
        } else {
            sql = `SHOW FULL COLUMNS FROM ${datasource}`;
        }
        let ret = [];
        let list = await think.model('cmpage/base', config).query(sql);
        //debug(list,'module.getAllColumns - list');
        if (config.type === 'postgresql') {
            ret = list;
        } else if (config.type === 'mssql') {
            ret = list;
            let comments = await think.model('cmpage/base', config).query(`SELECT * FROM sysproperties  where TableName= '${table}'`);
            for (let comment of comments) {
                for (let col of ret) {
                    if (col.column == comment.ColName) {
                        col.comment = comment.PropValue;
                        break
                    }
                }
            }
        } else {
            for (let col of list) {
                ret.push({
                    column: col.Field,
                    type: col.Type,
                    comment: col.Comment
                })
            }
        }
        for (let col of ret) {
            if (col.type === 'bit' || col.type === 'boolean' || col.type === 'tinyint(1)') {
                col.type = 'bool';
            } else if (col.type.indexOf('int') === 0 || col.type.indexOf('bigint') === 0 || col.type.indexOf('tinyint') === 0) {
                col.type = 'int';
            } else if (col.type === 'date' || col.type === 'smalldatetime') {
                col.type = 'date';
            } else if (col.type.indexOf('timestamp') === 0 || col.type === 'datetime') {
                col.type = 'timestamp';
            } else if (col.type.indexOf('decimal') === 0 || col.type.indexOf('numeric') === 0 || col.type.indexOf('float') === 0 ||
                col.type.indexOf('real') === 0 || col.type.indexOf('double') === 0) {
                col.type = 'float';
                //}else {
                //    col.type = 'varchar';
            }
            if (config.type === 'mysql') {
                col.length = 0;
            }
        }
        return ret;
    }
    //从table的字段列表中取字段说明
    getColumnComment(comments, column) {
        for (let item of comments) {
            if (item.column === column) {
                return (think.isEmpty(item.comment) ? column : item.comment);
            }
        }
        return column;
    }

    async resetModuleCol(moduleID) {
        if (moduleID <= 0) {
            return {
                statusCode: 300,
                message: '模块不存在！'
            };
        }
        let md = await this.model('t_module', 'cmpage').where({
            id: moduleID
        }).find();
        let model = this.model('t_module_col', 'cmpage');

        //await model.where({c_module: md.id}).delete();
        let columns = await this.getAllColumns(md.c_datasource, md.c_table, md.c_path);
        if (columns.length === 0) {
            return {
                statusCode: 200,
                message: '没有列数据，请确认数据连接是否正确。'
            };
        }
        let comments = [];
        if (md.c_datasource !== md.c_table) {
            comments = await this.getAllColumns(md.c_table, md.c_table, md.c_path);
        } else {
            Object.assign(comments, columns);
        }
        let mcols = await this.getModuleCol(moduleID);
        for (let [k, col] of columns.entries()) {
            //如果列已经设置过，则跳过
            let exist = false;
            for (let mcol of mcols) {
                if (mcol.c_column === col.column) {
                    exist = true;
                    break;
                }
            }
            if (exist) {
                continue;
            }

            let colmd = {
                c_module: md.id,
                c_column: col.column,
                c_coltype: col.type,
                c_scale: col.length,
                c_name: this.getColumnComment(comments, col.column),
                c_desc: col.column,
                c_type: 'text',
                c_format: "",
                c_order: (k + 1),
                c_width: 50,
                c_style: '',
                c_isretrieve: true,
                c_isshow: (col.column !== 'id'),
                c_isview: (col.column !== 'id'),
                c_user: 0,
                c_time: think.datetime(),
                c_type_sum: 'none',
                c_memo: '',
                c_mui: ''
            };
            if (col.type === 'timestamp') {
                colmd.c_format = 'yyyy-MM-dd HH:mm:ss';
            } else if (col.type === 'date') {
                colmd.c_format = 'yyyy-MM-dd';
            }
            await model.add(cmpage.checksql(colmd));
        }
        return {
            statusCode: 200,
            message: ''
        };
    }

    async resetModuleEdit(moduleID) {
        if (moduleID <= 0) {
            return {
                statusCode: 300,
                message: '模块不存在！'
            };
        }
        let md = await this.model('t_module', 'cmpage').where({
            id: moduleID
        }).find();
        let model = this.model('t_module_edit', 'cmpage');

        //await model.where({c_module: md.id}).delete();
        let columns = await this.getAllColumns(md.c_datasource, md.c_table, md.c_path);
        if (columns.length === 0) {
            return {
                statusCode: 200,
                message: '没有列数据，请确认数据连接是否正确。'
            };
        }
        let comments = [];
        if (md.c_datasource !== md.c_table) {
            comments = await this.getAllColumns(md.c_table, md.c_table, md.c_path);
        } else {
            Object.assign(comments, columns);
        }
        let mcols = await this.getModuleEdit(moduleID);
        for (let [k, col] of columns.entries()) {
            //如果列已经设置过，则跳过
            let exist = false;
            for (let mcol of mcols) {
                if (mcol.c_column === col.column) {
                    exist = true;
                    break;
                }
            }
            if (exist) {
                continue;
            }

            let colmd = {
                c_module: md.id,
                c_column: col.column,
                c_coltype: col.type,
                c_scale: col.length,
                c_name: this.getColumnComment(comments, col.column),
                c_desc: col.column,
                c_editable: true,
                c_type: 'text',
                c_format: '',
                c_order: (k + 1),
                c_width: 28,
                c_style: '',
                c_suffix: '',
                c_isshow: true,
                c_isrequired: false,
                c_user: 0,
                c_time: think.datetime(),
                c_memo: '',
                c_other: '',
                c_mui: '',
                c_validate_rules: ''
            };
            if (['id', 'c_time', 'c_user', 'c_group'].indexOf(col.column) !== -1) {
                colmd.c_type = 'hidden';
            } else if (col.type === 'bool') {
                colmd.c_type = 'checkbox';
            } else if (col.type === 'timestamp' || col.type === 'date') {
                colmd.c_type = 'datetime';
            }
            await model.add(cmpage.checksql(colmd));
        }
        return {
            statusCode: 200,
            message: ''
        };
    }

    async resetModuleQuery(moduleID) {
        if (moduleID <= 0) {
            return {
                statusCode: 300,
                message: '模块不存在！'
            };
        }
        let md = await this.model('t_module', 'cmpage').where({
            id: moduleID
        }).find();
        let model = this.model('t_module_query', 'cmpage');
        //await model.where({c_module: md.id}).delete();
        let columns = await this.getAllColumns(md.c_datasource, md.c_table, md.c_path);
        if (columns.length === 0) {
            return {
                statusCode: 200,
                message: '没有列数据，请确认数据连接是否正确。'
            };
        }
        let comments = [];
        if (md.c_datasource !== md.c_table) {
            comments = await this.getAllColumns(md.c_table, md.c_table, md.c_path);
        } else {
            Object.assign(comments, columns);
        }
        let mcols = await this.getModuleQuery(moduleID);
        for (let [k, col] of columns.entries()) {
            //如果列已经设置过，则跳过
            let exist = false;
            for (let mcol of mcols) {
                if (mcol.c_column === col.column) {
                    exist = true;
                    break;
                }
            }
            if (exist) {
                continue;
            }

            let colmd = {
                c_module: md.id,
                c_column: col.column,
                c_coltype: col.type,
                c_scale: col.length,
                c_name: this.getColumnComment(comments, col.column),
                c_desc: col.column,
                c_type: (col.column === 'id' ? 'hidden' : 'text'),
                c_default: '',
                c_format: '',
                c_order: (k + 1),
                c_width: 12,
                c_style: '',
                c_suffix: '',
                c_isshow: false,
                c_panel_index: 0,
                c_user: 0,
                c_time: think.datetime(),
                c_memo: '',
                c_mui: ''
            };
            await model.add(cmpage.checksql(colmd));
        }
        return {
            statusCode: 200,
            message: ''
        };
    }

    async resetModuleBtn(moduleID) {
        if (moduleID <= 0) {
            return {
                statusCode: 300,
                message: '模块不存在！'
            };
        }
        let md = await this.model('t_module', 'cmpage').where({
            id: moduleID
        }).find();
        let model = this.model('t_module_btn', 'cmpage');
        //await model.where({c_module: md.id}).delete();
        let colnames = cmpage.arrGetValuesByColumnName(await this.getModuleBtn(moduleID), 'c_object');

        //cmpage.debug(colnames,'module.resetModuleBtn - colnames');
        if (colnames.indexOf(md.c_modulename + '.Add') === -1) {
            let colmd = {
                c_module: md.id,
                c_isshow: true,
                c_style: '',
                c_opentype: 'dialog',
                c_class: 'btn btn-green',
                c_onclick: '',
                c_memo: '',
                c_mui: '',
                c_title: '新增',
                c_label: '新增',
                c_location: 0,
                c_object: md.c_modulename + '.Add',
                c_url: `/cmpage/page/edit?modulename=${md.c_modulename}*id=0`,
                c_options: `{id:'page${md.c_modulename}Edit', mask:true, width:600, height:500 }`,
                c_icon: 'plus'
            };
            await model.add(cmpage.checksql(colmd));
        }

        if (colnames.indexOf(md.c_modulename + '.ExportData') === -1) {
            let colmd = {
                c_module: md.id,
                c_isshow: true,
                c_style: '',
                c_opentype: '#',
                c_class: 'btn btn-orange',
                c_onclick: `return pageExportData();`,
                c_memo: '',
                c_mui: '',
                c_title: '导出',
                c_label: '导出',
                c_location: 5,
                c_object: md.c_modulename + '.ExportData',
                c_url: '#',
                c_options: '',
                c_icon: 'file-excel-o'
            };
            await model.add(cmpage.checksql(colmd));
        }

        if (colnames.indexOf(md.c_modulename + '.View') === -1) {
            let colmd = {
                c_module: md.id,
                c_isshow: true,
                c_style: '',
                c_opentype: 'dialog',
                c_class: 'btn btn-default',
                c_onclick: '',
                c_memo: '',
                c_mui: '',
                c_title: '查看',
                c_label: '',
                c_location: 11,
                c_object: md.c_modulename + '.View',
                c_url: `/cmpage/page/view?modulename=${md.c_modulename}*id=#id#`,
                c_options: `{id:'page${md.c_modulename}View', mask:true, width:600, height:500 }`,
                c_icon: 'info'
            };
            await model.add(cmpage.checksql(colmd));
        }

        if (colnames.indexOf(md.c_modulename + '.Edit') === -1) {
            let colmd = {
                c_module: md.id,
                c_isshow: true,
                c_style: '',
                c_opentype: 'dialog',
                c_class: 'btn btn-green',
                c_onclick: '',
                c_memo: '',
                c_mui: '',
                c_title: '编辑',
                c_label: '编辑',
                c_location: 12,
                c_object: md.c_modulename + '.Edit',
                c_url: `/cmpage/page/edit?modulename=${md.c_modulename}*id=#id#`,
                c_options: `{id:'page${md.c_modulename}Edit', mask:true, width:600, height:500 }`,
                c_icon: 'edit'
            };
            await model.add(cmpage.checksql(colmd));
        }

        if (colnames.indexOf(md.c_modulename + '.Del') === -1) {
            let colmd = {
                c_module: md.id,
                c_isshow: true,
                c_style: '',
                c_opentype: '#',
                c_class: 'btn btn-red',
                c_onclick: `return pageDelete(#id#,this);`,
                c_memo: '',
                c_mui: '',
                c_title: '删除',
                c_label: '',
                c_location: 13,
                c_object: md.c_modulename + '.Del',
                c_url: '#',
                c_options: '',
                c_icon: 'times'
            };
            await model.add(cmpage.checksql(colmd));
        }

        return {
            statusCode: 200,
            message: ''
        };
    }

    //清空模块缓存
    async clearModuleCache() {
        let modules = await this.query('select * from t_module where c_status=0 order by id');
        for (let module of modules) {
            await think.cache(`module${module.id}`, null);
            await think.cache(`modulename${module.c_modulename}`, null);
            await think.cache(`moduleCol${module.id}`, null);
            await think.cache(`moduleQuery${module.id}`, null);
            await think.cache(`moduleEdit${module.id}`, null);
            await think.cache(`moduleBtn${module.id}`, null);
        }
        await think.cache('isSetModuleCache', null);
    }

    //取模块主信息，如果不存在，则刷新模块缓存
    async getModuleFromCache(modulename) {
        let page = await think.cache(`modulename${modulename}`);
        if (think.isEmpty(page)) {
            await this.setModuleCache();
            page = await think.cache(`modulename${modulename}`);
        }
        return page;
    }

    //拷贝模块信息
    async copyToNewModule(modulename, newName) {
        newName = think.isEmpty(newName) ? modulename + '_copy' : newName;
        let list = await this.query(`select * from t_module where c_modulename='${modulename}'`);
        if (list.length <= 0) return {
            statusCode: 300,
            message: `未取到原模块信息！`
        };
        //        debug(list,'module.copyModuleFromMssql - list');
        let rec = list[0];
        debug(rec, 'module.copyToNewModule - rec');
        //        if(think.isEmpty(rec))  return;
        let oldID = rec.id;
        delete rec.id;
        rec.c_modulename = newName;

        let newID = await this.model('t_module', 'cmpage').add(rec);
        if (newID == 0) return {
            statusCode: 300,
            message: `增加新模块信息失败！`
        };

        //复制 cols
        list = await this.query(`select * from t_module_col where c_module=${oldID}`);
        for (let md of list) {
            md.c_module = newID;
            delete md.id;
            await this.model('t_module_col', 'cmpage').add(md);
        }
        //复制 querys
        list = await this.query(`select * from t_module_query where c_module=${oldID}`);
        for (let md of list) {
            md.c_module = newID;
            delete md.id;
            await this.model('t_module_query', 'cmpage').add(md);
        }
        if (newName.indexOf('Lookup') < 0) { //查找带回的模块设置不需要按钮和编辑列的设置
            //复制 btns
            list = await this.query(`select * from t_module_btn where c_module=${oldID}`);
            for (let md of list) {
                md.c_module = newID;
                delete md.id;
                md.c_object = md.c_object.replace(modulename, newName);
                md.c_url = md.c_url.replace(modulename, newName);
                md.c_options = md.c_options.replace(modulename, newName);
                await this.model('t_module_btn', 'cmpage').add(md);
            }
            //复制 edits
            list = await this.query(`select * from t_module_edit where c_module=${oldID}`);
            for (let md of list) {
                md.c_module = newID;
                delete md.id;
                await this.model('t_module_edit', 'cmpage').add(md);
            }
        }
        return {
            statusCode: 200,
            message: `模块复制成功！`
        };
    }

    async copyModuleFromMssql(modulename, config) {
        if (think.isEmpty(config)) {
            config = {
                type: 'mssql',
                adapter: {
                    mssql: {
                        host: "127.0.0.1",
                        port: "1433",
                        database: 'ERPCommpage',
                        user: 'cmpage',
                        password: 'defans'
                    }
                }
            };
        }
        let fromModel = new Base('base', config);
        let toModel = cmpage.service('cmpage/base');
        let list = await toModel.query(`select * from t_module where c_modulename='${modulename}'`);
        if (list.length > 0) return {
            statusCode: 300,
            message: `目标模块已经存在！`
        };

        list = await fromModel.query(`select * from t_commpage where c_modulename='${modulename}'`);
        if (list.length <= 0) return {
            statusCode: 300,
            message: `未取到原模块信息！`
        };
        //        debug(list,'module.copyModuleFromMssql - list');
        let rec = cmpage.objPropertysFromOtherObj({}, list[0], 'c_modulename,c_datasource,c_table,c_multiselect,c_pager,c_page_size,c_other,c_user,c_memo');
        debug(rec, 'module.copyModuleFromMssql - rec');
        //        if(think.isEmpty(rec))  return;
        rec.c_sort_by = `${list[0]["c_sortname"]} ${list[0]["c_sortorder"]}`;
        rec.c_time = think.datetime();
        rec.c_status = 0;
        let newID = await toModel.model('t_module').add(rec);
        if (newID == 0) return;
        let oldID = list[0]["c_id"];
        //复制 cols
        list = await fromModel.query(`select c_column,c_coltype,c_scale,c_name,c_desc,c_format,c_order,c_width,c_style,c_isretrieve,c_isshow,c_isview,
            c_type,c_type_sum from t_commpage_col where c_commpage=${oldID}`);
        for (let md of list) {
            md.c_module = newID;
            await toModel.model('t_module_col').add(md);
        }
        //复制 querys
        list = await fromModel.query(`select c_column,c_coltype,c_scale,c_name,c_desc,c_order,c_isshow,c_op,c_default,c_type,c_format,c_style,c_suffix,
            c_width from t_commpage_query where c_commpage=${oldID}`);
        for (let md of list) {
            md.c_module = newID;
            await toModel.model('t_module_query').add(md);
        }
        //复制 btns
        list = await fromModel.query(`select c_location,c_label,c_object,c_class,c_style,c_url,c_opentype,c_options,c_title,c_icon,c_isshow
            from t_commpage_btn where c_commpage=${oldID}`);
        for (let md of list) {
            md.c_module = newID;
            await toModel.model('t_module_btn').add(md);
        }
        //复制 edits
        list = await fromModel.query(`select c_column,c_coltype,c_scale,c_name,c_desc,c_order,c_isshow,c_editable,c_type,c_format,c_style,
            c_suffix,c_width,c_isrequired,c_memo from t_commpage_edit where c_commpage=${oldID}`);
        for (let md of list) {
            md.c_module = newID;
            await toModel.model('t_module_edit').add(md);
        }
        return {
            statusCode: 200,
            message: `模块复制成功！`
        };
    }

    /*******************从缓存中取模块设置，如果没有，则刷新缓存********--begin--****************/
    async getModuleById(moduleID) {
        let col = await think.cache(`module${moduleID}`, () => {
            return this.query(`select * from t_module where id = ${moduleID}`); //model('t_module').where({id:moduleID}).find(); //
        });
        col.c_isquery = think.isBoolean(col.c_isquery) ? col.c_isquery : (col.c_isquery === 1);
        col.c_pager = think.isBoolean(col.c_pager) ? col.c_pager : (col.c_pager === 1);
        return col;
    }
    async getNameById(moduleID) {
        let md = await this.getModuleById(moduleID);
        return !think.isEmpty(md) ? md[0].c_modulename : '';
    }
    async getAliasById(moduleID) {
        let md = await this.getModuleById(moduleID);
        return !think.isEmpty(md) ? md[0].c_alias : '';
    }

    async getModuleByName(modulename) {
        return await think.cache(`modulename${modulename}`, () => {
            return this.model('t_module', 'cmpage').where({
                c_modulename: modulename,
                c_status: 0
            }).find(); //query(`select * from t_module where c_modulename = '${modulename}' and c_status=0`);
        });
    }
    async getAliasByName(modulename) {
        //        debug(modulename,'module.getAliasByName - modulename');
        let md = await this.getModuleByName(modulename);
        //debug(md,'module.getAliasByName - md');
        return !think.isEmpty(md) ? md.c_alias : '';
    }

    async getModuleCol(moduleID) {
        let cols = await think.cache(`moduleCol${moduleID}`, () => {
            return this.query(`select * from t_module_col where c_module = ${moduleID} order by c_order`);
        });
        for (let col of cols) {
            col.c_isshow = think.isBoolean(col.c_isshow) ? col.c_isshow : (col.c_isshow === 1);
            col.c_isretrieve = think.isBoolean(col.c_isretrieve) ? col.c_isretrieve : (col.c_isretrieve === 1);
            col.c_isview = think.isBoolean(col.c_isview) ? col.c_isview : (col.c_isview === 1);
        }
        return cols;
    }
    async getModuleEdit(moduleID) {
        let cols = await think.cache(`moduleEdit${moduleID}`, () => {
            return this.query(`select * from t_module_edit where c_module = ${moduleID} order by c_order`);
        });
        for (let col of cols) {
            col.c_isshow = think.isBoolean(col.c_isshow) ? col.c_isshow : (col.c_isshow === 1);
            col.c_editable = think.isBoolean(col.c_editable) ? col.c_editable : (col.c_editable === 1);
            col.c_isrequired = think.isBoolean(col.c_isrequired) ? col.c_isrequired : (col.c_isrequired === 1);
        }
        return cols;
    }
    async getModuleQuery(moduleID) {
        let cols = await think.cache(`moduleQuery${moduleID}`, () => {
            return this.query(`select * from t_module_query where c_module = ${moduleID} order by c_order`);
        });
        for (let col of cols) {
            col.c_isshow = think.isBoolean(col.c_isshow) ? col.c_isshow : (col.c_isshow === 1);
        }
        return cols;
    }
    async getModuleBtn(moduleID, user, objname) {
        let btns = await think.cache(`moduleBtn${moduleID}`, () => {
            return this.query(`select * from t_module_btn where c_module = ${moduleID} order by c_location`);
        });
        let privileges = [];
        if (!think.isEmpty(user)) {
            let rootID = 0;
            if (!think.isEmpty(objname)) {
                let codes = await cmpage.service('admin/code').getCodesByRoot(1);
                for (let md of codes) {
                    if (md.c_object === objname) {
                        rootID = md.id;
                        break;
                    }
                }
            }
            privileges = await cmpage.service('admin/privilege').userGetPrivilegeTree(user.id, user.c_role, rootID);
        }
        for (let col of btns) {
            col.c_isshow = think.isBoolean(col.c_isshow) ? col.c_isshow : (col.c_isshow === 1);
            if (col.c_isshow) {
                //验证用户权限, 允许优先原则
                for (let priv of privileges) {
                    if (priv.c_object === col.c_object) {
                        col.c_isshow = priv.isAllow;
                        break;
                    }
                }
            }
        }
        return btns;
    }
    /*******************从缓存中取模块设置，如果没有，则刷新缓存********--end--****************/

}