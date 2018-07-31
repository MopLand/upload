<?php
	
ini_set("display_errors", 0);

//var_dump( $_POST );
//var_dump( $_FILES );

$basedir = './upload/';

//////////////

/*
	得到文件扩展名
	$file	文件名
*/
function fileext( $filename ) {
	return strtolower(addslashes(trim(substr(strrchr($filename, '.'), 1, 10))));
}

/*
	打印JSON数据
	$data	数据集
*/
function jsonlog( $data, $ajax = NULL ) {
	$json = json_encode( $data );
	exit( $ajax ? $ajax . '('. $json .')' : $json );
}

/**
 * 随机指定长度字符串
 * @param type $length 长度
 * @return type
 */
function random($length = 4) {
	$string = 'abcdefghijkmnpqrstwxyz23456789';
	return substr(str_shuffle($string), 0, $length);
}

//////////////
			
//当前配置
$config = json_decode( stripslashes( $_POST['config'] ), true );

$filed = $config['field'];

$file = $_FILES[ $filed ]; 
$ajax = $_REQUEST['ajax']; 

if ( empty( $file ) ){

	jsonlog( array( 'return' => -2001, 'result' => $file["error"] ), $ajax );

}

if ( $file["error"] > 0 ){

	jsonlog( array( 'return' => ( -1000 - $file["error"] ), 'result' => $file["error"] ), $ajax );

}else{
 
	$allow_mime = array('image/gif', 'image/jpg', 'image/jpeg', 'image/pjpeg', 'image/png'); 
	$allow_type = array('gif', 'jpg', 'jpeg', 'png');
	
	$mime = $file["type"];
	$type = fileext( $file["name"] );
	
	//////////////
	
	//检查流类型
	if( !in_array( $mime, $allow_mime ) ){
		jsonlog( array( 'return' => 'mime', 'message' => $mime ) );
	}
	
	//检查扩展名
	if( !in_array( $type, $allow_type ) ){
		jsonlog( array( 'return' => 'type', 'message' => $type ) );
	}
	
	//////////////
	
	//图片原信息
	list( $param['width'], $param['height'] ) = getimagesize( $file['tmp_name'] );
	
	//添加标识符
	$mark = $param ? $param['width'] . '-' . $param['height'] : mt_rand();
	
	//新文件名称
	$name = $basedir . random(10) .'-'. $mark . '.' . $type;
	
	//////////////
	
	//移动文件
	if( move_uploaded_file( $file["tmp_name"], $name ) ){
		jsonlog( array( 'return' => 0, 'file' => $name, 'name' => $file["name"], 'type' => $file["type"], 'size' => $file["size"] ), $ajax );
	}else{
		jsonlog( array( 'return' => -9000, 'result' => '' ), $ajax );
	}
	
}