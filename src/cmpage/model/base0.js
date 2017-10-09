'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.model
 */

/**
 * 业务模块的基类，通过ORM框架 Sequelize 连接各个业务数据库</br>
 * 连接参数配置于各个module的配置文件中，xxxx/config/db.config </br>
 * 为了和thinkjs.model的常用方法名保持一致，以下实现了相关方法，通过转换成sql语句用 sequelize.query(sql) 执行 </br>
 * 如果想使用 sequelize 的ORM方法，可以在子类中通过 this.sequelize.xxxx 来调用</br>
 * 子类中用think.model,或者cmpage.model来实例化其他类其他模块，本类中的 model 用于设置表名以便生成SQL语句，也为了兼容 thinkjs.model(表名).xxx 的调用方式 </br>
 * 如果以后版本的 ThinkJS能支持mssql，以上兼容可以使得将 page.js 改回从 think.model.base 继承的时候不需要做太大改动 </br>
 * @class cmpage.model.base
 */
// import Sequelize from 'sequelize';

module.exports = class extends think.Model {

     /**
      * constructor
      * @param  {[type]} name   [description]
      * @param  {Object} config [description]
      * @return {[type]}        [description]
      */
     constructor(name, config = {}) {
        super();
        this.sequelize = null;
        this._model = null; //thinkjs.model.base , 目前暂时不用
        this._field = '';
        this._where = '';
        this._tableName = '';
        this.pk = 'id';
        if (think.isObject(name)) {
             config = name;
             name = "";
        }
        this._tableName = name;
        this.config = think.parseConfig(config);
        // debug(this.config, 'base.constructor - this.config');
        // debug(this.name, 'base.constructor - this.name');
     }

     /**
      * 创建连接
      * @return {[type]} [description]
      */
     getConnection() {
         this.sequelize = new Sequelize( this.config.database, this.config.user,  this.config.password, {
             host:this.config.host || "127.0.0.1",
             port:this.config.port || 3306,
             dialect: this.config.type || 'mysql',
             benchmark:true,
             logging:this.log,
             pool: {
                 max: 5,
                 min: 0,
                 idle: 10000
             }
         });
         return this.sequelize;
     }
     log(msg){
         cmpage.debug(msg,'SQL');
     }

     setTableName(name){
         this._tableName = name;
         return this;
     }
     model(name){
         this.setTableName(name);

        //  if(this.config.type != 'mssql' && (name.indexOf('t_') ===0 || name.indexOf('vw_') ===0 || name.indexOf('fw_') ===0) ){
        //      this._model = new think.model.base(name,this.config);
        //  }
         return this;
     }
     setPk(pk){
         this.pk = pk;
         if(this._model)    this._model.pk = pk;
         return this;
     }
     field(fields){
         this._field = fields;
         if(this._model)    this._model.field(fields);
         return this;
     }

     where(where){
         if(this._model){
             this._model.where(where);
             return this;
         }
         this._where = '';
         if(think.isObject(where)){
             let arr = [];
             for(let p in where){
                 arr.push(p+'='+this.parseValue(where[p]));
             }
             if(arr.length >0)  this._where = `where ${arr.join(' and ')}`;
         }else {
             this._where = 'where '+ where;
         }
         return this;
     }

     /**
      * 执行原生SQL语句，取结果集返回
      * @return {array} 查询结果集
      * @param {string} sql
      * @param {object} options 参数设置
      */
     async query(sql,options) {
         if(this._model){
             return await this._model.query(sql);
         }
         if (!this.sequelize) {
             this.getConnection();
         }
         let list = await this.sequelize.query(sql,options);
         if(list.length >0) return list[0];
         return [];
     }

     async select(){
         if(this._model){
             return await this._model.select();
         }
         let sql = `select ${think.isEmpty(this._field) ? '*': this._field} from ${this._tableName} ${this._where} `;
         return await this.query(sql);
     }
     async find(){
         if(this._model){
             return await this._model.find();
         }
         let list = await this.select();
         if(list.length >0){
             let rec = list[0];
             for(let p in rec){
                 if(think.isDate(rec[p]))   rec[p] = think.datetime(rec[p]);
             }
             return rec;
         }
         return {};
     }
     async delete(){
         //为了避免误操作，条件语句不能为空，当然，可以用 where 1=1
         if(think.isEmpty(this._where))  return;

         if(this._model){
             return await this._model.delete();
         }
         let sql = `delete from ${this._tableName} ${this._where}`;
         let ret = await this.query(sql);
         //debug(ret,'base.delete - ret');
     }
     async count(){
         if(this._model){
             return await this._model.count();
         }
         let sql = `select count(*) as cnt from ${this._tableName} ${this._where}`;
         let list = await this.query(sql);
         return list[0]['cnt'];
     }

     async add(rec){
         if(this._model){
             return await this._model.add(rec);
         }
         let values = [];
         let _field = [];
         for(let key in rec){
             if(/^c_\w+/.test(key) && key !=this.pk) {
                 let val = rec[key];
                 val = this.parseValue(val);
                 values.push(val);
                 _field.push(key);
             }
         }
         let sql =  `INSERT INTO ${this._tableName}( ${_field.join(',')} ) VALUES( ${values.join(',')} ) `;
         if(this.config.type == "postgresql"){
             sql += ` returning ${this.pk};`;
             let list = await this.query(sql);
             return list[this.pk];
         }else{
             await this.query(sql);
             let list = await this.query(`select @@IDENTITY as ${this.pk};`);
             //cmpage.debug(list,'base.add - list');
             if(list.length >0){
                return list[0][this.pk];
             }
             return 0;
         }
     }
     async update(rec){
         if(this._model){
             return await this._model.update(rec);
         }
         let _field = [];
         for (let key in rec) {
             if (/^c_\w+/.test(key) && key != this.pk) {
                 let val = rec[key];
                 val = this.parseValue(val);
                 _field.push(key + '=' + val);
             }
         }
         if(think.isEmpty(this._where))  this._where = ` where ${this.pk}=${rec[this.pk]}`;
         let sql = `UPDATE ${this._tableName} SET ${_field.join(',')}  ${this._where}`;
         //debug(sql,'base.update - sql');
         await this.query(sql);

     }

    /**
     * 执行原生SQL语句，取结果集返回
     * @return {array} 查询结果集
     * @param {string} fnName 函数名称
     * @param {object} parms 参数列表，用于参数列表不同的情况
     */
     sqlTranslate(fnName,parms){
         let fnTrans = [{mysql:'ifnull', mssql:'isnull', postgresql:'coalesce'}];
         let ret = fnName;
         for(let trans of fnTrans){
             for(let p in trans){
                 if(trans[p] == fnName){
                     ret = trans[this.config.type];
                 }
             }
         }
         //TODO:如果有参数列表不同的情况，在这里处理

         return ret;
     }

    parseValue(value){
        if (think.isString(value)) {
            value = `'${value.replace(/\'/g,'\\\'')}'`;
        }else if(think.isArray(value)){
            if (/^exp$/.test(value[0])) {
                value = value[1];
            }else{
                value = value.map(item => this.parseValue(item));
            }
        }else if(think.isBoolean(value) && this.config.type=='mysql'){
            value = value ? 'TRUE' : 'FALSE';
        }else if(think.isDate(value)){
            value =`'${think.datetime(value)}'` ;
        }else if(value === null) {
            value = 'null';
        }
        return value;
    }

}
