var formdata = {
	pageIndex: 1,
	pageSize: 10,
	pageTotal:11
};
var searchHtml;
var searchInitHtml = null;

mui.init({
	swipeBack: false,
	pullRefresh: {
		container: '#pullrefresh',
		down: {
			callback: pulldownRefresh
		},
		up: {
			contentrefresh: '正在加载...',
			callback: pullupRefresh
		}
	}
});

mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");
	//框架参数初始化设置
	cmpage.init();

	formdata.modulename = cmpage.modulename;
	formdata.parmsUrl = JSON.stringify(cmpage.parmsUrl);
	formdata.gps = cmpage.gps;

	getListHtml();
	cmpage.addEventListener();

});

/**
 * 下拉刷新具体业务实现
 */
function pulldownRefresh() {
	setTimeout(function() {
		var table = document.body.querySelector('.cmpage-list');
		table.innerHTML = "";
		formdata.pageTotal = 11;
		formdata.pageIndex = 1;
		getListHtml();
		mui('#pullrefresh').pullRefresh().endPulldownToRefresh(); //refresh completed
	}, 100);
}

/**
 * 上拉加载具体业务实现
 */
function pullupRefresh() {
	setTimeout(function() {
		//mui('#pullrefresh').pullRefresh().endPullupToRefresh(((formdata.pageIndex+1) * formdata.pageSize >= formdata.pageTotal)); //参数为true代表没有更多数据了。
		mui('#pullrefresh').pullRefresh().endPullupToRefresh(false);
		getListHtml();
	}, 100);
}


/**
 * 从服务器取分页列表
 */
function getListHtml() {
	//console.log(JSON.stringify(formdata));
	if (formdata.pageIndex * formdata.pageSize < formdata.pageTotal) {
		plus.nativeUI.showWaiting("数据加载中...");
		mui.ajax(app.getDomain() + "/cmpage/mob/list", {
			data: formdata,
			type: "post",
			dataType: 'json',
			timeout: 5000,
			error: function(request) {
				//console.log(JSON.stringify(request));
				app.toast("服务器获取数据失败！");
				plus.nativeUI.closeWaiting();
			},
			success: function(data) {
				//app.debug(JSON.stringify(data));
				if (data.statusCode == 200) {
					var table = document.body.querySelector('.cmpage-list');
					table.innerHTML += data.listHtml;
					formdata.pageTotal = data.count;
					searchHtml = data.queryHtml;
					if(searchInitHtml == null) {
						searchInitHtml = data.queryHtml;
					}
					document.body.querySelector('.cmpage-menu').innerHTML = data.popBtnsHtml;
					mui.fire(cmpage.parentView, "header_show", {headerHtml:data.headerBtnsHtml} );
					//cmpage.addEventListener();
				} else {
					app.toast("数据加载失败请稍后重试！");
				}
				formdata.pageIndex ++;
				plus.nativeUI.closeWaiting();
			}
		});
	}
}

//显示搜索页面
window.addEventListener('search_show', function(event) {
	if(searchHtml){
		setTimeout(function() {
			mui.openWindow({
				id: cmpage.html.SEARCH +app.getRandomNum(1,50),
				url: cmpage.html.SEARCH,
				extras: {
					modulename: formdata.modulename,
					searchHtml: searchHtml,
					searchInitHtml: searchInitHtml
				},
				show: {
					autoShow: false
				}
			});
		}, 100);		
	}
});

//搜索页面返回后的刷新
window.addEventListener('search_callback', function(event) {
	var table = document.body.querySelector('.cmpage-list');
	table.innerHTML = "";
	var d = event.detail;
	formdata = d.data;
	formdata.pageIndex = 1;
	formdata.pageSize = 10;
	formdata.pageTotal = 11;
	console.log(JSON.stringify(formdata));
	getListHtml();
});
