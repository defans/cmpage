'use strict';

import Base from './base.js';

export default class extends Base {

    /**
     * 流程模板的图形和活动节点的设置
     */
    async editAction(){
        let page = await global.model('cmpage/module').getModuleByName('FwProc');
        page.parmsUrl = JSON.stringify(this.get());
        page.editID = this.get("id");
        page.user = await this.session('user');
        //global.debug(page);
        let model = this.model('proc');
        let procEditHtml =await model.htmlGetEdit(page);
        this.assign('procEditHtml',procEditHtml);
        this.assign('page',model.getPageOther(page));

        let pageAct = await global.model('cmpage/module').getModuleByName('FwAct');
        pageAct.parmsUrl= '{}';
        pageAct.editID =0;
        pageAct.user = page.user;
        let actEditHtml = await this.model('act').htmlGetEdit(pageAct);
        this.assign('actEditHtml',actEditHtml);

        let flowMap = await model.getFlowMap(page.editID);
        this.assign('flowMap',flowMap);

        return this.display();
    }
    /**
     * 图形化设置流程模板
     */
    async designAction(){
        return this.display();
    }


}