'use strict';

export default class extends think.controller.base {
    /**
     本模块的所有action执行前的检查项
     @method  __before
     @return {promise} 当前用户未登录时，返回错误信息或者引导到登录页面
     */
  async __before(){
    // //部分 action 下不检查,
    // let blankActions = ["clear_cache"];
    // if(blankActions.indexOf(this.http.action) >=0){
    //   return;
    // }

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
