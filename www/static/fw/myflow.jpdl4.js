(function($){
var myflow = $.myflow;

$.extend(true,myflow.config.rect,{
	attr : {
	r : 8,
	fill : '#F6F7FF',
	stroke : '#03689A',
	"stroke-width" : 2
},margin:0
});

$.extend(true,myflow.config.tools.states,{
			start : {
				showType: 'image',
				type : 'start',
				name : {text:'<<start>>'},
				text : {text:'开始'},
				img : {src : '/static/fw/img/48/start_event_empty.png',width : 48, height:48},
				attr : {width:50 ,heigth:50 }
			},
			end : {showType: 'image',type : 'end',
				name : {text:'<<end>>'},
				text : {text:'结束'},
				img : {src : '/static/fw/img/48/end_event_terminate.png',width : 48, height:48},
				attr : {width:50 ,heigth:50 }
			},
			'end-cancel' : {showType: 'image',type : 'end-cancel',
				name : {text:'<<end-cancel>>'},
				text : {text:'取消'},
				img : {src : '/static/fw/img/48/end_event_cancel.png',width : 48, height:48},
				attr : {width:50 ,heigth:50 }
			},
			'end-error' : {showType: 'image',type : 'end-error',
				name : {text:'<<end-error>>'},
				text : {text:'错误'},
				img : {src : '/static/fw/img/48/end_event_error.png',width : 48, height:48},
				attr : {width:50 ,heigth:50 }
			},
			state : {showType: 'text',type : 'state',
				name : {text:'<<state>>'},
				text : {text:'状态'},
				img : {src : '/static/fw/img/48/task_empty.png',width : 48, height:48}
			},
			fork : {showType: 'image',type : 'fork',
				name : {text:'<<fork>>'},
				text : {text:'分支'},
				img : {src : '/static/fw/img/48/gateway_parallel.png',width :48, height:48},
				attr : {width:50 ,heigth:50 }
			},
			join : {showType: 'image',type : 'join',
				name : {text:'<<join>>'},
				text : {text:'合并'},
				img : {src : '/static/fw/img/48/gateway_parallel.png',width :48, height:48},
				attr : {width:50 ,heigth:50 }
			},
			task : {showType: 'text',type : 'task',
				name : {text:'<<task>>'},
				text : {text:'任务'},
				img : {src : '/static/fw/img/48/task_empty.png',width :48, height:48}
			},
			decision : {showType: 'image',type : 'decision',
                name : {text:'<<decision>>'},
                text : {text:'决定'},
                img : {src : '/static/fw/img/48/gateway_parallel.png',width :48, height:48},
                attr : {width:50 ,heigth:50 }
			}
});
})(jQuery);