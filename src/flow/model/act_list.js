'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

const CMPage = require('../../cmpage/model/page_mob.js');

module.exports = class extends CMPage {
    constructor(name, config = {}) {
        const moduleModel = think.model('t_module','cmpage');
        super(name,moduleModel.config);
    }

}
