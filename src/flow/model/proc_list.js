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
     * @return {string}  流程图数据
     * @param {int} procID  流程模板ID
     */
    async getFlowMap(procID){
        let md = await this.model('fw_proc').where({id:procID}).find();
        //let map = eval("("+md.c_map+")");
        //if(think.isObject(map)){
        //    think.log(map);
        //}
        return think.isEmpty(md.c_map) ? '{states:{},paths:{},props:{props:{}}}' : md.c_map;

        /*****以下是图形信息分散存放于act和path中，然后拼接而成，但考虑到频繁保存的问题，故而废弃*********/
        //let rects = {};
        //let paths = {};
        //
        //if(procID > 0){
        //    let acts = await this.model('fw_act').where({c_proc:procID,c_status:0}).select();
        //    for(let act of acts){
        //        let rect =JSON.parse(act.c_map);
        //        rect.text.text = act.c_name;
        //        rect.data_id = act.id;
        //        rects[act.c_map_id] = rect;
        //    }
        //    let ps = await this.model('fw_act_path').where({c_proc:procID,c_status:0}).select();
        //    for(let p of ps){
        //        let path =JSON.parse(p.c_map);
        //        path.text.text = p.c_name;
        //        //path.from = `rect${p.c_from}`;
        //        //path.to = `rect${p.c_to}`;
        //        path.data_id = p.id;
        //        paths[p.c_map_id] = path;
        //    }
        //}
        //let ret = {states:rects, paths:paths, props:{props:{}}};
        //return JSON.stringify(ret);
    }

    /**
     * 保存流程模板的图形信息，如果某个节点和路径的data_id==0，则增加相应记录 POST调用： /flow/proc/save_map
     * @method  saveMap
     * @return {object}
     * @param {int} procID  流程模板ID
     */
    async saveFlowMap(parms){
        let flowMap = eval(`(${parms.flowMap})`);
        if(think.isObject(flowMap)){
            let actModel = this.model('fw_act');
            for(let k in flowMap.states){
                if(flowMap.states[k].data_id == 0){
                    let rect =flowMap.states[k];
                    think.log(rect);
                    let act = {c_name:rect.text.text, c_desc:rect.text.text, c_proc:parms.procID,c_type:1,c_class:'flow/act',c_btn_style:'',c_form:'',
                            c_from_rule:1, c_votes:0,c_to_rule:1, c_cc_rule:1,c_jump_rule:1,c_back_rule:1, c_status:0,c_map_id:k};
                    flowMap.states[k].data_id =await actModel.add(act);
                }
            }
            let pathModel = this.model('fw_act_path');
            for(let k in flowMap.paths){
                if(flowMap.paths[k].data_id == 0){
                    let path =flowMap.paths[k];
                    let fromAct = await actModel.where({c_proc:parms.procID,c_map_id:path.from}).find();
                    let toAct = await actModel.where({c_proc:parms.procID,c_map_id:path.to}).find();
                    let rec = {c_name:path.text.text, c_proc:parms.procID, c_from:fromAct.id, c_to:toAct.id,  c_status:0};
                    flowMap.paths[k].data_id = await pathModel.add(rec);
                }
            }
        }
        let map = global.objToString(flowMap);
        await this.model('fw_proc').where({id:parms.procID}).update({c_map:map});
    }


}
