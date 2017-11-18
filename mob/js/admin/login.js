var settings;
var loginButton = document.getElementById('login');
var accountBox = document.getElementById('account');
var passwordBox = document.getElementById('password');
var autoLoginButton = document.getElementById("autoLogin");
var logingroupDIV = document.getElementById("logingroup");
var groupS;

mui.init({
	statusBarBackground: '#f7f7f7'
});

mui.plusReady(function() {
	plus.screen.lockOrientation("portrait-primary");
	settings = app.getSettings();

	getLogingroup();
});

function getLogingroup() {
	plus.nativeUI.showWaiting();
	mui.ajax(app.getDomain() + "/admin/mob/get_groups", {
		data: {},
		type: "post",
		timeout: 5000,
		error: function(request) {
			app.toast("服务器连接失败("+app.getDomain()+")！");
			plus.nativeUI.closeWaiting();
		},
		success: function(data) {
			//console.log(JSON.stringify(data));
			logingroupDIV.innerHTML += data.data;
			
			groupS = document.getElementById("group");
			
			//检查 "登录状态/锁屏状态" 结束
			autoLoginButton.classList[settings.autoLogin ? 'add' : 'remove']('mui-active');

			//检查 "登录状态/锁屏状态" 开始
			if (settings.autoLogin && settings.user) {
				accountBox.value = settings.user.c_login_name;
				passwordBox.value = settings.password;
				groupS.value = settings.user.groupID;
				login(accountBox.value, passwordBox.value, groupS.value);
			}else {
				accountBox.value = 'defans';
				passwordBox.value = '123456';
			}

			loginButton.onclick = function() {
				setTimeout(function() {
					login(accountBox.value, passwordBox.value, groupS.value);
				}, 50);
			}

			autoLoginButton.addEventListener('toggle', function(event) {
				setTimeout(function() {
					var isActive = event.detail.isActive;
					settings.autoLogin = isActive;
				}, 50);
			}, false);
			plus.nativeUI.closeWaiting();
		}
	});
}

function login(account, password, group) {
	var wait = plus.nativeUI.showWaiting("登录中...");
	mui.ajax(app.getDomain() + "/admin/mob/login", {
		data: {
			loginName: account,
			loginPwd: app.md5(password),
			loginGroup: group
		},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("登录失败！");
			wait.close();
		},
		success: function(user) {
			if (user.id == 0) {
				wait.close();
				app.toast(user.msg);
			} else {
				settings.user = user;
				settings.password =password;	
				//console.log(JSON.stringify(settings));
				app.setSettings(settings);
				wait.close();
				setTimeout(function() {
					mui.openWindow({
						id: 'main',
						url: '../admin/main.html'
					});
				}, 100);

			}
		}
	});
}

//添加自定义事件监听是否要显示数据
window.addEventListener('logout', function(event) {
	accountBox.value = "";
	passwordBox.value = "";
	groupS.value = 2;
	autoLoginButton.classList['remove']('mui-active');
	app.setSettings({});
});

var backButtonPress = 0;
mui.back = function(event) {
	backButtonPress++;
	if (backButtonPress > 1) {
		plus.runtime.quit();
	} else {
		plus.nativeUI.toast('再按一次退出应用');
	}
	setTimeout(function() {
		backButtonPress = 0;
	}, 1000);
	return false;
};