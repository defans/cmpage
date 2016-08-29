var modulename, listPage;
var curItem = null;
mui.init();

mui.plusReady(function() {
	modulename = mui.currentWebview.modulename;
	listPage = mui.currentWebview.listPage;
	var table = document.body.querySelector('.mui-table-view');
	table.innerHTML = listPage;

	//关闭等待框
	plus.nativeUI.closeWaiting();
	//显示当前页面
	mui.currentWebview.show();
});

//列表item点击事件
mui('.mui-table-view').on('tap', 'a', function(e) {
	var url = this.getAttribute('href');
	var id = this.getAttribute('data-id');
	var module = modulename;
	if (module == "Msg") {
		id = this.getAttribute('data-docu');
		module = this.getAttribute('data-modulename');
	}
	if(curItem != null){
		curItem.setAttribute('style','');
	}
	this.setAttribute('style','background-color: #EEEEEE;');
	curItem = this;
	setTimeout(function() {
		mui.openWindow({
			id: url,
			url: url,
			extras: {
				modulename: module,
				c_id: id
			},
			show: {
				autoShow: false
			}
		});
	}, 100);

});