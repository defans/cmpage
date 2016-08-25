'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 * t_code model ,代码于参数设置的操作类
 */
export default class extends think.model.base {

    //用递归法从t_code缓存中返回所有子节点, selfContains: 是否加入自身节点
    async getTreeList(rootID, selfContains){
        let codes = await this.getCodes();
        let ret = [];
        for(let codeMd of codes){
            if(selfContains && codeMd.id == rootID ){  //加入自身
                ret.push(codeMd);
            }else if(codeMd.c_pid == rootID){
                ret.push(codeMd);
                let childs =await this.getChildList(codeMd.id,codes, 1);
                for(let child of childs){ ret.push(child);  }
            }
        }
        return ret;
    }
    async getChildList(pid,codes,depth){
        if((depth ++) >20){
            console.log('code.getChildList depth > 20 layer.');
            return [];
        }
        let ret = [];
        for(let codeMd of codes){
            if(codeMd.c_pid === pid){
                ret.push(codeMd);
                let childs =await this.getChildList(codeMd.id, codes, depth);
                for(let child of childs){ ret.push(child);  }
            }
        }
        return ret;
    }

    async getNameById(id){
        let codes =await this.getCodes();
        for(let codeMd of codes){
            if(codeMd.id === id){
                return codeMd.c_name;
            }
        }
        return '';
    }
    async getCodeById(id){
        let codes =await this.getCodes();
        for(let codeMd of codes){
            if(codeMd.id === id){
                return codeMd;
            }
        }
        return {};
    }
    async getCodesByPid(pid){
        let codes =await this.getCodes();
        let ret =[];
        for(let codeMd of codes){
            if(codeMd.c_pid === pid){
                ret.push(codeMd);
            }
        }
        return ret;
    }
    async getCodesByRoot(rootID){
        let codes =await this.getCodes();
        let ret =[];
        for(let codeMd of codes){
            if(codeMd.c_root == rootID){
                ret.push(codeMd);
            }
        }
        return ret;
    }
    getSexName(value){
        return think.isEmpty(value) ? '男':'女';
    }
    /******************参数设置***************** begin
     * */
    async getParms(){
        return await think.cache("codeParms", () => {
                return this.getTreeList(4,false);
        });
    }
    async getParmsByPid(pid){
        let parms =await this.getParms();
        //let parentID = parseInt(pid);
        pid = parseInt(pid);
        let ret =[];
        for(let parm of parms){
            if(parm.c_pid === pid){
                ret.push(parm);
            }
        }
        return ret;
    }
    async getParmsByPojb(pojb){
        let pid =await this.getParmByObj(pobj).id;
        return await this.getParmsByPid(pid);
    }
    async getParmById(id){
        let parms =await this.getParms();
        for(let parm of parms){
            if(parm.id === id){
                return parm;
            }
        }
        return {};
    }
    async getParmByObj(ojb){
        let parms = await this.getParms();
        for(let parm of parms){
            if(parm.c_ojbect === obj){
                return parm;
            }
        }
        return {};
    }
    /******************参数设置***************** end
     * */

    async clearCodeCache(){
        await think.cache('codeGroups',null);
        await think.cache('codeRoles',null);
        await think.cache('codeStocks',null);
        await think.cache('codeDepts',null);
        await think.cache('codeCodes',null);
        global.debug('code cache is clear!')
    }

    async getGroups(){
        return await think.cache("codeGroups", () => {
            return this.getTreeList(2,true);
        });
    }
    async getRoles(){
        return await think.cache("codeRoles", () => {
            return this.getTreeList(3);
        });
    }

    async getStocks(){
        return await think.cache("codeStocks", () => {
            return this.getTreeList(6);
        });
    }
    async getDepts(){
        return await think.cache("codeDepts", () => {
            return this.getTreeList(5,true);
        });
    }
    async getCodes(){
        return await think.cache("codeCodes", () => {
            return this.query('select * from t_code order by  c_pid,c_ucode ');
        });
    }


}