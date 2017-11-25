'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

const CMPage = require('../cmpage/page_mob.js');

module.exports = class extends CMPage {
    constructor() {
        super();
        this.connStr='cmpage';
    }


    /**
     * 初始化编辑页面的值
     */
    async pageEditInit(){
        let md = await super.pageEditInit();
        md.c_time_to = '2099-12-31 00:00:00';   //默认的截止日期
        md.c_class = 'flow/task'; //默认的实现类

        return md;
    }


    /**
     * 编辑页面保存,
     * 如果是多个表的视图，则根据存在于page.c_table中的列更新表，一般需要在子类中继承
     */
    async pageSave(parms){
        let md = await super.pageSave(parms);
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
        //debug(parms,'proc_list.saveFlowMap - parms');
        let flowMap = cmpage.objFromString(parms.flowMap);
        if(think.isObject(flowMap)){
            let actids =[];
            for(let k in flowMap.states){
                actids.push(flowMap.states[k].data_id);
            }
            await this.query(`delete from fw_act where c_proc=${parms.procID} and id not in(${actids.join(',')})`);
            for(let k in flowMap.states){
                if(flowMap.states[k].data_id == 0){
                    let rect =flowMap.states[k];
                    think.log(rect);
                    let act = {c_name:rect.text.text, c_desc:rect.text.text, c_proc:parms.procID,c_type:1,c_class:'flow/act',c_btn_style:'',c_form:'',
                            c_from_rule:1, c_votes:0,c_to_rule:1, c_cc_rule:1,c_jump_rule:1,c_back_rule:1, c_status:0,c_map_id:k};
                    flowMap.states[k].data_id =await this.model('fw_act').add(act);
                }
            }
//            await pathModel.query(`delete from fw_act_path where c_proc=${parms.procID} and (c_from not in(${actids.join(',')}) or c_to not in(${actids.join(',')}) or c_from is null or c_to is null)`);
            //路径全部更新
            await this.query(`delete from fw_act_path where c_proc=${parms.procID} `);
            for(let k in flowMap.paths){
                    let path =flowMap.paths[k];
                    let fromAct = await this.model('fw_act').where({c_proc:parms.procID,c_map_id:path.from}).find();
                    let toAct = await this.model('fw_act').where({c_proc:parms.procID,c_map_id:path.to}).find();
                    if(!think.isEmpty(fromAct) && !think.isEmpty(toAct)){
                        let rec = {c_name:path.text.text, c_proc:parms.procID, c_from:fromAct.id, c_to:toAct.id,  c_status:0};
                        flowMap.paths[k].data_id = await this.model('fw_act_path').add(rec);
                    }
            }
            let map = cmpage.objToString(flowMap);
            let actStart = await this.model('fw_act').where({c_proc:parms.procID, c_type:cmpage.enumActType.START}).find();
            await this.model('fw_proc').where({id:parms.procID}).update({c_map:map, c_act_start:think.isEmpty(actStart) ? 0 : actStart.id});
        }
    }

    /**
     * 复制流程模板生成新的流程模板，模板名称 xxxxx_copy
     * @method  copyToNewProc
     * @return {object}  拷贝状态，包括新的流程模板对象
     * @param {int} procID  流程模板ID
     */
    async copyToNewProc(procID){
        let proc = await this.model('fw_proc').where({id:procID}).find();
        if(think.isEmpty(proc))  return {statusCode:300, message:'源流程模板不存在!',proc:{}};
        let actList = await this.model('fw_act').where({c_proc:procID}).select();
        if(think.isEmpty(actList))  return {statusCode:300, message:'源流程模板未设置流程节点!',proc:{}};

        delete proc.id;
        proc.c_name += '_copy';
        proc.c_time = think.datetime();
        if(!think.isEmpty(this.user))   proc.c_user = this.user.id;
        proc.id = await this.model('fw_proc').add(proc);    //新的模板主信息
        let flowMap = cmpage.objFromString(proc.c_map);

        for(let act of actList){
            let oldActID = act.id;
            delete act.id;
            act.c_proc = proc.id;
            act.id = await this.model('fw_act').add(act);   //新的节点信息
            //新的节点权限指派
            await this.query(`insert fw_act_assign(c_act,c_type,c_link,c_way,c_type_exe)
                select ${act.id},c_type,c_link,c_way,c_type_exe from fw_act_assign where c_act=${oldActID}`);
            //更新流程图中节点的 data_id
            for(let p in flowMap.states){
                if(flowMap.states[p].data_id == oldActID){
                    flowMap.states[p].data_id = act.id;
                }
            }
        }
        //重新生成路径信息
        for(let p in flowMap.paths){
            let path =flowMap.paths[p];
            let fromActID = 0, toActID = 0;
            for(let act of actList){
                if(act.c_map_id == path.from)   fromActID = act.id;
                if(act.c_map_id == path.to)     toActID = act.id;
            }
            if(fromActID>0 && toActID>0){
                let rec = {c_name:path.text.text, c_proc:proc.id, c_from:fromActID, c_to:toActID,  c_status:0};
                flowMap.paths[p].data_id = await this.model('fw_act_path').add(rec);
            }
        }
        for(let act of actList){
            if(act.id == proc.c_act_start)  proc.c_act_start = act.id;
        }
        await this.model('fw_proc').where({id:proc.id}).update({c_map:cmpage.objToString(flowMap), c_act_start:proc.c_act_start});
        return {statusCode:200, message:'复制成功! 新的流程模板：'+proc.c_name, proc:proc};
    }

}
