'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**

 @module cmpage.extend
 */

/**
 * service的扩展类，在service/xxx中可以直接引用
 * @class common.extend.service
 */
module.exports = {
    async fetchJson(url){
        return await this.fetch(url).then(res => res.json());
    }
}