var pageTotal = 11;
var modulename, parmsUrl;
var searchPage;
var firstPage = null;
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
mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

    modulename = mui.currentWebview.modulename;
    parmsUrl = mui.currentWebview.parmsUrl;

	formdata = {
		modulename: modulename,
		parmsUrl: parmsUrl,
		pageIndex: 1,
		pageSize: 10
	};
	if (modulename != "Customer" && modulename != "CustomerPrivate"
	&& modulename != "FaultInfoAZ" && modulename != "FaultInfoSB"&&modulename != "WaitingTask") {
		var newbtn = document.getElementById("new-btn");
		newbtn.parentNode.removeChild(newbtn);
		document.getElementById("topPopover").style.height = "55px";
	}
	if(modulename == "StubGroup") {
		formdata.gisLat = "" + mui.currentWebview.gps.lat;
		formdata.gisLng = "" + mui.currentWebview.gps.lng;
	}
	getMobJsonList();
});

/**
 * 下拉刷新具体业务实现
 */
function pulldownRefresh() {
	setTimeout(function() {
		var table = document.body.querySelector('.erp-commpage-list');
		table.innerHTML = "";
		pageTotal = 11;
		formdata.pageIndex = 1;
		getMobJsonList();
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
		getMobJsonList();
	}, 100);
}

//列表item点击事件
mui('.erp-commpage-list').on('tap', 'a', function(e) {
	var elem = this;
	var url = this.getAttribute('href');
	var type = this.getAttribute('data-type');
	var parm = eval('(' + this.getAttribute('data-parm') + ')') || {};
	if (url == null) {
		return
	}
	mui('.mui-selected a').each(function(i, a) {
		a.setAttribute("style", "");
	});

	if (type == "view") {
		var extras;
		if (url == "/html/commpage/commpage-edit.html" || url == "/html/commpage/commpage-view.html") {
			var editID = this.getAttribute('data-id');
			if(editID == -1) {
				parmsUrl = this.getAttribute('parmsUrl');
				modulename = this.getAttribute('modulename');
			}
			extras = {
				modulename: modulename,
				editID: editID,
				parmsUrl: parmsUrl
			};
		} else if (url == "/html/commpage/commpage-appr.html") {
			var get_url = this.getAttribute('data-url');
			var submit_url = this.getAttribute('data-url-submit');
			var get_parm = this.getAttribute('data-parm');
			var btns = this.getAttribute('data-btns');
			extras = {
				get_url: get_url,
				submit_url: submit_url,
				get_parm: get_parm,
				btns: btns
			};
		} else if (url == "/html/commpage/commpage-file.html" || url == "/html/commpage/commpage-stub.html") {
			var get_url = this.getAttribute('data-url');
			var get_parm = JSON.parse(this.getAttribute('data-parm'));
			get_parm.modulename = modulename;
			extras = {
				get_url: get_url,
				get_parm: JSON.stringify(get_parm)
			};
		}
		//console.log(JSON.stringify(extras));
		setTimeout(function() {
			mui.openWindow({
				id: url,
				url: url,
				extras: extras,
				show: {
					autoShow: false
				}
			});
		}, 100);
	} else if (type == "action") {
		plus.nativeUI.confirm("确定要" + this.innerHTML + "吗?", function(e) {
			if (e.index == 0) {
				mui.ajax(app.getDomain() + url, {
					data: parm,
					type: "post",
					dataType: 'json',
					timeout: 5000,
					error: function(request) {
						app.toast("服务器通信失败！");
					},
					success: function(data) {
						app.toast(data.message);
						pulldownRefresh();
						//						if(elem.innerHTML == "删除") {							
						//							elem.parentNode.parentNode.parentNode.removeChild(elem.parentNode.parentNode);
						//						}
					}
				});
			}
		}, this.innerHTML, ["确定", "取消"]);
	}
});

/**
 * 从服务器取分页列表
 */
function getMobJsonList() {
	//console.log(JSON.stringify(formdata));
	if (formdata.pageIndex * formdata.pageSize < pageTotal) {
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
//				console.log(JSON.stringify(data));
				if (data.statusCode == 200) {
					var table = document.body.querySelector('.erp-commpage-list');
					table.innerHTML += data.listHtml;
					modulename = data.modulename;
					parmsUrl = data.parmsUrl;
					pageTotal = data.count;
					searchPage = data.queryHtml;
					if(firstPage == null) {
						firstPage = data.queryHtml;
					}
				} else {
					app.toast("数据加载失败请稍后重试！");
				}
				formdata.pageIndex ++;
				plus.nativeUI.closeWaiting();
			}
		});
	}
}

//搜索按钮点击事件
mui('.erp-commpage-menu').on('tap', 'a', function(e) {
	mui("#topPopover").popover("toggle");
	var url = this.getAttribute("href");
	var extras;
	if (url == "commpage-search.html") {
		extras = {
			modulename: modulename,
			page: searchPage,
			firstpage: firstPage
		};
	} else if (url == "commpage-edit.html") {
		extras = {
			modulename: modulename,
			id: 0
		};
	}
	setTimeout(function() {
		mui.openWindow({
			id: url,
			url: url,
			extras: extras,
			show: {
				autoShow: false
			}
		});
	}, 100);

});

//添加自定义事件监听是否要显示数据
window.addEventListener('search_callback', function(event) {
	var table = document.body.querySelector('.erp-commpage-list');
	table.innerHTML = "";
	var d = event.detail;
	formdata = d.data;
	formdata.pageIndex = 1;
	formdata.pageSize = 10;
	pageTotal = 11;
	getMobJsonList();
});