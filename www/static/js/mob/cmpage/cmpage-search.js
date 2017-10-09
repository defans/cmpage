var content = document.body.querySelector('.cmpage-search');

mui.init();

mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");
	document.body.querySelector('.cmpage-search').innerHTML = mui.currentWebview.searchHtml;
	cmpage.init();
	
	//关闭等待框
	plus.nativeUI.closeWaiting();
	//显示当前页面
	mui.currentWebview.show();
		
	cmpage.addEventListener();
});
 

/**
 * 提交表单
 */
function postData() {
	mui.fire(cmpage.parentView,"search_callback",{
		data: app.serializeToOjb(document.body.querySelector('.cmpage-search'))
	});
	mui.back();
	
}

function reset() {
	document.body.querySelector('.cmpage-search').innerHTML = mui.currentWebview.searchInitHtml;
	cmpage.addEventListener();	
	app.toast("条件已重置");
}

