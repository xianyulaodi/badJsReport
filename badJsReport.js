/**
 * Name:    badJsReport.js
 * Version  1.1.0
 * Author   xiangyulaodi
 * Address: https://github.com/xianyulaodi/badJsReport
 * Released on: December 22, 2016
 */

;(function(){

    'use strict';

    if (window.badJsReport){ 

       return window.badJsReport 
    };

    /*
    *  默认上报的错误信息
    */ 
    var defaults = {
        msg:'',  //错误的具体信息
        url:'',  //错误所在的url
        line:'', //错误所在的行
        col:'',  //错误所在的列
        error:'', //具体的error对象
    };

    /*
    *ajax封装
    */
    function ajax(options) {
        options = options || {};
        options.type = (options.type || "GET").toUpperCase();
        options.dataType = options.dataType || "json";
        var params = formatParams(options.data);

        if (window.XMLHttpRequest) {
           var xhr = new XMLHttpRequest();
        } else { 
           var xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }

        xhr.onreadystatechange = function () {
           if (xhr.readyState == 4) {
               var status = xhr.status;
               if (status >= 200 && status < 300) {
                   options.success && options.success(xhr.responseText, xhr.responseXML);
               } else {
                   options.fail && options.fail(status);
               }
           }
        }

        if (options.type == "GET") {
           xhr.open("GET", options.url + "?" + params, true);
           xhr.send(null);
        } else if (options.type == "POST") {
           xhr.open("POST", options.url, true);
           //设置表单提交时的内容类型
           xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
           xhr.send(params);
        }
    }

    /*
    *格式化参数
    */
    function formatParams(data) {
       var arr = [];
       for (var name in data) {
           arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
       }
       arr.push(("v=" + Math.random()).replace(".",""));
       return arr.join("&");
    }


    /*
    * 合并对象，将配置的参数也一并上报
    */
    function cloneObj(oldObj) { //复制对象方法
      if (typeof(oldObj) != 'object') return oldObj;
      if (oldObj == null) return oldObj;
      var newObj = new Object();
      for (var prop in oldObj)
        newObj[prop] = oldObj[prop];
      return newObj;
    };

    function extendObj() { //扩展对象
      var args = arguments;
      if (args.length < 2) {return;}
      var temp = cloneObj(args[0]); //调用复制对象方法
      for (var n = 1,len=args.length; n <len; n++){
        for (var index in args[n]) {
          temp[index] = args[n][index];
        }
      }
      return temp;
    }

   /**
   * 核心代码区
   **/
   var badJsReport=function(params){

      if(!params.url){return}
      window.onerror = function(msg,url,line,col,error){

          //采用异步的方式,避免阻塞
          setTimeout(function(){

              //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
              col = col || (window.event && window.event.errorCharacter) || 0;

              defaults.url = url;
              defaults.line = line;
              defaults.col =  col;

              if (error && error.stack){
                  //如果浏览器有堆栈信息，直接使用
                  defaults.msg = error.stack.toString();

              }else if (arguments.callee){
                  //尝试通过callee拿堆栈信息
                  var ext = [];
                  var fn = arguments.callee.caller;
                  var floor = 3;  //这里只拿三层堆栈信息
                  while (fn && (--floor>0)) {
                     ext.push(fn.toString());
                     if (fn  === fn.caller) {
                          break;//如果有环
                     }
                     fn = fn.caller;
                  }
                  defaults.msg = ext.join(",");
                }
                // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                var reportData=extendObj(params.data || {},defaults);
                
                // 把错误信息发送给后台
                ajax({
                    url: params.url,      //请求地址
                    type: "POST",         //请求方式
                    data: reportData,     //请求参数
                    dataType: "json",
                    success: function (response, xml) {
                        // 此处放成功后执行的代码
                      params.successCallBack&&params.successCallBack(response, xml);
                    },
                    fail: function (status) {
                        // 此处放失败后执行的代码
                      params.failCallBack&&params.failCallBack(status);
                    }
                 });

          },0);

          return true;   //错误不会console浏览器上,如需要，可将这样注释
      };

  }
    
  window.badJsReport=badJsReport;

})();

/*===========================
badJsReport AMD Export
===========================*/
if (typeof(module) !== 'undefined'){
    module.exports = window.badJsReport;
}
else if (typeof define === 'function' && define.amd) {
    define([], function () {
        'use strict';
        return window.badJsReport;
    });
}
