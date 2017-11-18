'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

const CMPage = require('../../cmpage/service/page_mob.js');

module.exports = class extends CMPage {
    constructor() {
        super();
        this.connStr='cmpage';
    }

}
