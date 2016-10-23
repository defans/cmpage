'use strict';

/**
 * 提供工作流模板设计的URL接口
 * @class flow.controller.proc
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 图形化设置流程模板， 调用： /flow/proc/desing?id=xxx
     * @method  design
     * @return {promise}
     */
    async designAction(){
        let page = await global.model('cmpage/module').getModuleByName('FwProcList');
        page.parmsUrl = JSON.stringify(this.get());
        page.editID = this.get("id");
        page.user = await this.session('user');
        //global.debug(page);
        let model = this.model('proc_list');
        let procEditHtml =await model.htmlGetEdit(page);
        this.assign('procEditHtml',procEditHtml);
        this.assign('page',model.getPageOther(page));

        let pageAct = await global.model('cmpage/module').getModuleByName('FwAct');
        pageAct.parmsUrl= '{}';
        pageAct.editID =0;
        pageAct.user = page.user;
        let actEditHtml = await this.model('cmpage/page').htmlGetEdit(pageAct);
        this.assign('actEditHtml','<tbody>'+actEditHtml+'</tbody>');

        let flowMap = await model.getFlowMap(page.editID);
        this.assign('flowMap',flowMap);

        return this.display();
    }
    /**
     * 取流程模板的图形信息 调用： /flow/proc/flow_map?proc_id=xxx
     * @method  flowMap
     * @return {promise}
     */
    async flowMapAction(){
        let procID = this.get("proc_id");
        let flowMap = await this.model('proc_list').getFlowMap(procID);
        this.assign('flowMap',flowMap);
        this.assign('procID',procID)

        return this.display();
    }

    /**
     * 保存流程模板的图形信息，如果某个节点和路径的data_id==0，则增加相应记录 POST调用： /flow/proc/save_map
     * @method  saveMap
     * @return {json}
     */
    async saveMapAction(){
        let parms =this.post();
        await this.model('proc_list').saveFlowMap(parms);

        return this.json({statusCode:200,message:'保存图形成功!'});
    }

    async clearCacheAction(){
        let ret={statusCode:200,message:'已成功清除了流程模板的缓存!',tabid: '',data:{}};

        await this.model('proc').clearCache();

        return this.json(ret);
    }

}