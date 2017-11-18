'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 单据流转的业务模块，实现了采购、库存管理相关的业务逻辑
 @module dtalk.model
 */

/**
 * 物料资料的实现类，用于单据流转等
 * @class dtalk.model.dderror
 */

const CMPage = require('../../cmpage/service/page.js');

module.exports = class extends CMPage {

    /**
    * 根据错误编码取错误信息，一般用于页面模块配置中的‘替换’调用: dtalk/dderror:getDescByUcode
    * @method  getDescByUcode
    * @return {string}  错误信息
    * @param   {string} ucode 错误编码
    */
    async getDescByUcode(ucode){
        let errs = await this.getList();
        for(let err of errs){
            if(ucode == err.c_ucode)    return err.c_desc;
        }
        return '';
    }
    /**
     * 编辑页面保存,<br/>
     * 增加了刷新缓存
     * @method  pageSave
     * @return {object} 如果有验证错误，则返回格式： {statusCode:300, message:'xxxxxx'}
     * @param  {object} parms 前端传入的FORM参数
     */
    async pageSave(parms){
        let ret = super.pageSave(parms);
        await think.cache('ddError',null);
        return ret;
    }

    /**
     * 取t_dderror全表记录，缓存
     * @method  getList
     * @return {Array}  t_dderror记录列表
     */
    async getList(){
        return await think.cache("ddError", () => {
            return this.query('select * from t_dderror  order by  c_ucode ');
        });
    }

}
