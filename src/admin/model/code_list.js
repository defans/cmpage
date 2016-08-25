'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

import CMPage from '../../common/model/page.js';
/**
 * 代码于参数设置，单层的CRUD操作
 */
export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        //global.debug(where);
        let parmsUrl =JSON.parse(page.parmsUrl);
        return where +' and c_pid='+parmsUrl.c_pid;
    }
    /**
     * 初始化编辑页面的值
     */
    async pageEditInit(pageEdits,page){
        let md = await super.pageEditInit(pageEdits,page);

        let parmsUrl = JSON.parse(page.parmsUrl);
        let pCode = await this.model('code').getCodeById(parseInt(parmsUrl.c_pid));
        md.c_pid = pCode.id;
        md.c_root = pCode.c_root;
        md.c_type = 'N';

        //console.log(md);
        return md;
    }
    async pageSave(page,parms){
        let ret = await super.pageSave(page, parms);
        this.model('code').clearCodeCache();

        return ret;
    }
}