'use strict';
/**
 * logic
 * @param  {} []
 * @return {}     []
 */
export default class extends think.logic.base {
  /**
   * save action logic
   * @return {} []
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