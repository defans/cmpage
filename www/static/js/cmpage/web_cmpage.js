/** cmpage/page 相关的界面处理
 */
var cmpage = {};

/* cmpage/page/edit 上一条，下一条 */
function pageGotoEdit(modulename,editID){
    $.CurrentDialog.dialog('reload',{ url:"/cmpage/page/edit?modulename="+ modulename +"&id="+ editID
        +"&listIds="+ $.CurrentDialog.find('#listIds').val(), type:"GET" });
    return true;
}
/* cmpage/page/view 上一条，下一条 */
function pageGotoView(modulename,viewID){
    $.CurrentDialog.dialog('reload',{ url:"/cmpage/page/view?modulename="+ modulename +"&id="+ viewID
        +"&listIds="+ $.CurrentDialog.find('#listIds').val(), type:"GET" });
    return true;
}

/* cmpage/page/edit 工作流(状态流转类)相关编辑界面，保存后刷新或者关闭对话框 */
function pageSaveByAct(modulename,reloadUrl,flag,linkModulename){
    //var page = pageGetCurrent(obj);
    BJUI.alertmsg("confirm", "是否确定要执行本操作？", {
        okCall: function () {
            BJUI.ajax('ajaxform', {
                url: '/cmpage/page/save',
                form: $('#edit' + modulename + 'Form'),
                validate: true,
                loadingmask: true,
                okCallback: function (json, options) {
                    if (flag === 'close') {
                        BJUI.dialog('closeCurrent');
                    }
                    if(linkModulename){
                        var rec = json.data;
                        var url = reloadUrl +'&id=' + rec.id +'&c_id=' + rec.id;
                        //alert(url);
//                        if(reloadOpenType == 'navtab'){
                            BJUI.navtab('reload',linkModulename, {url: url});
//                        }else{
                            BJUI.dialog('reload', linkModulename, {url: url});
//                        }
                    }
                }
            });
        }
    });
    return false;
}

/* cmpage/page/edit 工作流相关编辑界面，保存后刷新或者关闭对话框 */
function pageSaveByTask(modulename,reloadUrl,flag){
    //var page = pageGetCurrent(obj);
    BJUI.alertmsg("confirm", "是否确定要执行本操作？", {
        okCall: function () {
            BJUI.ajax('ajaxform', {
                url: '/cmpage/page/save',
                form: $('#edit' + modulename + 'Form'),
                validate: true,
                loadingmask: true,
                okCallback: function (json, options) {
                    if (flag === 'close') {
                        BJUI.dialog('closeCurrent');
                    } else {
                        var rec = json.data;
                        BJUI.dialog('reload', {url: reloadUrl + '&id=' + rec.id + '&taskID=' + rec.c_task });
                    }
                }
            });
        }
    });
    return true;
}

/* cmpage/page/list -- delete record */
function pageDelete(id,obj,flag) {
    var page = pageGetCurrent(obj);
    var modulename = page.find('#modulename').val();
    BJUI.alertmsg("confirm", "是否确定要删除？",{
        okCall:function(){
            BJUI.ajax('doajax', {
                url: "/cmpage/page/delete?modulename="+ modulename +"&id=" + id+"&flag=" + flag,
                loadingmask: true,
                okCallback: function(json, options) {
                    BJUI.alertmsg(json.statusCode=="200" ? "info":"error",json.message);
                    $('#btnSearch'+ modulename).click();
                }
            });
        }
    });
    return false;
}

/* cmpage/page/list export data to excel file */
function pageExportData(){
    BJUI.alertmsg("confirm", "是否确定要导出数据？",{
        okCall:function(){
            $.fileDownload('/cmpage/page/excel_export?'+$.CurrentNavtab.find('#pagerForm').serialize(), {
                failCallback: function(responseHtml, url) {
                    BJUI.alertmsg("warn", "下载文件失败！");
                }
            });
        }
    });
    return false;
}

/* cmpage/page/list refresh list data */
function pageRefresh(modulename) {
    $("#btnSearch"+modulename).click();
}

/* cmpage/page/list(lookup) -- close current navtab or dialog */
function pageClose() {
    if( $.CurrentDialog){
        BJUI.dialog('closeCurrent');
    }else{
        BJUI.navtab('closeCurrentTab');
    }
    return false;
}

/* cmpage/page/list 鼠标单击显示选中行 */
function pageRowSelect(id,obj){
    var page = pageGetCurrent(obj);

    var oldRowID = page.find('#idSelect').val()
    if(oldRowID != id){
        page.find('#row'+oldRowID).removeClass('selected');
    }
    page.find('#idSelect').val(id);
    page.find('#row'+id).toggleClass('selected');
    return true;
}

function pageGetCurrent(){
    //return  $(obj).closest('.navtab-panel').length ? $.CurrentNavtab : $.CurrentDialog;
    return  $.CurrentDialog || $.CurrentNavtab;
}

/* cmpage/page/edit_ms 主从表的编辑界面，保存后刷新或者关闭对话框 */
function pageSaveMs(modulename,reloadUrl,editID,pk){
    //var page = pageGetCurrent(obj);
    BJUI.ajax('ajaxform', {
        url: '/cmpage/page/save',
        form: $('#edit' + modulename + 'Form'),
        validate: true,
        loadingmask: true,
        okCallback: function (json, options) {
            if(editID === 0){
                var rec = json.data;
                BJUI.navtab('reload', {url: reloadUrl + '&'+pk+'=' +rec.id});
            }
        }
    });
    return true;
}

/* cmpage/utils/call_function 根据URL参数直接调用相关model的相关方法,  本方法的参数必填 */
function pageSelectAdd(obj,modulename,fn,parms){
    BJUI.ajax('doajax', {
        url: '/cmpage/utils/call_function_by_modulename?modulename='+modulename+'&fn='+fn+'&parms='+parms,
        loadingmask: true,
        okCallback: function (json, options) {
            if(json.statusCode == 200){
                $(obj).hide();
                //刷新父窗口
                $('#btnSearch'+modulename).click();
            }else{
                BJUI.alertmsg("warn", json.messag);
            }
        }
    });
    return true;
}

/* 简单调用ajax，不刷新界面等 */
function pageDoajax(url){
    BJUI.ajax('doajax', {
        url: url,
        loadingmask: true,
        okCallback: function (json, options) {
            if(json.statusCode == 200){
                if(json.messag){
                    BJUI.alertmsg("info", json.messag);                    
                }
            }else{
                BJUI.alertmsg("warn", json.messag);
            }
        }
    });
    return false;
}

//ztreeSelect 选择事件
function selectNodeCheck(e, treeId, treeNode) {
    var zTree = $.fn.zTree.getZTreeObj(treeId),
        nodes = zTree.getCheckedNodes(true);
    var ids = '', names = '';

    for (var i = 0; i < nodes.length; i++) {
        ids += ',' + nodes[i].id;
        names += ',' + nodes[i].name;
    }
    if (ids.length > 0) {
        ids = ids.substr(1), names = names.substr(1);
    }

    var $from = $('#' + treeId).data('fromObj');

    if ($from && $from.length) $from.val(names);
    var valueInput = $('#' + treeId).data('valueInput');
    $('#' + valueInput).val(ids);
}
//ztreeSelect 单击事件
function selectNodeClick(event, treeId, treeNode) {
    var zTree = $.fn.zTree.getZTreeObj(treeId);

    zTree.checkNode(treeNode, !treeNode.checked, true, true);

    event.preventDefault();
}
