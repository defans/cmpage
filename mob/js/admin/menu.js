//关闭back、menu按键监听，这样侧滑主界面会自动获得back和memu的按键事件，仅在主界面处理按键逻辑即可；
mui.init({
	keyEventBind: {
		backbutton: false,
		menubutton: false
	}
});

var main = null;
var sign = true;
mui.plusReady(function() {
	main = plus.webview.currentWebview().opener();
	document.getElementById("logout-btn").addEventListener('tap', function() {
		mui.fire(main, "logout_callback");
	});
	document.getElementById("sign-btn").addEventListener('tap', function() {
		mui.fire(main, "sign_callback", { type : sign });
	});
	var settings = app.getSettings();
	document.getElementById("account_tv").innerHTML = settings.user.c_name;
	document.getElementById("group_tv").innerHTML = settings.user.groupName;
	plus.runtime.getProperty(plus.runtime.appid, function(inf) {
		document.getElementById("version_tv").innerHTML = "版本号：" + inf.version;
	});
});

//在android4.4中的swipe事件，需要preventDefault一下，否则触发不正常
//故，在dragleft，dragright中preventDefault
window.addEventListener('dragright', function(e) {
	e.detail.gesture.preventDefault();
});
window.addEventListener('dragleft', function(e) {
	e.detail.gesture.preventDefault();
});
//主界面向右滑动，若菜单未显示，则显示菜单；否则不做任何操作；
window.addEventListener("swiperight", function(e) {
	if (Math.abs(e.detail.angle) < 15) {
		closeMenu();
	}
});

function closeMenu() {
	mui.fire(main, "menu:close");
}

//左滑显示出来的菜单，只需监听右滑，然后将菜单关闭即可；在该菜单上左滑，不做任何操作；
window.addEventListener("tap", closeMenu);

mui('.erp-menu-list').on('tap', '.erp-menu-item', function(event) {
	var title = this.innerHTML;
	var menu = this;
	var id = this.getAttribute("id");
	var modulename = this.getAttribute('modulename');
	var parms = this.getAttribute('parms');
	mui.fire(main, "menulist_callback", {
		title: menu.getAttribute('title'),
		id: menu.getAttribute('id'),
		modulename: menu.getAttribute('modulename'),
		url:menu.getAttribute('url'),
		parms: parms
	});
});


//添加自定义事件监听是否要显示数据
window.addEventListener('menu:open', function(event) {
	var d = event.detail;
	document.body.querySelector(".erp-menu-list").innerHTML = d.html;
});

//添加自定义事件监听是否要显示数据
window.addEventListener('menu:sign', function(event) {
	var d = event.detail;
	sign = d.type;
	var label = sign == true ? "签到" : "签退" ;
	document.getElementById("sign-btn").innerHTML = label;
});