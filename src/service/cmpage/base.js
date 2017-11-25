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

module.exports = class extends think.Service {
    constructor(){
        super();
        this.connStr = 'admin'; //默认连接参数
        this.cmpage = require('../cmpage.js');
    }
    
    /**
     * 执行原生SQL语句，取结果集返回
     * @return {array} 查询结果集
     * @param {string} sql
     * @param {object} options 参数设置
     * @param {string} connStr 数据库连接参数配置，可以临时指定，这样业务类可以操作不同的数据库
     */
    async query(sql,options,connStr) {        
        const connName = connStr ? connStr : this.connStr;
        // debug(sql,'base.query - SQL');
        return await this.model('',connName).query(sql,options);        
    }

}
