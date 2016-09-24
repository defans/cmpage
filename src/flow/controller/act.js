'use strict';
/**
 流程模板配置和引擎调用接口的controller模块，实现了对外的URL接口，包括PC端和移动端

 注意点 :
 1. base.js继承自 think.controller.base;
 2. 其他controller 继承自 base.js;
 3. 具体的业务模块可以继承并扩展 flow/model/act.js 来实现增加标准以外的逻辑
 4. 可以根据具体的业务模块选择适当基类，例如审核类:flow/model/act_appr.js
 5. 使用flow的页面统一从 controller/act.js, proc.js 提供的URL接口调用，也可继承并重写相应方法来增加逻辑（但一般从model/act.js, proc.js继承即可）

 @module flow.controller
 */

/**
 * 提供工作流模板的活动节点设置的URL接口<br/>
 * 提供工作流引擎的活动节点运转相关的URL调用接口
 * @class flow.controller.act
 */
import Base from './base.js';

export default class extends Base {

    /**
     * 编辑流程节点内容， GET调用： /flow/act/edit?id=xxx
     * @method  edit
     * @return {json}   act编辑页面的HTML片段
     */
    async editAction(){
        let pageAct = await global.model('cmpage/module').getModuleByName('FwAct');
        pageAct.parmsUrl= '{}';
        pageAct.editID = this.get('id');
        pageAct.user = await this.session('user');
        let actEditHtml = await this.model('cmpage/page').htmlGetEdit(pageAct);

        return this.json({statusCode:200, actEditHtml:'<tbody>'+actEditHtml+'</tbody>'});
    }

    /**
     * 删除流程节点并删除相关的路径信息， GET调用： /flow/act/delete?id=xxx
     * @method  delete
     * @return {json}   删除状态
     */
    async deleteAction(){
        let actID = this.get('id');
        await this.model('fw_act_path').where(`c_from=${actID} or c_to=${actID}`).delete();
        await this.model('fw_act').where({id:actID}).delete();

        return this.json({statusCode:200, message:''});
    }

}