var wgtVer = null;

function plusReady() {
	// ......
	// 获取本地应用资源版本号
	plus.runtime.getProperty(plus.runtime.appid, function (inf) {
		wgtVer = inf.version;
		checkUpdate();
	});
}

mui.plusReady(plusReady);

// 检测更新
function checkUpdate() {
	plus.nativeUI.showWaiting("检测更新...");
	mui.ajax(app.getDomain() + "/admin/mob/get_version", {
		type: "get",
		dataType: 'json',
		timeout: 5000,
		error: function (request) {
			console.log("检测更新失败！");
			plus.nativeUI.closeWaiting();
		},
		success: function (data) {
			plus.nativeUI.closeWaiting();
			var version = data.version;
			var url = data.url;
			var memo = data.memo;
			if (version > wgtVer) {
				plus.nativeUI.confirm(memo, function (event) {
					if (event.index == 0) {
						downWgt(app.getDomain() + url); // 下载升级包
					}
				}, "检测到新版本，是否更新？");
			} else {
				console.log("无新版本可更新！");
			}
		}
	});
}

// 下载wgt文件
function downWgt(url) {
	plus.nativeUI.showWaiting("下载更新文件...");
	plus.downloader.createDownload(url, {
		filename: "_doc/update/"
	}, function (d, status) {
		if (status == 200) {
			console.log("下载更新成功：" + d.filename);
			installWgt(d.filename); // 安装wgt包
		} else {
			console.log("下载更新失败！");
		}
		plus.nativeUI.closeWaiting();
	}).start();
}

// 更新应用资源
function installWgt(path) {
	plus.nativeUI.showWaiting("安装更新文件...");
	plus.runtime.install(path, {}, function () {
		plus.nativeUI.closeWaiting();
		console.log("安装更新文件成功！");
		plus.nativeUI.alert("应用资源更新完成！", function () {
			plus.runtime.restart();
		});
	}, function (e) {
		plus.nativeUI.closeWaiting();
		console.log("安装更新文件失败[" + e.code + "]：" + e.message);
		plus.nativeUI.alert("安装更新文件失败[" + e.code + "]：" + e.message);
	});
}