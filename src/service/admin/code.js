'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------
/**
 用户及权限系统模块的model部分，实现了实现了相关的数据操作和逻辑处理

 注意点 :
 1. 用户界面显示的类继承自cmpage/page;
 2. 树形结构的参数设置统一存放于t_code表中；
 3. 账套用户和团队用户的设置相仿，逻辑相似；

 @module admin.service
 */

/**
 * 代码于参数设置的操作类，提供一些操作t_code表的方法
 * @class admin.service.code
 */
const Base = require('../cmpage/base.js');

module.exports = class extends Base {

    /**
     * 用递归法从t_code缓存中返回所有子节点
     * @method  getTreeList
     * @return {Array}  所有子节点组成的数组
     * @param {int} rootID  根节点的ID
     * @param {bool} [selfContains]   是否加入自身节点
     */
    async getTreeList(rootID, selfContains) {
        let codes = await this.getCodes();
        let ret = [];
        for (let codeMd of codes) {
            if (selfContains && codeMd.id == rootID) { //加入自身
                ret.push(codeMd);
            } else if (codeMd.c_pid == rootID) {
                ret.push(codeMd);
                let childs = await this.getChildList(codeMd.id, codes, 1);
                for (let child of childs) {
                    ret.push(child);
                }
            }
        }
        return ret;
    }
    async getChildList(pid, codes, depth) {
        if ((depth++) > 20) {
            console.log('code.getChildList depth > 20 layer.');
            return [];
        }
        let ret = [];
        for (let codeMd of codes) {
            if (codeMd.c_pid == pid) {
                ret.push(codeMd);
                let childs = await this.getChildList(codeMd.id, codes, depth);
                for (let child of childs) {
                    ret.push(child);
                }
            }
        }
        return ret;
    }

    /**
     * 根据参数ID取参数的名称，一般用于页面模块配置中的‘替换’调用: admin/cdoe:getNameById
     * @method  getNameById
     * @return {string}  参数名称
     * @param {int} id  参数ID
     * @param   {string} fieldNames 字段名称,逗号分隔
     * @param   {string} joinStr 连接的字符串
     */
    async getNameById(id, fieldNames, joinStr) {
        //debug(id,'code.getNameById - id');
        let codes = await this.getCodes();
        for (let codeMd of codes) {
            if (codeMd.id == id) {
                if (think.isEmpty(fieldNames)) {
                    return codeMd.c_name;
                } else {
                    return cmpage.strGetValuesByPropertyName(codeMd, fieldNames, joinStr)
                }
            }
        }
        return '';
    }
    async getNameWithColorById(id) {
        let md = await this.getCodeById(id);
        let other = cmpage.objFromString(md.c_other);
        if (!think.isEmpty(other.color)) {
            //debug(other,'code.getNameWithColorById - other');
            return `<label style="color:${other.color};">${md.c_name}</label>`
        } else {
            return md.c_name;
        }
    }
    /**
     * 根据参数ID取参数的记录对象
     * @method  getCodeById
     * @return {Object}  参数对象
     * @param {int} id  参数ID
     */
    async getCodeById(id) {
        let codes = await this.getCodes();
        for (let codeMd of codes) {
            if (codeMd.id == id) {
                return codeMd;
            }
        }
        return {};
    }
    /**
     * 根据父节点ID取参数列表
     * @method  getCodesByPid
     * @return {Array}  参数列表
     * @param {int} pid  父节点ID
     */
    async getCodesByPid(pid) {
        let codes = await this.getCodes();
        let ret = [];
        for (let codeMd of codes) {
            if (codeMd.c_pid == pid) {
                ret.push(codeMd);
            }
        }
        return ret;
    }
    /**
     * 根据父节点ID取下拉列表
     * @method  getCodeItemsByPid
     * @return {Array}  参数列表
     * @param {int} pid  父节点ID
     */
    async getCodeItemsByPid(pid, curValue, isBlank = true) {
        let ret = [];
        if (isBlank) {
            ret.push(`<option value="-1" ${defaultValue == 0 || defaultValue == -1 ? "selected" : ""}>请选择</option>`);
        }
        if (pid > 0) {
            let codes = await this.getCodes();
            for (let md of codes) {
                if (md.c_pid == pid) {
                    ret.push(`<option value="${md.id}" ${md.id == defaultValue ? "selected" : ""} >${md.c_name}</option>`);
                }
            }
        }
        return ret.join();
    }

    /**
     * 根据根节点ID取参数列表，树状
     * @method  getCodesByRoot
     * @return {Array}  参数列表
     * @param {int} rootID  根节点ID
     */
    async getCodesByRoot(rootID) {
        let codes = await this.getCodes();
        let ret = [];
        for (let codeMd of codes) {
            if (codeMd.c_root == rootID) {
                ret.push(codeMd);
            }
        }
        return ret;
    }
    /**
     * 根据参数值取性别，一般用于页面模块配置中的‘替换’调用: admin/cdoe:getSexName
     * @method  getSexName
     * @return {string}  性别
     * @param {bool} [value]  默认值
     */
    getSexName(value) {
        return think.isEmpty(value) ? '男' : '女';
    }
    /**
     * 取参数列表，带Parm的这几个方法一般是用户业务相关的参数，根节点ID === 4，用缓存
     * @method  getParms
     * @return {Array}  参数列表
     */
    async getParms() {
        return await think.cache("codeParms", () => {
            return this.getTreeList(4, false);
        });
    }
    /**
     * 根据父节点ID取参数列表
     * @method  getParmsByPid
     * @return {Array}  参数列表
     * @param {int} pid  父节点ID
     */
    async getParmsByPid(pid) {
        if (think.isEmpty(pid)) return [];

        let parms = await this.getParms();
        let ret = [];
        for (let parm of parms) {
            if (parm.c_pid == pid) {
                ret.push(parm);
            }
        }
        return ret;
    }
    /**
     * 根据父节点的c_object值取参数列表
     * @method  getParmsByPobj
     * @return {Array}  参数列表
     * @param {string} pobj  父节点的c_object
     */
    async getParmsByPobj(pobj) {
        let pid = await this.getParmByObj(pobj).id;
        return await this.getParmsByPid(pid);
    }
    /**
     * 根据参数ID取参数的记录对象
     * @method  getParmById
     * @return {Object}  参数对象
     * @param {int} id  参数ID
     */
    async getParmById(id) {
        let parms = await this.getParms();
        for (let parm of parms) {
            if (parm.id == id) {
                return parm;
            }
        }
        return {};
    }
    /**
     * 根据参数的c_object值取参数的记录对象
     * @method  getParmById
     * @return {Object}  参数对象
     * @param {string} obj  参数的c_object
     */
    async getParmByObj(obj) {
        let parms = await this.getParms();
        for (let parm of parms) {
            if (parm.c_ojbect == obj) {
                return parm;
            }
        }
        return {};
    }

    /**
     * 清空t_code表的相关缓存
     * @method  clearCodeCache
     */
    async clearCodeCache() {
        await think.cache('codeGroups', null);
        await think.cache('codeRoles', null);
        await think.cache('codeStocks', null);
        await think.cache('codeDepts', null);
        await think.cache('codeCodes', null);
        await think.cache('codeParms', null);
        await think.cache('groupUsers', null);
        cmpage.debug('code cache is clear!')
    }

    /**
     * 取账套列表，树状，可以用于页面模块配置中的‘下拉框选择’调用: admin/cdoe:getGroups
     * @method  getGroups
     * @return {Array}  账套列表
     */
    async getGroups() {
        return await think.cache("codeGroups", () => {
            return this.getTreeList(2, true);
        });
    }

    /**
     * 取角色列表，可以用于页面模块配置中的‘下拉框选择’调用: admin/cdoe:getRoles
     * @method  getRoles
     * @return {Array}  角色列表
     */
    async getRoles() {
        return await think.cache("codeRoles", () => {
            return this.getTreeList(3);
        });
    }

    /**
     * 取仓库列表，可以用于页面模块配置中的‘下拉框选择’调用: admin/cdoe:getStocks
     * @method  getStocks
     * @return {Array}  仓库列表
     */
    async getStocks() {
        return await think.cache("codeStocks", () => {
            return this.getTreeList(6);
        });
    }

    /**
     * 取部门列表，树状，可以用于页面模块配置中的‘下拉框选择’调用: admin/cdoe:getDepts
     * @method  getDepts
     * @return {Array}  部门列表
     */
    async getDepts() {
        return await think.cache("codeDepts", () => {
            return this.getTreeList(5, true);
        });
    }

    /**
     * 取t_code全表记录，缓存
     * @method  getCodes
     * @return {Array}  t_code记录列表
     */
    async getCodes() {
        return await think.cache("codeCodes", () => {
            return this.query('select * from t_code where c_status=0 order by  c_pid,c_ucode ');
        });
    }


}