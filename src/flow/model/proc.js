'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

import CMPage from '../../cmpage/model/page_mob.js';

export default class extends CMPage {
    /**
     * 取查询项的设置，结合POST参数，得到Where字句
     */
    async getQueryWhere(page){
        let where =await super.getQueryWhere(page);
        return where +' and c_status<>-1';
    }

    /**
     * 初始化编辑页面的值
     */
    async pageEditInit(pageEdits,page){
        let md = await super.pageEditInit(pageEdits,page);
        md.c_time_to = '2099-12-31 00:00:00';   //默认的截止日期
        md.c_class = 'flow/proc'; //默认的实现类

        return md;
    }
    /**
     * 根据 page.c_other的设置，对页面相关参数进行设置
     */
    getPageOther(page){
        let ret = page;
        //console.log(ret);
        ret.editCloseBtn =true;
        if(page.editID == 0){
            return ret;
        }else{
            return super.getPageOther(page);
        }
    }


    /**
     * 编辑页面保存,
     * 如果是多个表的视图，则根据存在于page.c_table中的列更新表，一般需要在子类中继承
     */
    async pageSave(page,parms){
        let md = super.pageSave(page,parms);
        if(parms.id ==0 ){
            //根据模板的类型自动生成活动节点
            await this.initActs(md);
        }

    }
    /**
     * 根据模板的类型自动生成活动节点
     */
    async initActs(proc){

    }

    /**
     * 取模板的流程图数据
     * @method  getStocks
     * @return {Array}  仓库列表
     * @param {int} procID  流程模板ID
     */
    async getFlowMap(procID){
        let rects = {};
        let paths = {};

        if(procID > 0){
            let acts = await this.model('fw_act').where({c_proc:procID,c_status:0}).select();
            for(let act of acts){
                let rect =JSON.parse(act.c_map);
                rect.text.text = act.c_name;
                rect.data_id = act.id;
                rects[act.c_map_id] = rect;
            }
            let ps = await this.model('fw_act_path').where({c_proc:procID,c_status:0}).select();
            for(let p of ps){
                let path =JSON.parse(p.c_map);
                path.text.text = p.c_name;
                //path.from = `rect${p.c_from}`;
                //path.to = `rect${p.c_to}`;
                path.data_id = p.id;
                paths[p.c_map_id] = path;
            }
        }
        let ret = {states:rects, paths:paths, props:{props:{}}};
        return JSON.stringify(ret);
    }


    async getNameById(id){
        let list =await this.getProcs();
        for(let md of list){
            if(md.id === id){
                return md.c_name;
            }
        }
        return '';
    }
    async getProcs(){
        return await think.cache("procProcs", () => {
            return this.query('select * from fw_proc order by id ');
        });
    }



}
