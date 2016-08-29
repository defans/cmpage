'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------


export default class extends think.controller.base {
//export default class extends Base {
  /**
   * 删除记录
   * flag: boolean ,true表示实际删除
   */
  async deleteAction(){
    let ret={statusCode:200,message:'',data:{}};
    let parms =this.http.query;
    global.debug(parms);

    let model = this.model(parms.table);
    if(parms.id >0){
      if(parms.flag == 'true'){
        await model.where({id: parms.id}).delete();
      }else {
        await model.where({id: parms.id}).update({c_status:-1});
      }

    }
    return this.json(ret);
  }

  async __before(){
    //部分 action 下不检查,
    let blankActions = ["clear_cache"];
    if(blankActions.indexOf(this.http.action) >=0){
      return;
    }

    let user = await this.session("user");
    //判断 session 里的 userInfo
    if(think.isEmpty(user)){
      if(this.http.controller === 'mob'){
        return this.json({ id :0, msg : "用户名或密码错误！" });
      }else{
        return this.redirect("/admin/index/login");
      }
    }
  }
}