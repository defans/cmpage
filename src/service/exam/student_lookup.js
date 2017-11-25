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
 @module docu.model
 */

/**
 * 通用的查找页面行为实现类，基础自 cmpage/page, 当增加一个简单业务模块又不想有相应的实现类的时候，可以指向本类，以便实现连接不同的数据库
 * @class admin.service.page_lookup
 */

const CMPage = require('../cmpage/page_lookup.js');

module.exports = class extends CMPage {


    /**
     * 取查询项的设置，结合POST参数，得到Where字句，重写本方法可以定制或修改SQL的where子句
     * @method  getQueryWhere
     * @return {string} where 子句， 形如： where xxx and xxx
     */
    async getQueryWhere(){
        let where = await super.getQueryWhere();
        where += ` and id not in(select c_student from t_exam_student where c_exam=${this.mod.parmsUrl.c_exam} and c_status<>-1)`;
        return where;
    }


}
