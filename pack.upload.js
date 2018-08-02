/*!
 * @name Upload
 * @class 文件上传组件，支持多文件，多视图显示
 * @date: 2018/08/02
 * @see http://www.veryide.com/projects/upload/
 * @author Lay
 * @copyright VeryIDE
 * @constructor
 */

/**
* @desc  扩展非 IE 浏览器的 replaceNode 和 swapNode
*/
if(window.Node){
	Node.prototype.replaceNode = function(node){
		return this.parentNode.replaceChild( node, this );
	}
	Node.prototype.swapNode = function(node){
		var parent = node.parentNode;
		var sibling = node.nextSibling;
		var self = this.parentNode.replaceChild( node, this );
		sibling ? parent.insertBefore( self, sibling ) : parent.appendChild( self );
		return this;
	}
}

var Upload = {

	/**
	* @desc  上传状态值
	*/
	status : {
		'-1000' : '没有文件上传权限',
		'-1001' : '上传的文件大小超过了服务器限制',
		'-1002' : '上传文件的大小超过了表单中 MAX_FILE_SIZE 指定的值',
		'-1003' : '文件只有部分被上传，可能为损坏文件',
		'-1004' : '没有文件被上传，无效或空的文件',
		'-1005' : '上传的文件是空的（大小为 0）',
		'-1006' : '找不到临时文件夹，服务器端',
		'-1007' : '文件写入失败，可能是没有权限'
	},

	/**
	* @desc  合并数组，相同的键为替换，不同的键为新增
	* @param {Object} array1 数组1
	* @param {Object} array2 数组2
	* @param {Object} arrayN 数组N
	* @return {Object} 合并后的数组
	* @example
	* Upload.merge( { quality : 80, output : 'png' }, { unit : '%', output : 'jpg' } );
	*/
	merge : function() {
		var obj = {}, i = 0, il = arguments.length, key;
		for (; i < il; i++) {
			for (key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					obj[key] = arguments[i][key];
				}
			}
		}
		return obj;
	},

	/**
	* @desc  获取文件扩展名
	* @param {String} file 文件名称或路径地址
	* @return {String} 扩展名
	* @example
	* Upload.extra('hello.png');
	*/
	extra : function( file ){
		return file.split('.').pop();
	},

	/**
	* @desc  获取文件的名称，省略路径
	* @param {String} file 文件名称或路径地址
	* @return {String} 文件名
	* @example
	* Upload.name('c://windows/hello.png');
	*/
	name : function( file ){
		return file.replace(/^.*[\\\/]/, '');
	},

	/**
	* @desc  打印全局（window）错误信息
	* @param {String}  str	   输入字符串
	* @param {String}  replace      替换字符串
	* @param {String}  start       参考 PHP 同名函数
	* @param {Number}    length      参考 PHP 同名函数
	*/
	substr_replace : function (str, replace, start, length) {
		if (start < 0) { // start position in str
			start = start + str.length;
		}
		length = length !== undefined ? length : str.length;
		if (length < 0) {
			length = length + str.length - start;
		}
		return str.slice(0, start) + replace.substr(0, length) + replace.slice(length) + str.slice(start + length);
	},

	/*
	* @desc	根据当前文件得到缩略图地址
	* @param {String} file	源文件
	* @param {String|Array} size	尺寸
	*/
	thumb : function ( file, size ){
		size = ( size instanceof Array ) ? size[0] + 'x' + size[1] : 'thumb';
		return file ? Upload.substr_replace( file, '!'+ size +'.', file.lastIndexOf('.'), 1 ) : '';
	},

	/*
	* @desc	添加到文件列表
	* @param {String} list	文件列表，以 || 分隔
	* @param {String} file	目标文件
	*/
	append : function( list, file ){
		return ( list ? list + '||' + file : file );
	},

	/*
	* @desc	从文件列表删除
	* @param {String} list	源文件，以 || 分隔
	* @param {String} file	目标文件
	*/
	remove : function( list, file ){
		var objs = list.split('||');
		for( var i in objs ){
			if( objs[i] == file ){
				objs.splice( i, 1 );
			}
		}
		return objs.join('||');
	},

	/*
	* @desc	从文件列表删除
	* @param {String} list	源文件，以 || 分隔
	* @param {String} file	目标文件
	*/
	unset : function( node ){

		if( typeof node == 'string' ){
			node = document.querySelector( node );
		}

		node && node.parentNode.removeChild( node );

	},

	////////////////////////////////

	//数据对象
	field : new Object(),

	//调试模式
	debug : false,

	//全局配置
	params : { 'upload' : '', 'delete' : '', 'class' : '', formdata : {} },

	//回调事件
	events : {
		//通过时回调
		'valid' : function( name, file, size, image ){
			console.log( name, file, size, image );
		},
		
		//出错时回调
		'error' : function( name, code, msg ){
			console.log( name, code, msg );
		},
		
		//完成时回调
		'complete' : function( name, raw, node ){
			console.log( name, raw );		
		}
	},

	//上传配置
	option : { 'multi' : 1, 'model' : 'list' },

	/**
	* @desc  初始化上传组件
	* @param {String} selector 文件域选择器
	* @param {String} params 附加参数
	* @param {String} events 事件处理
	* @example
	* Upload.init( 'input[type=file]' );
	*/
	init : function( selector, params, events ){

		//上传参数
		if( params ) Upload.params = Upload.merge( Upload.params, params );

		//回调函数
		if( events ) Upload.events = Upload.merge( Upload.events, events );

		////////////////

		var ipt = document.querySelectorAll( selector ? selector : '[type=file]');
		var ele;

		for( var i = 0; i < ipt.length; i++ ){
			ele = ipt[i];
			Upload.bind( ele, ele.getAttribute('value'), ele.getAttribute('accept'), ( ele.getAttribute('config') ? JSON.parse( ele.getAttribute('config') ) : {} ) );
		}

	},

	/**
	* @desc  绑定文件选择框事件
	* @param {Input} 文件域对象
	* @param {String} 默认值
	* @param {String} 文件类型
	* @param {Array} 配置项
	*/
	bind : function( file, value, accept, config ){

		/*
		Config:

		//文件是否存放远程服务器
		remote			(true|false)

		//是否始终返回绝对地址
		absolute		(true|false)

		//裁切尺寸（切图）
		crop			宽度*高度

		//自动缩略图，尺寸
		thumb			宽度*高度

		//组图尺寸，可以生成多张图片
		group			宽度*高度

		//是否打水印
		watermark		(true|false)

		//短地址显示文件名
		shortname	(true|false)

		//水印位置
		position		数值

		//原图是水印图尺寸的几倍时打上水印
		multiple		数值
		*/

		//////////////////////////////

		//随机命名
		var idx = 'file' + Math.random().toString(16).substring(2);

		//默认配置
		if( config ){
			config = Upload.merge( Upload.option, config );
		}else{
			config = Upload.option;
		}

		//新增记录
		Upload.field[idx] = { 'name' : file.name, 'value' : [], 'config' : config, 'object' : file, 'accept' : ( accept ? accept : '*' ) };

		/////////////////////////
		
		//移除属性
		file.removeAttribute('config');
		file.setAttribute('data-file-view',idx);
		
		//非只读状态
		if( !file.hasAttribute('readonly') ){

			//上层元素
			var wrap = file.parentNode;

			//文件镜像
			var copy = file.cloneNode(true);
				copy.removeAttribute('name');
				copy.setAttribute('model', config.model);

			//放入表单
			wrap.insertBefore( copy, file );

			//移除验证属性
			var attr = ['data-valid-name','data-valid-empty','required'];
			for( var k in attr ){
				copy.hasAttribute( attr[k] ) && copy.removeAttribute( attr[k] );
			}

			/////////////////////////

			//绑定文件选中事件
			R( document ).live( 'change', 'input[data-file-view='+ idx +']', function(){
				Upload.change( this, idx );
			});

			/* 2017/06/19 by Lay
			copy.onchange = function(){
				Upload.change( this, idx );
			}
			*/
		
		}

		//图片列表
		file.insertAdjacentHTML('beforeBegin','<ul class="'+ Upload.params['class'] +'" model="'+ config.model +'" multi="'+ config.multi +'" data-file-list="'+ idx +'"></ul>');

		/////////////////////////
	
		//隐藏原始元素
		file.type = 'hidden';
		file.value = '';
		file.setAttribute('data-file-text',idx);

		if( value ){
			var list = value.split('\|\|');
			for( var i = 0; i < list.length; i++ ){
				Upload.attach( idx, list[i] );
			}
		}
		
		//更新组件状态
		Upload.update( idx );

	},

	////////////////////////////////

	/**
	* @desc  文件域变更事件
	* @param {Input} 文件域对象
	* @param {name} 文件域名称
	*/
	change : function( file, idx ){

		//读取配置
		var config = Upload.field[ idx ]['config'];
		var accept = Upload.field[ idx ]['accept'];
		var filext = Upload.extra( file.value );

		//有数量限制
		if( config.multi && document.querySelectorAll('[data-file-list=\''+ idx +'\'] li').length >= config.multi ){
			Upload.events.error( idx, -2002, '最大文件数量：' + config.multi );
			return;
		}

		//检查文件类型
		if( filext && accept ){

			//文件类型限制
			if( accept != '*' ){
				//image/* 或 image/jpg,image/gif 类似标准文件类型
				var rules = '^('+ accept.replace(/\s/ig,'').replace(/,/ig,'|').replace(/(\w+)\/(\w+)/ig,'$2').replace(/(\w+)\/\*/ig,'\\w+') +')$';
				var regex = new RegExp( rules, 'i' );
			}

			if( accept == '*' || regex.test( filext ) ){
				Upload.submit( file, idx );
			}else{
				Upload.events.error( config['name'], -2003, '不支持的文件类型：' + filext );
			}

		}

	},

	/**
	* @desc  文件域变更事件
	* @param {Input} 文件域对象
	* @param {String} 文件域名称
	*/
	submit : function( file, idx ){

		//读取配置
		var config = Upload.field[ idx ]['config'];
			config['field'] = idx;

		/////////////////////////

		var wind = document.createElement('iframe');
		wind.name		= idx + '_iframe';
		wind.width		= wind.height = '0';

		var form = document.createElement('form');
		form.target		= idx + '_iframe';
		form.method		= 'post';
		form.hidden		= 'hidden';
		form.enctype	= 'multipart/form-data';
		form.action		= Upload.params['upload'];

		var conf = document.createElement('input');
		conf.type = 'hidden';
		conf.name = 'config';
		conf.value = JSON.stringify( config );
		form.appendChild(conf);

		//表单数据
		for( var k in Upload.params.formdata )	{
			var exec = document.createElement('input');
				exec.type = 'hidden';
				exec.name = k;
				exec.value = Upload.params.formdata[k];
				form.appendChild(exec);
		}

		//文件镜像
		var copy = file.cloneNode(true);
		
		/* 2017/06/19 by Lay
			copy.onchange = function(){
				Upload.change( this, idx );
			}
		*/
		
		//指定名称
		file.name = idx;

		//放入表单
		form.appendChild( copy );

		//交换元素
		copy.swapNode( file );

		document.body.appendChild(wind);
		document.body.appendChild(form);

		//上传回调
		wind.onload = function(){
			Upload.parser( idx, this.contentWindow.document.body.innerHTML, copy );
		}

		//提交上传
		form.submit();

	},

	/**
	* @desc  追加到文件清单
	* @param {String} 文件域名称
	* @param {String} 新文件名称
	*/
	attach : function( idx, file ){

		//读取配置
		var config = Upload.field[ idx ]['config'];
		var object = Upload.field[ idx ]['object'];

		var id = Math.random().toString(16).substring(2);
		var li = document.createElement('li');
			li.setAttribute( 'data-file-node', id );

		//图片显示模式
		var ex = '';
		if( config.model == 'pics' ){
			if( config.multi > 1 ){
				li.style.backgroundImage = 'url('+ file +')';
			}else{
				ex = '<img src="'+ file +'" />';
			}
		}
		
		var at = '';
		if( config.attr ){
			for( var a in config.attr ){
				at += a + '="' + config.attr[ a ] + '"';
			}
		}
		
		li.innerHTML = '<var>'+ Upload.extra( file ) +'</var>'+
					( !object.hasAttribute('readonly') ? '<del onclick="Upload.delete( \''+ idx +'\', \''+ file +'\', \''+ id +'\' );">&times;</del>' : '' ) +
					'<a href="'+ file +'" target="_blank" ' + at + '><ins>'+ Upload.name( file ) +'</ins>'+ ex +'</a>';

		document.querySelector('[data-file-list='+ idx +']').appendChild( li );

		//将文件名添加至清单
		var obj = document.querySelector('[data-file-text='+ idx +']');

		obj.value = Upload.append( obj.value, file );

		//切换组件状态
		Upload.update( idx );

	},

	/**
	* @desc  从文件清单移除
	* @param {String} 文件域名称
	* @param {String} 文件名称
	* @param {String} 文件ID
	*/
	'delete' : function( idx, file, fileid ){

		Upload.unset( '[data-file-node=\''+ fileid +'\']' );

		//将文件名从清单移除
		var obj = document.querySelector('[data-file-text=\''+ idx +'\']');
		obj.value = Upload.remove( obj.value, file );

		//构造请求 URL
		var url = Upload.params['delete'];
			url+= ( Upload.params['delete'].indexOf('?') > -1 ? '&' : '?' ) + 'file=' + encodeURIComponent( file );
			url+= '&ajax=//';

		//附加 FormData 参数
		for( var k in Upload.params.formdata )	{
			url+='&'+ k + '=' + encodeURIComponent( Upload.params.formdata[k] );
		}

		//发送删除请求
		var obj = document.createElement('script');
			obj.type = 'text/javascript';
			obj.src = url;
			document.querySelector('head').appendChild(obj);

		//切换组件状态
		Upload.update( idx );

	},

	/**
	* @desc  更新组件状态
	* @param {String} 文件域名称
	*/
	update : function( idx ){

		var config = Upload.field[ idx ]['config'];
		var object = document.querySelectorAll('[data-file-list=\''+ idx +'\'],[data-file-view=\''+ idx +'\']');
		var status = 'unmet';

		//有数量限制
		if( document.querySelectorAll('[data-file-list=\''+ idx +'\'] li').length == config.multi ){
			status = 'full';
		}
	
		//设置为只读
		if( Upload.field[ idx ]['object'].hasAttribute('readonly') ){
			status = 'full';
		}

		for( var i = 0; i<object.length; i++ ){
			object[i].setAttribute('limit',status);
		}

	},

	/**
	* @desc  文件上传成功
	* @param {String} 文件域名称
	* @param {String} 上传结果
	* @param {Object} 文件域
	*/
	parser : function( idx, result, node ){
		
		var name = Upload.field[ idx ]['name'];
		
		try{
			
			var result = JSON.parse( result );
			
			if( result['return'] >= 0 ){

				Upload.attach( idx, result['file'] );
	
				//成功回调
				Upload.events.valid( name, result['file'], result['size'], result['image'] );
	
			}else{
	
				//错误回调
				Upload.events.error( name, result['return'], Upload.status[ result['return'] + '' ] );
	
			}
		
			//完成回调
			Upload.events.complete( name, node, result );
			
		}catch( e ){
			
			//处理异常
			Upload.events.error( name, e.number, result );
			
		}
	
		//移除元素
		Upload.unset( '[name=\''+ idx +'_iframe\']' );
		Upload.unset( '[target=\''+ idx +'_iframe\']' );

	}

}
