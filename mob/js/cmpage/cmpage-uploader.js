var file = {};
var parmsUrl = {};

var nameTB = document.getElementById("name");
var memoTB = document.getElementById("memo");

mui.init();

mui.plusReady(function() {

	parmsUrl = plus.webview.currentWebview().parmsUrl;
	console.log(JSON.stringify(parmsUrl));
	
	if(mui.os.android) {
		document.getElementById("fileDIV").style.display = "block";
	}
	
	//关闭等待框
	plus.nativeUI.closeWaiting();
	//显示当前页面
	mui.currentWebview.show();
});

// 上传文件
function upload() {
	if (!file.path) {
		app.toast("没有添加上传文件！");
		return;
	}
	var wt = plus.nativeUI.showWaiting();

	var task = plus.uploader.createUpload(app.getDomain() + "/cmpage/page/upload_file",
		{method: "POST",timeout: 5},
		function(t, status) { //上传完成
			if (status == 200) {
				var ret = JSON.parse(t.responseText);
				if(ret.statusCode == 200) {
					//保存相关信息到后端数据库 t_file
					mui.ajax(app.getDomain() + '/cmpage/page/save', {
						data: {
							modulename:'FileList',
							c_link:parmsUrl.c_link || 0,
							c_link_type:parmsUrl.c_link_type || 'none',
							c_status:parmsUrl.c_status || 0,
							c_type:parmsUrl.c_type || 0,
							c_path:ret.filename,
							c_name:nameTB.value,
							c_memo:memoTB.value
						},
						type: "post",
						dataType: 'json',
						timeout: 5000,
						error: function(request) {
							app.toast("服务器通信错误！");
						},
						success: function(data) {
							if (data.statusCode == 200) {
								app.toast("数据保存成功！");
								mui.fire(plus.webview.currentWebview().opener(),"file_list_refresh",{});
								mui.back()
							} else {
								app.toast("数据保存失败，请稍后重试！");
							}
						}
					});					
					app.toast("上传："+ret.filename);
				}
			} else {
				app.toast("上传失败：" + status);
			}
			wt.close();
		}
	);
//	task.addData("name", nameTB.value);
//	task.addData("memo", memoTB.value);
//	task.addData("mainType", maintype);
//	task.addData("mainID", "" + mainid);
//	task.addData("status", status);
	task.addData("link_type", parmsUrl.c_link_type || 'none');
	task.addFile(file.path, {
		originalFilename: file.name
	});
	task.start();
}

// 拍照添加文件
function appendByCamera() {
	plus.camera.getCamera().captureImage(function(p) {
		plus.io.resolveLocalFileSystemURL(p, function(entry) {
			appendFile(entry.toLocalURL());
		}, function(error) {
			app.toast("resolveLocalFileSystemURL failed：" + error.message);
		});
	},
	function(error) {
		app.toast("拍照未成功: " + error.message);
	}, {
		filename: "_doc/camera/"
	});
}

// 从相册添加文件
function appendByGallery() {
	plus.gallery.pick(function(p) {
		appendFile(p);
	});
}

function appendFile(path) {	
	var strs = path.split("/");
	var dst = plus.io.convertLocalFileSystemURL("_doc/upload/" + strs[strs.length - 1]);
	if(dst.slice(0,7) != "file://") {
		dst = "file://" + dst;
	}
	plus.zip.compressImage({
			src: path,
			dst: dst,
			overwrite: true,
			quality: 20,
			width: "50%"
	    },
		function() {
			var img = document.getElementById("img");
	        img.style.backgroundImage = "url(" + dst + ")";
			file.name = "fileFile";
	        file.path = dst;
	        img.style.display = "block";
	        nameTB.style.display = "block";
	        memoTB.style.display = "block";
	        empty.style.display = "none";
		},
		function(error) {
			console.log("Compress error!");
			console.log(error);
	});
}

function fileSystem() {
	mui.openWindow("cmpage-filepicker.html", "cmpage-filepicker.html");
}

//添加自定义事件监听是否要显示数据
window.addEventListener('file_selected', function(event) {
	var d = event.detail;
	var path = d.path;
	file.name = "fileFile";
	file.path = path;
	img.style.display = "none";
	nameTB.style.display = "block";
	memoTB.style.display = "block";
	empty.style.display = "none";
});