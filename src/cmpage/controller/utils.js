'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.controller
 */

/**
 * 工具集、其他URL接口
 * @class cmpage.controller.utils
 */
import Base from './base.js';

export default class extends Base {

    /**
     * 清除缓存， 调用： /cmpage/utils/clear_cache
     * @method  clearCache
     * @return {json}
     */
    async clearCacheAction(){
        //auto render template file index_index.html
        await this.model('admin/code').clearCodeCache();
        await this.model('module').clearModuleCache();
        await this.cache("users",null);

        return this.json({statusCode:200, message:'Cache is clear!'});
    }

    /**
     * 根据省份取城市列表， 调用： /cmpage/utils/get_citys?province=xxx
     * @method  get_citys
     * @return {json}
     */
    async getCitysAction(){
        let citys = await this.model('area').getCitys(this.get('province'));
        let ret =[{value:'-1', label:'请选择'}];
        for(let city of citys){
            ret.push({value:city.c_ucode, label:city.c_name});
        }
        return this.json(ret);
    }
    /**
     * 根据城市取区县列表， 调用： /cmpage/utils/get_countrys?city=xxx
     * @method  get_countrys
     * @return {json}
     */
    async getCountrysAction(){
        let countrys = await this.model('area').getCountrys(this.get('city'));
        let ret =[{value:'-1', label:'请选择'}];
        for(let country of countrys){
            ret.push({value:country.c_ucode, label:country.c_name});
        }
        return this.json(ret);
    }

}