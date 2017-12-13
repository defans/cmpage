var get_url;
var submit_url;
var get_parm;
var btns;
mui.init();

//B页面onload从服务器获取列表数据；
mui.plusReady(function () {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	get_url = mui.currentWebview.get_url;
	get_parm = mui.currentWebview.get_parm;
	submit_url = mui.currentWebview.submit_url;
	btns = mui.currentWebview.btns;
	//console.log(get_parm);
	if (btns == 1) {
		var btn = document.createElement("button");
		btn.setAttribute("class", "mui-btn mui-btn-primary mui-btn-block");
		btn.setAttribute("onclick", "postData()");
		btn.innerHTML = "提交";
		document.getElementById("content").appendChild(btn);
	} else if (btns == 2) {
		var btn1 = document.createElement("button");
		btn1.setAttribute("class", "mui-btn mui-btn-primary mui-btn-block");
		btn1.setAttribute("onclick", "postData('1')");
		btn1.innerHTML = get_parm.indexOf("\"TaskAFinish\"") > 0 ? "完成" : "通过";
		var btn2 = document.createElement("button");
		btn2.setAttribute("class", "mui-btn mui-btn-primary mui-btn-block");
		btn2.setAttribute("onclick", "postData('0')");
		btn2.innerHTML = get_parm.indexOf("\"TaskAFinish\"") > 0 ? "整改" : "不通过";
		document.getElementById("content").appendChild(btn1);
		document.getElementById("content").appendChild(btn2);
	}

	//从服务器获取数据
	getAppr();
});

/**
 * 从服务器获取表单
 */
function getAppr() {
	mui.ajax(app.getDomain() + get_url, {
		data: eval('(' + get_parm + ')'),
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			app.toast("服务器获取数据失败！");
		},
		success: function (data) {
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.erp-cmpage-appr');
				content.innerHTML += data.editPage;
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

/**
 * 提交表单  parma=vala&parmb=valb
 */
function postData(pass) {
	plus.nativeUI.confirm("确定要执行吗?", function (e) {
		if (e.index == 0) {
			if (pass) {
				document.getElementsByName("pass")[0].value = pass;
			}
			var value = $(".erp-cmpage-appr").serialize();
			mui.ajax(app.getDomain() + submit_url, {
				data: value,
				type: "post",
				dataType: 'json',
				timeout: 5000,
				error: function (request) {
					app.toast("服务器获取数据失败！");
				},
				success: function (data) {
					if (data.statusCode == 200) {
						app.toast(data.message);
						mui.back();
					} else {
						app.toast(data.message);
					}
				}
			});
		}
	}, this.innerHTML, ["确定", "取消"]);

}