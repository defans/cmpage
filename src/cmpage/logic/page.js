'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 业务模块配置和展示系统的logic，实现了对前端传入的参数校验

 注意点 :
 1. 校验的错误提示已改为中文，配置在 common/config/zh-cn.js
 2. 一般不实现业务逻辑
 3. 由于cmpage的模块都是统一的URL接口，因此都可以按配置实现校验

 @module cmpage.logic
 */

/**
 * 调用 cmpage/controller/page.js 的一些URL接口之前
 * 提供 thinkjs 的校验
 * @class cmpage.logic.page
 */
export default class extends think.logic.base {
    /**
     * 调用 cmpage/page/save 之前系统自动调用本方法验证表单数据
     * @method  save
     * @return {json}  如有错误，返回错误信息
     */
    async saveAction(){
        let parms =this.post();

        let page = await this.model('module').getModuleByName(parms.modulename);
        let pageEdits = await this.model('module').getModuleEdit(page.id);
      let rules = {};
      for(let edit of pageEdits){
          if(edit.c_editable && !think.isEmpty(edit.c_validate_rules)){
              rules[edit.c_column] = edit.c_validate_rules;
          }
      }
      //console.log('validate rules: '+JSON.stringify(rules));
       if(! this.validate(rules)){
            //let errs =this.errors();
            return this.json({statusCode:300, message:'校验未通过:  '+ Object.values(this.errors()).join(', ') });
        }
    }
}