var dir = "",
	root = [],
	current = null,
	parent = null,
	pitem = null,
	list = null;
var htmlItem = '<img class="ficon"></img><div><span class="fname"></span><br/><span class="finf">...</span></div>';
var opener;


mui.init();

mui.plusReady(function() {
	
	opener = plus.webview.currentWebview().opener();
	pitem = document.getElementById("pdir");
	list = document.getElementById("dcontent");
	// Get root item information
	var items = list.querySelectorAll(".fitem");
	for (var i = 1; i < items.length; i++) {
		updateRootItem(items[i]);
	}
});


// Update root information with item(HTMLUIElement)
function updateRootItem(item) {
	plus.io.resolveLocalFileSystemURL(dir + item.id, function(entry) {
		root.push(entry);
		item.entry = entry;
		updateInf(item, entry);
	}, function(e) {
		console.log("Update " + item.id + " information failed: " + e.message);
	});
}
// Update HTMLUIElement information with entry object
function updateInf(item, entry) {
	entry.getMetadata(function(metadata) {
		var inf = item.querySelector(".finf");
		if (entry.isDirectory) {
			inf.innerText = "文件夹:" + metadata.directoryCount + "项，文件:" + metadata.fileCount + "项";
		} else {
			inf.innerText = dateToStr(metadata.modificationTime);
		}
	}, function(e) {
		console.log("Get metadata " + entry.name + " failed: " + e.message);
	}, false);
}
// Update ui with entries
function updateList(entries) {
	var i, items = [].slice.apply(list.querySelectorAll(".fitem"));
	items.shift();
	// sort the entries
	entries.sort(sortCompareEntry)
		// Update item to ui
	for (i = 0; i < entries.length; i++) {
		var di = null;
		if (i < items.length) {
			di = items[i];
			di.style.display = "block";
		} else {
			di = document.createElement("div");
			di.className = "fitem";
			di.setAttribute("onclick", "openDir(this);");
			di.innerHTML = htmlItem;
			list.appendChild(di);
		}
		di.entry = entries[i];
		di.id = di.entry.name;
		di.querySelector(".fname").innerText = di.id;
		di.querySelector(".finf").innerText = "";
		if (entries === root) {
			di.querySelector(".ficon").src = "../../images/fdisk.png";
		} else {
			di.querySelector(".ficon").src = di.entry.isDirectory ? "../../images/fdir.png" : "../../images/ffile.png";
		}
		updateInf(di, di.entry);
	}
	// Hide other items
	for (; i < items.length; i++) {
		items[i].style.display = "none";
		items[i].entry = null;
	}
	// Reset scroll offset
	list.scrollTop = 0;
}
// Open directory with item(HTMLUIElement)
function openDir(item) {
	var entry = item.entry;
	if (!entry) {
		console.log("Open directory \"" + item.id + "\" with null!");
		return;
	}
	if (entry.isDirectory) {
		console.log("Open directory: \"" + dir + item.id + "\"");
		var dirReader = entry.createReader();
		dirReader.readEntries(function(entries) {
			parent = current;
			current = item.entry;
			dir = entry.toURL() + "/";
			// Dispaly up to parent item
			pitem.style.display = "block";
			// Update ui
			updateList(entries);
		}, function(e) {
			console.log("Read directory " + item.id + " failed: " + e.message);
		});
	} else {
		var dst = plus.io.convertLocalFileSystemURL(dir + item.id);
		if (dst.slice(0, 7) != "file://") {
			dst = "file://" + dst;
		}
		mui.fire(opener,"file_selected",{path: dst});
		mui.back();
	}
}
// Back to parent directory
function parentDir() {
	console.log("Go to previous directory: \"" + dir + "\"");
	var p = dir.lastIndexOf("/", dir.length - 2);
	if (p < 0 || !parent) { // Up to root
		dir = "";
		current = parent = null;
		// hide up to parent item
		pitem.style.display = "none";
		// Update ui
		updateList(root);
	} else {
		var dirReader = parent.createReader();
		dirReader.readEntries(function(entries) {
			dir = dir.substr(0, p + 1);
			console.log("Current directory: \"" + dir + "\"");
			current = parent;
			current.getParent(function(entry) {
				parent = entry;
			}, function(e) {
				console.log("Get \"" + current.name + "\" parent directory failed: " + e.emssage);
			});
			parent = null;
			// Update ui
			updateList(entries);
		}, function(e) {
			console.log("Read directory " + item.id + " failed: " + e.message);
		});
	}
}
// Entry sort compare
function sortCompareEntry(a, b) {
	if (a.isDirectory && b.isFile) {
		return -1;
	} else if (a.isFile && b.isDirectory) {
		return 1;
	} else {
		return a.name - b.name;
	}
}
// Format data to string
function dateToStr(datetime) {
	var year = datetime.getFullYear(),
		month = datetime.getMonth() + 1,
		date = datetime.getDate(),
		hour = datetime.getHours(),
		minutes = datetime.getMinutes(),
		second = datetime.getSeconds();
	if (month < 10) {
		month = "0" + month;
	}
	if (date < 10) {
		date = "0" + date;
	}
	if (hour < 10) {
		hour = "0" + hour;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (second < 10) {
		second = "0" + second;
	}
	return (year + "-" + month + "-" + date + " " + hour + ":" + minutes + ":" + second);
}