var file = {};
var mainid,maintype,status;
var opener;
var nameTB = document.getElementById("name");
var memoTB = document.getElementById("memo");

mui.init();

mui.plusReady(function() {
	mainid = mui.currentWebview.mainid;
	maintype = mui.currentWebview.maintype;
	status = mui.currentWebview.status;
	opener = plus.webview.currentWebview().opener();
	if(mui.os.android) {
		document.getElementById("fileDIV").style.display = "block";
	}
});

// 上传文件
function upload() {
	if (!file.path) {
		app.toast("没有添加上传文件！");
		return;
	}
	var wt = plus.nativeUI.showWaiting();

	var task = plus.uploader.createUpload(app.getDomain() + "/Doc/FileUpload",
		{method: "POST",timeout: 5},
		function(t, status) { //上传完成
			if (status == 200) {
				var ret = JSON.parse(t.responseText);
				if(ret.statusCode == 200) {
					mui.fire(opener,"file_list_refresh",{});
					mui.back()
				}
				app.toast(ret.message);
			} else {
				app.toast("上传失败：" + status);
			}
			wt.close();
		}
	);
	task.addData("name", nameTB.value);
	task.addData("memo", memoTB.value);
	task.addData("hidFileID", "0");
	task.addData("mainType", maintype);
	task.addData("mainID", "" + mainid);
	task.addData("status", status);
	task.addFile(file.path, {
		key: file.name
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
		app.toast("Capture image failed: " + error.message);
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
	mui.openWindow("commpage-filepicker.html", "commpage-filepicker.html");
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