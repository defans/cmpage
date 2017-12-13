mui.init();

mui.plusReady(function () {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");
	//框架参数初始化设置
	cmpage.init();

	//从服务器获取数据
	getEditHtml();

	cmpage.addEventListener();
});

/**
 * 从服务器获取表单
 */
function getEditHtml() {
	//console.log(editID);
	mui.ajax(app.getDomain() + "/cmpage/mob/edit", {
		data: {
			modulename: cmpage.modulename,
			parmsUrl: JSON.stringify(cmpage.parmsUrl),
			editID: cmpage.curID
		},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			app.toast("服务器获取数据失败！");
		},
		success: function (data) {
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.cmpage-edit');
				//console.log(data.editHtml);
				content.innerHTML += data.editHtml;
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
function saveData() {
	mui.ajax(app.getDomain() + "/cmpage/mob/save", {
		data: app.serialize(document.body.querySelector('.cmpage-edit')),
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