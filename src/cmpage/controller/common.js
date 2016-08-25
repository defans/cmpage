'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
    //auto render template file index_index.html
    return this.display();
  }

  /*********************************** 地区联动选择--begin-- ************************/
  //根据省份取城市列表
  async getCitysAction(){
    let citys = await this.model('area').getCitys(this.get('province'));
    let ret =[{value:'-1', label:'请选择'}];
    for(let city of citys){
      ret.push({value:city.c_ucode, label:city.c_name});
    }
    return this.json(ret);
  }
  //根据城市取区县列表
  async getCountrysAction(){
    let countrys = await this.model('area').getCountrys(this.get('city'));
    let ret =[{value:'-1', label:'请选择'}];
    for(let country of countrys){
      ret.push({value:country.c_ucode, label:country.c_name});
    }
    return this.json(ret);
  }

  /*********************************** 地区联动选择--end-- ************************/


}