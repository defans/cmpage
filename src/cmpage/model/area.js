'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 业务模块配置和展示系统的 model 类，实现了cmpage的主要业务逻辑，包括PC端和移动端

 注意点 :
 1. 在业务模块主信息设置中配置实现类,如：cmpage/page 或 demo/customer，系统会调用该类来展现页面
 2. 具体的业务模块必须继承 cmpage/model/page.js 来增加新的逻辑
 3. 移动端、主从页、查找带回等页面都是从 cmpage/model/page.js 继承，具体的业务模块请适当选择基类
 4. 在其他模块如 demo 中可以配置新的数据库连接，实现了多数据库的应该
 5. 每个页面根据不同的HTML输出位置和处理数据的流程分成了若干方法，子类中通过重写相应的方法可以达到定制页面的效果

 @module cmpage.model
 */

/**
 * 全国行政区划的操作类，如果内容作调整后，手机端APP部分也应该做调整，因为数据是预存在APP端的
 * @class cmpage.model.area
 */
export default class extends think.model.base {

    /**
     * 取省份记录， 缓存, 可以用于页面模块配置中的‘下拉框选择’调用: cmpage/area:getProvinces
     * @method  getProvinces
     * @return {Array}  省份记录列表
     */
    async getProvinces(){
        return await think.cache(`provinces`, () => {
            return this.query(`select * from t_area where c_pid =0 order by c_ucode`);
        });
    }

    /**
     * 根据省份编码取省份名称，一般用于页面模块配置中的‘替换’调用: cmpage/area:getProvinceName
     * @method  getProvinceName
     * @return {string}  名称
     * @param {string} province  编码
     */
    async getProvinceName(province){
        if(think.isEmpty(province)){
            return '';
        }
        let provinces = await this.getProvinces();
        for(let item of provinces){
            if(item.c_ucode == province){
                return item.c_name;
            }
        }
        return '';
    }

    /**
     * 根据城市编码取城市名称，一般用于页面模块配置中的‘替换’调用: cmpage/area:getCityName
     * @method  getCityName
     * @return {string}  名称
     * @param {string} city  编码
     */
    async getCityName(city){
        if(think.isEmpty(city)){
            return '';
        }
        let citys = await this.getCitys(city.substr(0,2)+'0000');
        for(let item of citys){
            if(item.c_ucode == city){
                return item.c_name;
            }
        }
        return '';
    }

    /**
     * 根据区县编码取区县名称，一般用于页面模块配置中的‘替换’调用: cmpage/area:getCountryName
     * @method  getCountryName
     * @return {string}  名称
     * @param {string} country  编码
     */
    async getCountryName(country){
        if(think.isEmpty(country)){
            return '';
        }
        let countrys = await this.getCountrys(country.substr(0,4)+'00');
        for(let item of countrys){
            if(item.c_ucode == country){
                return item.c_name;
            }
        }
        return '';
    }

    /**
     * 取城市记录， 缓存, 可以用于页面模块配置中的‘下拉框选择’调用: cmpage/area:getCitys
     * @method  getCitys
     * @return {Array}  城市记录列表
     * @param {string} province  省份编码
     */
    async getCitys(province){
        return await think.cache(`city${province}`, () => {
            return this.query(`select * from t_area where c_pid in(select id from t_area where c_ucode='${province}') order by c_ucode`);
        });
    }

    /**
     * 取区县记录， 缓存, 可以用于页面模块配置中的‘下拉框选择’调用: cmpage/area:getCountrys
     * @method  getCountrys
     * @return {Array}  区县记录列表
     * @param {string} province  城市编码
     */
    async getCountrys(city){
        return await think.cache(`country${city}`, () => {
            return this.query(`select * from t_area where c_pid in(select id from t_area where c_ucode='${city}') order by c_ucode`);
        });
    }

    /**
     * 取省份信息，组成省份选择的下拉项HTML
     * @method  getProvinceItems
     * @return {string}  下拉项的HTML片段
     * @param {string} value  省份编码，当前值
     * @param {bool} hasEmptyItem  是否有空项，一般查询HTML输出时用到
     */
    async getProvinceItems(value,hasEmptyItem){
        let html = [];
        value = think.isEmpty(value) ? '-1': value;
        if(hasEmptyItem){
            html.push(`<option value="-1" ${value =="-1" ? "selected":""}>请选择</option>`);
        }
        let provinces = await this.getProvinces();
        for(let item of provinces){
            html.push(`<option value="${item.c_ucode}" ${item.c_ucode == value ? "selected":""}>${item.c_name}</option>`);
        }
        return html.join('');
    }

    /**
     * 取城市信息，组成城市选择的下拉项HTML
     * @method  getCityItems
     * @return {string}  下拉项的HTML片段
     * @param {string} value  城市编码，当前值
     * @param {bool} hasEmptyItem  是否有空项，一般查询HTML输出时用到
     * @param {string} provinceValue  当前省份编码
     */
    async getCityItems(value,hasEmptyItem,provinceValue){
        let html = [];
        value = think.isEmpty(value) ? '-1': value;
        if(hasEmptyItem){
            html.push(`<option value="-1" ${value =="-1" ? "selected":""}>请选择</option>`);
        }
        let province = think.isEmpty(provinceValue) ? '':provinceValue;
        if(!think.isEmpty(value) && value !== '-1'){
            province = value.substring(0,2)+'0000';
        }
        let citys = await this.getCitys(province);
        for(let item of citys){
            html.push(`<option value="${item.c_ucode}" ${item.c_ucode == value ? "selected":""}>${item.c_name}</option>`);
        }
        return html.join('');
    }

    /**
     * 取区县信息，组成区县选择的下拉项HTML
     * @method  getCountryItems
     * @return {string}  下拉项的HTML片段
     * @param {string} value  城市编码，当前值
     * @param {bool} hasEmptyItem  是否有空项，一般查询HTML输出时用到
     * @param {string} cityValue  当前城市编码
     */
    async getCountryItems(value,hasEmptyItem,cityValue){
        let html = [];
        value = think.isEmpty(value) ? '-1': value;
        if(hasEmptyItem){
            html.push(`<option value="-1" ${value =="-1" ? "selected":""}>请选择</option>`);
        }
        let city =think.isEmpty(cityValue) ? '':cityValue;
        if(!think.isEmpty(value) && value !== '-1'){
            city = value.substring(0,4)+'00';
        }
        let countrys = await this.getCountrys(city);
        for(let item of countrys){
            html.push(`<option value="${item.c_ucode}" ${item.c_ucode == value ? "selected":""}>${item.c_name}</option>`);
        }
        return html.join('');
    }

}
