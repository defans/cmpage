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
const Base = require('./base.js');

module.exports = class extends Base {

    async testAction() {
        //        let model = cmpage.service('docu/base');
        //        let ret = await model.query('select top 5 goods_name,goods_ucode from vw_docu_rec');
        //let ret = await model.query("QueryPage 'vw_docu_rec','c_id,goods_ucode,goods_name',10,2,'','c_id',0,'c_id'");

        //  let model = cmpage.service('cmpage/base');
        //  let ret = await model.query('select c_name,c_time from t_customer limit 3');
        //        let ret = await this.model('cmpage/page').query('select c_name,c_time from t_customer limit 2');
        //debug(ret,'utils.C.test - ret');

        let ret = Number(0.3).sub(0.2);
        console.log(ret);
        console.log(0.3 - 0.2);
        return this.json({});
    }

    /**
     * 根据URL参数直接调用相关model的相关方法， 调用： /cmpage/utils/callFunction?model=xxx&fn=xxx&parms=xxx,xxx
     * @method callFunction
     * @return {json}
     */
    async call_functionAction() {
        let fnModel = cmpage.service(this.get('model'));
        let fnName = this.get('fn');
        let ret = {
            statusCode: 200,
            message: '',
            data: {}
        };
        if (think.isFunction(fnModel[fnName])) {
            //传入当前用户
            fnModel.user = await this.session('user');
            if (think.isEmpty(this.get('parms'))) {
                ret.data = await fnModel[fnName]();
            } else {
                let parms = this.get('parms').split(',');
                //                debug(parms, 'utils.C.callFunction - parms');
                ret.data = await fnModel[fnName](...parms);

            }
            if (!think.isEmpty(ret.data.statusCode)) ret.statusCode = ret.data.statusCode;
            if (!think.isEmpty(ret.data.message)) ret.message = ret.data.message;
        } else {
            ret = {
                statusCode: 300,
                message: '您所调用的方法不存在!',
                data: {}
            };
        }

        if (!think.isEmpty(this.get('navtabid'))) ret.navtabid = this.get('navtabid');
        if (!think.isEmpty(this.get('dialogid'))) ret.dialogid = this.get('dialogid');
        if (!think.isEmpty(this.get('divid'))) ret.divid = this.get('divid');

        return this.json(ret);
    }

    /**
     * 根据URL参数直接调用相关model的相关方法， 调用： /cmpage/utils/callFunction?model=xxx&fn=xxx&parms=xxx,xxx
     * @method callFunction
     * @return {json}
     */
    async call_function_by_modulenameAction() {
        let page = await cmpage.service('cmpage/module').getModuleByName(this.get('modulename'));
        page.user = await this.session('user');
        //cmpage.debug(page);
        let pageModel = cmpage.service(think.isEmpty(page.c_path) ? 'cmpage/page' : page.c_path);
        pageModel.mod = page;
        await pageModel.initPage();

        let fnName = this.get('fn');
        let ret = {
            statusCode: 200,
            message: '',
            data: {}
        };
        if (think.isFunction(pageModel[fnName])) {
            if (think.isEmpty(this.get('parms'))) {
                ret.data = await pageModel[fnName]();
            } else {
                let parms = this.get('parms').split(',');
                //                debug(parms, 'utils.C.callFunction - parms');
                ret.data = await pageModel[fnName](...parms);

            }
            if (!think.isEmpty(ret.data.statusCode)) ret.statusCode = ret.data.statusCode;
            if (!think.isEmpty(ret.data.message)) ret.message = ret.data.message;
        } else {
            ret = {
                statusCode: 300,
                message: `您所调用的方法 ${page.c_modulename}/${fnName} 不存在!`,
                data: {}
            };
        }

        if (!think.isEmpty(this.get('navtabid'))) ret.navtabid = this.get('navtabid');
        if (!think.isEmpty(this.get('dialogid'))) ret.dialogid = this.get('dialogid');
        if (!think.isEmpty(this.get('divid'))) ret.divid = this.get('divid');

        return this.json(ret);
    }

    /**
     * 清除缓存， 调用： /cmpage/utils/clear_cache
     * @method  clearCache
     * @return {json}
     */
    async clear_cacheAction() {
        //auto render template file index_index.html
        await cmpage.service('admin/code').clearCodeCache();
        await cmpage.service('cmpage/module').clearModuleCache();
        await this.cache("users", null);

        return this.json({
            statusCode: 200,
            message: 'Cache is clear!'
        });
    }

    /**
     * 根据省份取城市列表， 调用： /cmpage/utils/get_citys?province=xxx
     * @method  getCitys
     * @return {json}
     */
    async get_citysAction() {
        let citys = await cmpage.service('admin/area').getCitys(this.get('province'));
        let ret = [{
            value: '-1',
            label: '请选择'
        }];
        for (let city of citys) {
            ret.push({
                value: city.c_ucode,
                label: city.c_name
            });
        }
        return this.json(ret);
    }
    /**
     * 根据城市取区县列表， 调用： /cmpage/utils/get_countrys?city=xxx
     * @method  getCountrys
     * @return {json}
     */
    async get_countrysAction() {
        let countrys = await cmpage.service('admin/area').getCountrys(this.get('city'));
        let ret = [{
            value: '-1',
            label: '请选择'
        }];
        for (let country of countrys) {
            ret.push({
                value: country.c_ucode,
                label: country.c_name
            });
        }
        return this.json(ret);
    }


}