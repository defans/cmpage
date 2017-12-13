'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.service
 */

/**
 * 业务模块的基类，继承自 think.Model，配置在common/config/adapter.js中，
 * 系统需要链接多个数据库的时候，通过实例化本类时传入不同的数据库配置来实现 </br>
 * @class cmpage.service.base
 */

const Sequelize = require('sequelize');

module.exports = class extends think.Service {
    constructor() {
        super();
        this.connStr = 'admin'; //默认连接参数
        this.cmpage = require('../cmpage.js');
        this.config = think.config('model')['admin'];

        this._sequelize = null;
        this._model = null; //thinkjs.model.base , 目前暂时不用
        this._field = '';
        this._where = '';
        this._tableName = '';
        this.pk = 'id';
    }

    // /**
    //  * 执行原生SQL语句，取结果集返回
    //  * @return {array} 查询结果集
    //  * @param {string} sql
    //  * @param {object} options 参数设置
    //  * @param {string} connStr 数据库连接参数配置，可以临时指定，这样业务类可以操作不同的数据库
    //  */
    // async query(sql,options,connStr) {        
    //     const connName = connStr ? connStr : this.connStr;
    //     // debug(sql,'base.query - SQL');
    //     return await this.model('',connName).query(sql,options);        
    // }

    /**
     * 创建连接
     * @return {[type]} [description]
     * @param {string} connStr 数据库连接参数配置，可以临时指定，这样业务类可以操作不同的数据库
     */
    getConnection(connStr) {
        const connName = connStr ? connStr : this.connStr;
        this.config = think.config('model')[connName];
        //debug(config,'cmpage.base - dbConfig');
        this._sequelize = new Sequelize(this.config.database, this.config.user, this.config.password, {
            host: this.config.host || "127.0.0.1",
            port: this.config.port || 3306,
            dialect: this.config.type || 'mysql',
            benchmark: true,
            logging: this.log,
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            }
        });
        return this._sequelize;
    }
    log(msg) {
        if (think.env === 'development') {
            think.logger.debug(msg);
        }
    }

    setTableName(name) {
        this._tableName = name;
        return this;
    }

    /**
     * 设置表名并返回实例
     * @return {[type]} [description]
     * @param {string} connStr 数据库连接参数配置，可以临时指定，这样业务类可以操作不同的数据库
     */
    model(name) {
        this.setTableName(name);

        //  if(this.config.type != 'mssql' && (name.indexOf('t_') ===0 || name.indexOf('vw_') ===0 || name.indexOf('fw_') ===0) ){
        //      this._model = new think.model.base(name,this.config);
        //  }
        return this;
    }

    setPk(pk) {
        this.pk = pk;
        if (this._model) this._model.pk = pk;
        return this;
    }
    field(fields) {
        this._field = fields;
        if (this._model) this._model.field(fields);
        return this;
    }

    where(where) {
        if (this._model) {
            this._model.where(where);
            return this;
        }
        this._where = '';
        if (think.isObject(where)) {
            let arr = [];
            for (let p in where) {
                arr.push(p + '=' + this.parseValue(where[p]));
            }
            if (arr.length > 0) this._where = `where ${arr.join(' and ')}`;
        } else {
            this._where = 'where ' + where;
        }
        return this;
    }

    /**
     * 执行原生SQL语句，取结果集返回
     * @return {array} 查询结果集
     * @param {string} sql
     * @param {object} options 参数设置
     * @param {string} connStr 数据库连接参数配置，可以临时指定，这样业务类可以操作不同的数据库
     */
    async query(sql, options, connStr) {
        const connName = connStr ? connStr : this.connStr;
        if (this._model) {
            return await this._model('', connName).query(sql);
        }
        //用 sequelize
        if (!this._sequelize || connName !== connStr) {
            this.getConnection(connName);
        }
        let list = await this._sequelize.query(sql, options);
        //cmpage.warn(list,'base.query - queryList');
        if (list.length > 0) return list[0];
        return [];
    }

    async select() {
        if (this._model) {
            return await this._model.select();
        }
        let sql = `select ${think.isEmpty(this._field) ? '*': this._field} from ${this._tableName} ${this._where} `;
        return await this.query(sql);
    }
    async find() {
        if (this._model) {
            return await this._model.find();
        }
        let list = await this.select();
        if (list.length > 0) {
            let rec = list[0];
            for (let p in rec) {
                if (think.isDate(rec[p])) rec[p] = think.datetime(rec[p]);
            }
            return rec;
        }
        return {};
    }
    async delete() {
        //为了避免误操作，条件语句不能为空，当然，可以用 where 1=1
        if (think.isEmpty(this._where)) return;

        if (this._model) {
            return await this._model.delete();
        }
        let sql = `delete from ${this._tableName} ${this._where}`;
        let ret = await this.query(sql);
        //debug(ret,'base.delete - ret');
    }
    async count() {
        if (this._model) {
            return await this._model.count();
        }
        let sql = `select count(*) as cnt from ${this._tableName} ${this._where}`;
        let list = await this.query(sql);
        return list[0]['cnt'];
    }

    async add(rec) {
        if (this._model) {
            return await this._model.add(rec);
        }
        let values = [];
        let _field = [];
        for (let key in rec) {
            if (/^c_\w+/.test(key) && key != this.pk) {
                let val = rec[key];
                val = this.parseValue(val);
                values.push(val);
                _field.push(key);
            }
        }
        if (!this._sequelize) {
            this.getConnection(this.connStr);
        }
        let sql = `INSERT INTO ${this._tableName}( ${_field.join(',')} ) VALUES( ${values.join(',')} ) `;
        if (this.config.type == "postgresql") {
            sql += ` returning ${this.pk};`;
            let list = await this.query(sql);
            return list[this.pk];
        } else {
            await this.query(sql);
            //let list = await this.query(`select @@IDENTITY as ${this.pk};`);
            let ret = await this._sequelize.query(`select @@IDENTITY as ${this.pk};`, {
                plain: true
            });
            //cmpage.warn(ret, 'base.add - ret');
            if (ret) {
                return ret[this.pk];
            }
            return 0;
        }
    }
    async update(rec) {
        if (this._model) {
            return await this._model.update(rec);
        }
        //this.cmpage.warn(rec, 'base.update - rec before parseValue');
        let _field = [];
        for (let key in rec) {
            if (/^c_\w+/.test(key) && key != this.pk) {
                let val = rec[key];
                val = this.parseValue(val);
                _field.push(key + '=' + val);
            }
        }
        if (think.isEmpty(this._where)) this._where = ` where ${this.pk}=${rec[this.pk]}`;
        let sql = `UPDATE ${this._tableName} SET ${_field.join(',')}  ${this._where}`;
        //this.cmpage.warn(rec, 'base.update - rec after parseValue');
        //debug(sql,'base.update - sql');
        await this.query(sql);

    }

    /**
     * 执行原生SQL语句，取结果集返回
     * @return {array} 查询结果集
     * @param {string} fnName 函数名称
     * @param {object} parms 参数列表，用于参数列表不同的情况
     */
    sqlTranslate(fnName, parms) {
        let fnTrans = [{
            mysql: 'ifnull',
            mssql: 'isnull',
            postgresql: 'coalesce'
        }];
        let ret = fnName;
        for (let trans of fnTrans) {
            for (let p in trans) {
                if (trans[p] == fnName) {
                    ret = trans[this.config.type];
                }
            }
        }
        //TODO:如果有参数列表不同的情况，在这里处理

        return ret;
    }

    parseValue(value) {
        if (think.isString(value)) {
            value = `'${value.replace(/\'/g,'\\\'')}'`;
        } else if (think.isArray(value)) {
            if (/^exp$/.test(value[0])) {
                value = value[1];
            } else {
                value = value.map(item => this.parseValue(item));
            }
        } else if (think.isBoolean(value) ) {
        //     value = value ? 'TRUE' : 'FALSE';
        // } else if (think.isBoolean(value) && this.config.type == 'mssql') {
            value = value ? 1 : 0;
        } else if (think.isDate(value)) {
            value = `'${think.datetime(value)}'`;
        } else if (value === null) {
            value = 'null';
        }
        return value;
    }

}