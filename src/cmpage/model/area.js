'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * model
 */

export default class extends think.model.base {

    async getProvinces(){
        return await think.cache(`provinces`, () => {
            return this.query(`select * from t_area where c_pid =0 order by c_ucode`);
        });
    }
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

    async getCitys(province){
        return await think.cache(`city${province}`, () => {
            return this.query(`select * from t_area where c_pid in(select id from t_area where c_ucode='${province}') order by c_ucode`);
        });
    }
    async getCountrys(city){
        return await think.cache(`country${city}`, () => {
            return this.query(`select * from t_area where c_pid in(select id from t_area where c_ucode='${city}') order by c_ucode`);
        });
    }

    /**
     * hasEmptyItem: true表示下列可空， 有空项， 在查询列设置中用到
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
