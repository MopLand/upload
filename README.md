# Upload

> 使用原生的 form 和 iframe 处理上传文件

- 支持文件数量限制
- 使用 accept，支持前端文件类型验证
- 使用 readonly，支持文件只读模式
- 使用 formdata，支持附加扩展数据

## 使用方法

### HTML

#### 基本格式

	<input type="file" name="key" />

#### 带参数配置

	<input type="file" name="key" value="" config='{ "model" : "pics", "multi" : 5 }' accept="image/*" />

#### 内置以下参数

	# 显示模式
	model			list | pics

	# 指定上传域名名称，否则将使用随机名称
	alias			[string]

	# 同时支持任意其他参数，会一同存储在 config 中，提交到服务端

### JavaScript

#### 依赖 Ray.js

	<script type="text/javascript" src="//public.zhfile.com/js/ray.js"></script>
	<script type="text/javascript" src="//public.zhfile.com/js/pack.upload.js"></script>
	<script type="text/javascript" src="//public.zhfile.com/js/pack.hybrid.css"></script>

#### 基本示例

	Upload.init( '[type=file]', { 
		'upload': 'upload.php?execute=upload', 
		'delete': 'upload.php?execute=delete', 
		'class' : 'upload'
	}, {
	
		//出错时回调
		error : function( name, code, msg ){
			R.toast( 'invalid', msg, {'time': 3, 'unique': 'toast'});
		},

		//通过时回调
		valid : function( name, file, size, image ){
			R.toast( 'success', '文件上传完成', {'time': 1, 'unique': 'toast'});
		}
	
	});

## 上传接口

### 接收参数

	config			来自 config 属性
	[files]			上传文件流
	[formdata]		其他来自 formdata 的数据

### 响应类型
	Content-Type:text/html

### 上传完成

	{"return":0,"file":"./upload/example.png","name":"example.png","type":"image\/png","size":293001}

### 上传错误

	{"return":-1000,"result":"文件类型不支持"}

## 删除处理

### 接收参数

	file			文件地址
	[formdata]		其他来自 formdata 的数据

### 响应类型
	Content-Type:application/json

### 上传完成

	{"return":0,"file":"./upload/example.png"}

### 上传错误

	{"return":-2000,"result":"文件不存在"}

## 高级选项

### 上传时附加更多的数据

	Upload.init( '[type=file]', { 
		'upload': 'upload.php?execute=upload', 
		'delete': 'upload.php?execute=delete', 
		'class' : 'upload', 
		'formdata' : { 
			'a' : 'b' ,
			'k' : 'v' 
		} 
	}

### 已上传文件显示预览效果

	<input type="file" name="key" value="" accept="image/*" value="./upload/example.png" />

### 文件只读操作，不可删除

	<input type="file" name="key" value="" accept="image/*" value="./upload/example.png" readonly />

### 支持多个文件上传

	<input type="file" name="key" value="" config='{ "multi" : 5 }' accept="image/*" />

### 使用指定的上传名称

	<input type="file" name="thumb" value="" config='{ "alias" : "avatar" }' accept="image/*" />

## 已知问题

1. 不支持跨域文件上传

## DOC 生成

	jsdoc pack.upload.js -d doc