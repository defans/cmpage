'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

const CMPage = require('../cmpage/page_mob.js');

module.exports = class extends CMPage {

    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere() {
        //通过父类的方法取查询列设置解析后的where子句
        let where = await super.getQueryWhere();
        //此处增加额外的条件
        where += ` and c_recv=${this.mod.user.id}`;

        return where;
    }

    /**
     * 得到去看看的URL,如果状态是未阅读，则改为已阅读
     */
    async goSeeSee(id) {

        let rec = await this.model('t_msg').where(`id=${id}`).find();
        if(rec){
            if(rec.c_status === 1){
                await this.query(`update t_msg set c_status=2 where id=${id}`);
            }
            return {statusCode:200, message:'', data:rec};
        }else{
            return {statusCode:300, message:'消息记录不存在', data:null};
        }

    }

    async getUnReadCount(userID){
        let recvID = userID >0 ? userID : this.mod.user.id;
        let ret = await this.query(`select count(id) as cnt from t_msg where c_recv=${recvID} and c_status=1`);
        return {statusCode:200, message:'', data: ret[0].cnt};
    }
}