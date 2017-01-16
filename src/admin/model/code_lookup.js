'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
 @module admin.model
 */

/**
 * 参数选择，继承自 cmpage/model/page_lookup.js
 * @class admin.model.code_lookup
 */
import CMPageLookup from '../../cmpage/model/page_lookup.js';
export default class extends CMPageLookup {
    /**
     * 重写父类的 getQueryWhere 方法，增加页面模块的条件设置，组合成新的Where子句
     * @method  getQueryWhere
     * @return {string}  where条件子句
     * @param {Object} page  页面设置主信息
     */
    async getQueryWhere(){
        let where =await super.getQueryWhere();
        //cmpage.debug(where);
        return where +' and c_status = 0 and c_pid='+this.mod.parmsUrl.c_pid;
    }

}
