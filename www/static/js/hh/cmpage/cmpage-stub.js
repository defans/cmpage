var get_url;
var get_parm;
var cur_stub;

mui.init();

//B页面onload从服务器获取列表数据；
mui.plusReady(function () {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	get_url = mui.currentWebview.get_url;
	get_parm = eval('(' + mui.currentWebview.get_parm + ')');

	//console.log(JSON.stringify(get_parm));
	//从服务器获取数据
	if (get_parm.modulename == "StubGroup") {
		document.getElementById("stub_search_form").style.display = 'none';
		getStubs();
	} else {
		//关闭等待框
		plus.nativeUI.closeWaiting();
		//显示当前页面
		//document.getElementById("stub_header").style.display ='none';		
		mui.currentWebview.show();
	}

});

/**
 * 从服务器获取表单
 */
function getStubs() {
	mui.ajax(app.getDomain() + get_url, {
		data: get_parm,
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			app.toast("服务器获取数据失败！" + get_parm.modulename);
		},
		success: function (data) {
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.erp-cmpage-stub');
				content.innerHTML += data.listPage;
			} else {
				app.toast("数据加载失败请稍后重试！");
			}
			//关闭等待框
			plus.nativeUI.closeWaiting();
			//显示当前页面
			mui.currentWebview.show();
		}
	});
}

//列表item点击事件
mui('.erp-cmpage-stub').on('tap', 'a', function (e) {
	var elem = this;
	var url = this.getAttribute('href');
	cur_stub = this.getAttribute('data-id');
	if (url == null) {
		return;
	} else if (url == "/html/cmpage/cmpage-edit.html") {
		extras = {
			modulename: this.getAttribute('data-modulename'),
			c_id: this.getAttribute('data-id'),
			parms: ''
		};
		setTimeout(function () {
			mui.openWindow({
				id: url,
				url: url,
				extras: extras,
				show: {
					autoShow: false
				}
			});
		}, 100);
		return;
	}

	mui('.mui-selected a').each(function (i, a) {
		a.setAttribute("style", "");
	});
	plus.nativeUI.confirm("确定要" + this.innerHTML + "吗?", function (e) {
		if (e.index == 0) {
			mui.ajax(app.getDomain() + url, {
				data: {},
				type: "post",
				dataType: 'json',
				timeout: 5000,
				error: function (request) {
					app.toast("服务器通信失败！ ");
				},
				success: function (data) {
					app.toast(data.message);
					setTimeout(function () {
						var content = document.body.querySelector('.erp-cmpage-stub');
						content.innerHTML = "";
						getStubs();
					}, 100);
				}
			});
		}
	}, this.innerHTML, ["确定", "取消"]);
});

//右侧弹出按钮点击事件
document.getElementById("add").addEventListener('tap', function (e) {
	e.stopPropagation();
	mui.openWindow({
		id: "/html/cmpage/cmpage-scan.html",
		url: "/html/cmpage/cmpage-scan.html",
		extras: {
			parm: JSON.stringify(get_parm)
		}
	});
});


//添加自定义事件监听是否要显示数据
window.addEventListener('stub_list_refresh', function (event) {
	var d = event.detail;
	get_parm.stubGroupID = d.stubGroupID;
	//console.log(JSON.stringify(get_url));
	setTimeout(function () {
		var content = document.body.querySelector('.erp-cmpage-stub');
		content.innerHTML = "";
		getStubs();
	}, 100);
});

//编码输入框搜索该桩群的电桩列表
document.getElementById("stub_search").addEventListener('tap', function (e) {
	e.stopPropagation();
	get_parm.sno = document.getElementById("stub_sno").value;
	mui.ajax(app.getDomain() + "/Stub/StubAddMob", {
		data: get_parm,
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			app.toast("服务器通信失败！");
		},
		success: function (data) {
			if (data.message) {
				app.toast(data.message);
			}
			if (data.statusCode == 200) {
				get_parm.stubGroupID = data.stubGroupID;
				//console.log(JSON.stringify(get_url));
				setTimeout(function () {
					var content = document.body.querySelector('.erp-cmpage-stub');
					content.innerHTML = "";
					getStubs();
				}, 100);
			}
		}
	});
});