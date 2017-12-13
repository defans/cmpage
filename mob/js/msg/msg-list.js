var pageIndex = 0;
var pageSize = 10;
var pageTotal = 1;
var unreadcount = -1;
var searchPage;
var curItem = null;
var formdata;

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

//B页面onload从服务器获取列表数据；
mui.plusReady(function () {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	formdata = {
		modulename: "Msg",
		parms: "Msg",
		pageCurrent: 1,
		pageSize: 1
	};
	plus.nativeUI.showWaiting("数据加载中...");
	//从服务器获取数据
	getUnreadCount();
	setInterval("getUnreadCount()", 60 * 1000);
});

/**
 * 下拉刷新具体业务实现
 */
function pulldownRefresh() {
	setTimeout(function () {
		var table = document.body.querySelector('.erp-msg-list');
		table.innerHTML = "";
		var size = pageIndex * pageSize;
		size = size < pageSize ? pageSize : size;
		pageIndex = 0;
		getMsgList(size);
		mui('#pullrefresh').pullRefresh().endPulldownToRefresh(); //refresh completed
	}, 1000);
}

/**
 * 上拉加载具体业务实现
 */
function pullupRefresh() {
	setTimeout(function () {
		mui('#pullrefresh').pullRefresh().endPullupToRefresh(false); //参数为true代表没有更多数据了。
		getMsgList(pageSize);
	}, 1000);
}

//列表item点击事件
mui('.erp-msg-list').on('tap', 'a', function (e) {
	//更改消息状态
	var id = this.getAttribute('data-id');
	mui.ajax(app.getDomain() + "/Flow/MsgUpdateStatusRead", {
		data: {
			c_id: id
		},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			app.toast("服务器获取数据失败！");
		},
		success: function (ret) {
			if (ret.statusCode == 200) {
				getUnreadCount();
			}
		}
	});

	//打开查看页面
	var url = this.getAttribute('href');
	var docuID = this.getAttribute('data-docu');
	var modulename = this.getAttribute('data-modulename');
	if (curItem != null) {
		curItem.setAttribute('style', '');
	}
	this.setAttribute('style', 'background-color: #EEEEEE;');
	curItem = this;
	setTimeout(function () {
		mui.openWindow({
			id: url,
			url: url,
			extras: {
				modulename: modulename,
				c_id: docuID
			},
			show: {
				autoShow: false
			}
		});
	}, 100);

});

function getUnreadCount() {
	mui.ajax(app.getDomain() + "/Flow/MsgGetCountUnread", {
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			app.toast("服务器获取数据失败！");
		},
		success: function (data) {
			if (data.statusCode == 200) {
				if (unreadcount !== data.count) {
					unreadcount = data.count;
					mui.fire(mui.currentWebview.parent(), 'msglist_callback', {
						num: unreadcount
					});
					pulldownRefresh();
				}
			} else {
				app.toast(data.message);
			}
		}
	});
}

/**
 * 从服务器取运单列表
 */
function getMsgList(size) {
	if (pageIndex * size < pageTotal) {
		formdata.pageCurrent = pageIndex;
		formdata.pageCurrent += 1;
		formdata.pageSize = size;
		if (size > 10) {
			pageIndex = size / 10 + 1;
		} else {
			pageIndex += 1;
		}
		mui.ajax(app.getDomain() + "/cmpage/PageMobShow", {
			data: formdata,
			type: "post",
			dataType: 'json',
			timeout: 5000,
			error: function (request) {
				plus.nativeUI.closeWaiting();
				app.toast("服务器获取数据失败！");
			},
			success: function (data) {
				plus.nativeUI.closeWaiting();
				if (data.statusCode == 200) {
					var table = document.body.querySelector('.erp-msg-list');
					table.innerHTML += data.listPage;
					pageTotal = data.totalCount;
					searchPage = data.searchPage;
				} else {
					app.toast("数据加载失败请稍后重试！");
				}
			}
		});
	}
}

//搜索按钮点击事件
mui('.erp-msg-menu').on('tap', 'a', function (e) {
	mui("#topPopover").popover("toggle");
	var url = this.getAttribute("href");
	setTimeout(function () {
		mui.openWindow({
			id: url,
			url: url,
			extras: {
				modulename: "Msg",
				page: searchPage
			},
			show: {
				autoShow: false
			}
		});
	}, 100);

});

//添加自定义事件监听是否要显示数据
window.addEventListener('search_callback', function (event) {
	var table = document.body.querySelector('.erp-msg-list');
	table.innerHTML = "";
	var d = event.detail;
	formdata = d.data;
	pageIndex = 0;
	pageTotal = 1;
	getMsgList(pageSize);
});