var subpage_style = {
	top: '45px',
	bottom: '50px'
};

var curView = null;
var curModulename = '';
var menuhtml = "";	//菜单的HTML

var main, menu;
var showMenu = false;
var logout = false;
var childlist = new Array();
var gps ={lat:0,lng:0};
var userGPSSet={c_user:0,c_status:8};

mui.init();

mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");
	main = plus.webview.currentWebview();

	app.getPosBaidu(function(lat, lng){
		gps.lat = "" + lat;
		gps.lng = "" + lng;
	});

	getMenuList();	//取菜单

	//setTimeout的目的是等待窗体动画结束后，再执行create webview操作，避免资源竞争，导致窗口动画不流畅；
	setTimeout(function() {
		menu = mui.preload({
			id: 'menu',
			url: 'menu.html',
			styles: {
				left: "30%",
				width: '70%',
				zindex: 9997
			}
		});
	}, 300);
//	setTimeout(function(){
//		getUserGPSSet();	//取GPS用户的设置
//	},1000);


});

function initview(menulist, buttonlist) {
	var z = 0;
	for (var i = 0; i < buttonlist.length; i++) {
		var btn = document.createElement("a");
		btn.setAttribute("class", "mui-tab-item");
		btn.setAttribute("id", buttonlist[i].modulename + z);
		btn.setAttribute("modulename", buttonlist[i].modulename);
		btn.setAttribute("url", buttonlist[i].url);
		btn.setAttribute("parmsUrl", buttonlist[i].parmsUrl);
		btn.setAttribute("title", buttonlist[i].title);
		btn.innerHTML = '<span class="mui-icon mui-icon-arrowup"></span><span class="mui-tab-label">' + buttonlist[i].title + '</span>';
		document.getElementById("index-footer").appendChild(btn);
		z++;
	}
	var more = document.createElement("a");
	more.setAttribute("class", "mui-tab-item");
	more.setAttribute("id", "more");
	more.innerHTML = '<span class="mui-icon mui-icon-more"></span><span class="mui-tab-label">更多</span>';
	document.getElementById("index-footer").appendChild(more);

	mui('.mui-tab-item')[0].classList['add']('mui-active');
	document.getElementById("title").innerHTML = buttonlist[0].title;

	for (var i = 0; i < menulist.length; i++) {
		menuhtml += '<h4 class="title">' + menulist[i].title + '</h4>';
		menuhtml += '<ul class="mui-table-view mui-table-view-chevron mui-table-view-inverted">';
		for (var j = 0; j < menulist[i].modules.length; j++) {
			menuhtml += '<li class="mui-table-view-cell"><a id="' + menulist[i].modules[j].modulename + z + '" modulename="'
			+ menulist[i].modules[j].modulename + '" parmsUrl="' + menulist[i].modules[j].parmsUrl + '" title="' + menulist[i].modules[j].title + '" url="' + menulist[i].modules[j].url
			+ '" class="mui-navigate-right erp-menu-item">' + menulist[i].modules[j].title + '</a></li>';
			z++;
		}
		menuhtml += '</ul>';
	}
}

/**
 * 从服务器取菜单列表
 *
 */
function getMenuList() {
	plus.nativeUI.showWaiting("数据加载中...");
	mui.ajax(app.getDomain() + "/admin/mob/get_menus", {
		data: {},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器获取数据失败！");
		},
		success: function(data) {
//console.log(JSON.stringify(data));

			var menulist = data.menus;
			var buttonlist = data.btns;

			initview(menulist, buttonlist);

            switchview(buttonlist[0].title, buttonlist[0].modulename + 0, buttonlist[0].modulename, buttonlist[0].parmsUrl,buttonlist[0].url);
            curModulename = buttonlist[0].modulename;

			plus.nativeUI.closeWaiting();
		}
	});
}

//TODO: 取用户的GPS设置
function getUserGPSSet() {
	//console.log(app.getSettings().userGuid);
	mui.ajax(app.getCallDomain() + "/utils/GetGpsSetByGuid", {
		data: { userguid : app.getSettings().userGuid },
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("获取用户的GPS设置数据失败！");
		},
		success: function(data) {
			var total = data.total;
			if(total > 0) {
				userGPSSet = data.list[0];
				userGPSSet.isUpdate = true;
				console.log(JSON.stringify(userGPSSet));
				//设置签到、签退的菜单显示
				mui.fire(menu, "menu:sign", { type: userGPSSet.c_status == "1" || userGPSSet.c_status == "8"});
				setInterval("updateUserGPSStatus()", 10000);	//设置定时上传PGS信息
					//plus.timerlocation.startLocation(app.getSettings().userGuid, 1, week, time_begin, time_end, app.getCallDomain() + "/utils/userlocationadd", function(result) {},function(err){app.toast(err)})

			}
		}
	});
}
function userGPSSign(type) {
	if(userGPSIsUpdate()){
		app.getPosBaidu(function(lat, lng){
			if(lat >0){
				gps.lat = "" + lat;
				gps.lng = "" + lng;

				mui.ajax(app.getCallDomain() + "/utils/UserLocationAdd", {
					data: { c_user: userGPSSet.c_user,
					        c_lat : gps.lat,
					        c_lng : gps.lng,
					        c_status : (type == true ? 7 : 8)},		//7:签到
					type: "post",
					dataType: 'json',
					timeout: 5000,
					error: function(request) {
						app.toast((type == true ? "签到" : "签退" )+"失败！");
					},
					success: function(data) {
						if(data.statusCode == 200) {
							var msg = type == true ? "签到" : "签退" ;
					        app.toast(msg + "成功");
						    mui.fire(menu, "menu:sign", {  type: !type    });
						    userGPSSet.c_status = (type == true ? 7 : 8);
						} else {
							app.toast(data.message);
						}

					}
				});
			}
		});
	}
}
//根据GPS设置条件判断是否要上传定位信息
function userGPSIsUpdate(){
	if(!userGPSSet.isUpdate || userGPSSet.c_user ==0){
		userGPSSet.isUpdate = false;
		return false;
	}
	if(userGPSSet.c_week.indexOf(app.getWeek()) < 0){
		return false;
	}
	if(userGPSSet.c_begin_time >app.getTime() || userGPSSet.c_end_time < app.getTime()){
		return false;
	}
	return true;
}
function updateUserGPSStatus() {
	if(userGPSIsUpdate() && parseInt(userGPSSet.c_status) !== 8){
	//console.log(JSON.stringify(userGPSSet));
		app.getPosBaidu(function(lat, lng){
			if(lat >0){
				gps.lat = "" + lat;
				gps.lng = "" + lng;
				mui.ajax(app.getCallDomain() + "/utils/UserLocationAdd", {
					data: { c_user: userGPSSet.c_user,
					        c_lat : gps.lat,
					        c_lng : gps.lng,
					        c_status : 0},
					type: "post",
					dataType: 'json',
					timeout: 5000,
					error: function(request) {
						app.toast('位置信息更新失败!');
						userGPSSet.isUpdate = false;
					}
				});
			}
		});
	}
}

//选项卡点击事件
mui('.mui-bar-tab').on('tap', 'a', function(e) {
	var id = this.getAttribute('id');
	if (id == "more") {
		openMenu();
	} else {
		var title = this.getAttribute('title');
		var modulename = this.getAttribute('modulename');
		var parmsUrl = this.getAttribute('parmsUrl');
		switchview(title, id, modulename, parmsUrl,this.getAttribute('url'));
	}

});

function switchview(title, newview, modulename, parmsUrl,url) {
	if (curView == newview) {
		return;
	}
	if(childlist.indexOf(newview) == -1) {
		var parm = {
		    modulename: modulename,
		    parmsUrl: parmsUrl
	    };
	    if(modulename == "StubGroup") {
	    	parm.gps = gps;
	    }
		var sub = plus.webview.create(url, newview, subpage_style, parm);
		main.append(sub);
		childlist.push(newview);
	}
	curModulename = modulename;

	if (curView != null) {
		document.getElementById("title").innerHTML = title;
		plus.webview.show(newview);
		plus.webview.hide(curView);
	}

	//更改当前活跃的选项卡
	curView = newview;
}

//选项卡点击事件
mui('header').on('tap', '.cmpage-btn-search', function(e) {
	mui.fire(plus.webview.getWebviewById(curView), "search_show", {
	});
});

//打开弹出窗口的按钮
mui('header').on('tap', '.cmpage-btn-view', cmpage.btnToView);

//执行某个动作的按钮
mui('header').on('tap', '.cmpage-btn-action', cmpage.btnToAction);

//右侧弹出按钮点击事件
document.getElementById("menu").addEventListener('tap', function(e) {
	e.stopPropagation();
	var activeView = plus.webview.getWebviewById(curView);
	activeView.evalJS('mui("#topPopover").popover("toggle")');
});

//添加自定义事件监听是否要显示数据
window.addEventListener('menulist_callback', function(event) {
	var d = event.detail;
	switchview(d.title, d.id, d.modulename, d.parmsUrl,d.url);
});

//替换头部按钮的HTML
window.addEventListener('header_show', function(event) {
	var d = event.detail;
	document.getElementById("main_header").innerHTML = d.headerHtml;
});


//添加自定义事件监听是否要显示数据
window.addEventListener('logout_callback', function(event) {
	plus.nativeUI.confirm("确定要注销吗?", function(e) {
		if (e.index == 0) {
			logout = true;
			login = plus.webview.currentWebview().opener();
			mui.fire(login, "logout");
			mui.back();
		}
	}, "注销", ["确定", "取消"]);

});

//添加自定义事件监听是否要显示数据
window.addEventListener('sign_callback', function(event) {
	var d = event.detail;
	var type = d.type == true ? "签到" : "签退" ;
	plus.nativeUI.confirm("确定要" + type + "吗?", function(e) {
		if (e.index == 0) {
			userGPSSign(d.type);
		}
	}, type, ["确定", "取消"]);
});

/*
 * 显示菜单菜单
 */
function openMenu() {
	if (!showMenu) {
		//解决android 4.4以下版本webview移动时，导致fixed定位元素错乱的bug;
		if (mui.os.android && parseFloat(mui.os.version) < 4.4) {
			document.querySelector("header.mui-bar").style.position = "static";
			//同时需要修改以下.mui-contnt的padding-top，否则会多出空白；
			document.querySelector(".mui-bar-nav~.mui-content").style.paddingTop = "0px";
		}

		mui.fire(menu, "menu:open", {
			html: menuhtml
		});

		//侧滑菜单处于隐藏状态，则立即显示出来；
		//显示完毕后，根据不同动画效果移动窗体；
		menu.show('none', 0, function() {
			menu.setStyle({
				left: '30%',
				transition: {
					duration: 150
				}
			});

			showMenu = true;
		});
	}
}

function closeMenu() {
	if (showMenu) {
		//解决android 4.4以下版本webview移动时，导致fixed定位元素错乱的bug;
		if (mui.os.android && parseFloat(mui.os.version) < 4.4) {
			document.querySelector("header.mui-bar").style.position = "fixed";
			//同时需要修改以下.mui-contnt的padding-top，否则会多出空白；
			document.querySelector(".mui-bar-nav~.mui-content").style.paddingTop = "44px";
		}

		menu.setStyle({
			left: '100%',
			transition: {
				duration: 150
			}
		});

		//等窗体动画结束后，隐藏菜单webview，节省资源；
		setTimeout(function() {
			menu.hide();
			showMenu = false;
		}, 300);
	}
}

//menu页面点击，关闭菜单；
window.addEventListener("menu:close", closeMenu);

//首页返回键处理
//处理逻辑：1秒内，连续两次按返回键，则退出应用；
var backButtonPress = 0;
var oldback = mui.back;
mui.back = function() {
	if (logout) {
		logout = false;
		oldback();
		return;
	}
	if (showMenu) {
		//菜单处于显示状态，返回键应该先关闭菜单,阻止主窗口执行mui.back逻辑；
		closeMenu();
	} else {
		backButtonPress++;
		if (backButtonPress > 1) {
			plus.runtime.quit();
//			plus.timerlocation.stopLocation(function(result) {},function(err){app.toast(err)});
		} else {
			plus.nativeUI.toast('再按一次退出应用');
		}
		setTimeout(function() {
			backButtonPress = 0;
		}, 1000);
	}

};
