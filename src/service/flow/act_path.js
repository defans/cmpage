'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * 提供工作流的活动路径的相关方法，注意供act、task_act及其继承类的调用 <br/>
 * 一般不需要继承，也没有相关联的业务类
 * @class flow.model.act_path
 */
 const Base =require('../cmpage/base.js');
 module.exports = class extends Base {
    constructor() {
        super();
        this.connStr='cmpage';
    }

    /**
     * 根据ID取活动路径对象，供其他方法调用
     * @method  getActPathById
     * @return {object} 活动路径对象
     * @params {int} id 活动路径ID
     */
    async getActPathById(id){
        let list =await this.getActPaths();
        for(let md of list){
            if(md.id == id){
                return md;
            }
        }
        return {};
    }

    /**
     * 根据ID和模板ID取活动路径对象，供其他方法调用<br/>
     * 模板较多的时候，用本方法来改进性能
     * @method  getActPathByIdAndProcId
     * @return {object} 活动路径对象
     * @params {int} id 活动路径ID
     * @params {int} procID 流程模板ID
     */
    async getActPathByIdAndProcId(id,procID){
        let list =await this.getActPathsByProcId(procID);
        for(let md of list){
            if(md.id == id){
                return md;
            }
        }
        return {};
    }

    /**
     * 根据活动节点ID和模板ID取来源的节点ID，供其他方法调用
     * @method  getFromActIDs
     * @return {Array} 节点ID的列表
     * @params {int} actID 活动节点ID
     * @params {int} procID 流程模板ID
     */
    async getFromActIds(actID,procID){
        let list =await this.getActPathsByProcId(procID);
        let ret = [];
        for(let md of list){
            if(md.c_to == actID){
                ret.push(md.c_from);
            }
        }
        return ret;
    }

    /**
     * 根据活动节点ID和模板ID取去向的节点ID，供其他方法调用
     * @method  getToActIDs
     * @return {Array} 节点ID的列表
     * @params {int} actID 活动节点ID
     * @params {int} procID 流程模板ID
     */
    async getToActIds(actID,procID){
        let list =await this.getActPathsByProcId(procID);
        //debug(list,'act_path.getToActPaths - list');
        let ret = [];
        for(let md of list){
            if(md.c_from == actID){
                ret.push(md.c_to);
            }
        }
        return ret;
    }
    /**
     * 根据活动节点ID和模板ID取去向的路径列表，供其他方法调用
     * @method  getToActPaths
     * @return {Array} 去向路径的列表
     * @params {int} actID 活动节点ID
     * @params {int} procID 流程模板ID
     */
    async getToActPaths(actID,procID){
        let list =await this.getActPathsByProcId(procID);
        //debug(list,'act_path.getToActPaths - list');
        let ret = [];
        for(let md of list){
            if(md.c_from == actID){
                ret.push(md);
            }
        }
        return ret;
    }

    /**
     * 根据ID取活动路径对象的名称，一般用于页面模块配置中的‘替换’调用: flow/act_path:getNameById
     * @method  getNameById
     * @return {string}  活动名称
     * @param {int} id  活动路径ID
     */
    async getNameById(id){
        let list =await this.getActPaths();
        for(let md of list){
            if(md.id == id){
                return md.c_name;
            }
        }
        return '';
    }

    async getActPaths(){
        return await think.cache("procActPaths", () => {
            return this.query('select * from fw_act_path order by id ');
        });
    }

    async getActPathsByProcId(procID){
        if(procID === 0){
            return await this.getActPaths();
        }else{
            return await think.cache("procActPaths"+procID, () => {
                return this.query(`select * from fw_act_path where c_proc=${procID} order by id `);
            });    
        }
    }


}
