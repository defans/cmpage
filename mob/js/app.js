(function ($, owner) {
	/**
	 * md5加密
	 **/
	owner.isDebug = function () {
		//调试模式
		//return true;
		return false;
	}
	owner.debug = function (msg) {
		if (owner.isDebug()) {
			console.log(typeof (msg) === 'object' ? JSON.stringify(msg) : msg);
		}
	}

	/**
	 * md5加密
	 **/
	owner.md5 = function (value) {
		return hex_md5(value);
	}

	/**
	 * 获取domain
	 **/
	owner.getDomain = function () {
		return owner.isDebug() ? "http://10.9.39.64:8300" : "http://118.190.105.50:8300";
	}

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function (settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function () {
		var settingsText = localStorage.getItem('$settings') || "{}";
		var settings = JSON.parse(settingsText);
		settings.autoLogin = settings.autoLogin || false;
		return settings;
	}

	/**
	 * 消息提示
	 **/
	owner.toast = function (value) {
		plus.nativeUI.toast(value);
	}


	/**
	 * 百度定位
	 **/
	owner.getPosBaidu = function (callback) {
		//console.log('getPosBaidu: '+owner.getNowFormatDate());
		plus.geolocation.getCurrentPosition(function (position) {
			var codns = position.coords; //获取地理坐标信息；
			//console.log(JSON.stringify(position.coords));
			callback(codns.latitude, codns.longitude);
		}, function (e) {
			callback(0, 0);
			outSet("获取百度定位位置信息失败：" + e.message);
		}, {
			provider: 'baidu'
		});
	}


	/**
	 * 获取日期
	 **/
	owner.getDate = function () {
		var d = new Date();
		var year = d.getFullYear();
		var month = d.getMonth() + 1;
		var date = d.getDate();
		if (month < 10) {
			month = "0" + month;
		}
		if (date < 10) {
			date = "0" + date;
		}
		return year + month + date;
	}

	/**
	 * 获取星期
	 **/
	owner.getWeek = function () {
		var d = new Date();
		return d.getDay();
	}

	/**
	 * 获取时间
	 **/
	owner.getTime = function () {
		var d = new Date();
		var hour = d.getHours();
		var minutes = d.getMinutes();
		var date = d.getDate();
		if (hour < 10) {
			hour = "0" + hour;
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		return hour + ":" + minutes;
	}

	/**
	 * 获取时间
	 **/
	owner.getNowFormatDate = function () {
		var date = new Date();    
		var seperator1 = "-";    
		var seperator2 = ":";    
		var month = date.getMonth() + 1;    
		var strDate = date.getDate();    
		if (month >= 1 && month <= 9) {        
			month = "0" + month;    
		}    
		if (strDate >= 0 && strDate <= 9) {        
			strDate = "0" + strDate;    
		}    
		var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate             + " " + date.getHours() + seperator2 + date.getMinutes()             + seperator2 + date.getSeconds();    
		return currentdate;
	}

	/**
	 * 取两个整数间的随机整数
	 * @method  getRandomNum
	 * @return  {int}  随机整数
	 * @param   {int} Min 最小整数
	 * @param   {int} Max 最大整数
	 */
	owner.getRandomNum = function (Min, Max) {
		if (Max <= Min) {
			return Min;
		}
		var Range = Max - Min;
		var Rand = Math.random();
		return (Min + Math.round(Rand * Range));
	}

	//表单序列化
	owner.serialize = function (form) {
		var obj = owner.serializeToOjb(form);
		var arr = [];
		for (var p in obj) {
			arr.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
		return arr.join('&');
	}
	//表单转成JSON对象
	owner.serializeToOjb = function (form) {
		var parts = [],
			field = null,
			i,
			len,
			j,
			optLen,
			option,
			optValue;
		var obj = {};

		for (i = 0, len = form.elements.length; i < len; i++) {
			field = form.elements[i];

			switch (field.type) {
				case "select-one":
				case "select-multiple":

					if (field.name.length) {
						for (j = 0, optLen = field.options.length; j < optLen; j++) {
							option = field.options[j];
							if (option.selected) {
								optValue = "";
								if (option.hasAttribute) {
									optValue = (option.hasAttribute("value") ? option.value : option.text);
								} else {
									optValue = (option.attributes["value"].specified ? option.value : option.text);
								}
								//parts.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(optValue));
								obj[field.name] = optValue;
							}
						}
					}
					break;

				case undefined:
					//字段集
				case "file":
					//文件输入
				case "submit":
					//提交按钮
				case "reset":
					//重置按钮
				case "button":
					//普通按钮
					if (field.name.length) {
						obj[field.name] = field.innerHTML;
					}
					break;

				case "radio":
					//单选按钮
				case "checkbox":
					//复选框
					if (!field.checked) {
						break;
					}
					/* 执行默认曹旭哦 */

				default:
					//不包含没有名字的表单字段
					if (field.name.length) {
						//parts.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
						obj[field.name] = field.value;
					}
			}
		}
		return obj;
	}

}(mui, window.app = {}));