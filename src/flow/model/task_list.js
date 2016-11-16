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
     * 是否显示列表中某行的某个按钮，子类中重写本方法可以改变行按钮显示的逻辑
     * @method  isShowRowBtn
     * @return {boolean} 是否显示
     */
    isShowBtn(rec,btn){
        if(btn.c_object.indexOf('.Terminate')>0){
            return rec.c_status === global.enumTaskStatus.RUN || rec.c_status === global.enumTaskStatus.SUSPEND;
        }else if(btn.c_object.indexOf('.Suspend')>0){
            return rec.c_status === global.enumTaskStatus.RUN;
        }else if(btn.c_object.indexOf('.Run')>0) {
            return rec.c_status === global.enumTaskStatus.SUSPEND;
        }else if(btn.c_object.indexOf('.AutoExecOpen')>0){
                return think.isEmpty(global.autoExecTimer);
        }else if(btn.c_object.indexOf('.AutoExecClose')>0){
            return !think.isEmpty(global.autoExecTimer);
        }else {
            return super.isShowBtn(rec,btn);
        }
    }

}
