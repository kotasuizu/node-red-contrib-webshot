/**
 * Copyright (c) 2018 Kota Suizu
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 **/

module.exports = function(RED) {
  "use strict";
  var webshot = require('webshot');
  var exec = require('child_process').exec;
  var cl = "fc-cache -fs";

  // WebShot-Node NodeIO処理
  function WebShot(n) {
    RED.nodes.createNode(this, n);
    this.url = n.url;

    var node = this;
    this.on('input', function(msg) {

      if (_isTypeOf('String', msg.payload.url)) {
        node.url = msg.payload.url;
      }

      var options = {}; // サイトを参考に色々設定
      if (_isTypeOf('Object', msg.payload.options)) {
        options = msg.payload.options;
      }

      exec(cl, {
        encoding: 'binary',
        maxBuffer: 10000000
      }, function(error, stdout, stderr) {

        webshot(node.url, options, function(err, renderStream) {
          var chunks = new Array();
          renderStream.on('data', function(data) {
            chunks.push(new Buffer(data));
          });
          renderStream.on('error', function(e) {
            console.log(e);
            node.error("Failed to WebShot.", e);
          });
          renderStream.on('end', function() {
            var data = Buffer.concat(chunks);
            // この時点でdataにスクリーンショットの画像データがバイナリで入ってる
            msg.payload = data.toString('base64');
            node.send(msg);
            node.log(RED._('Succeeded to WebShot.'));
          });
        });

      });
    });
  }
  RED.nodes.registerType("WebShot", WebShot);

  /**
   * Object type comparison
   *    String
   *    Number
   *    Boolean
   *    Date
   *    Error
   *    Array
   *    Function
   *    RegExp
   *    Object
   **/
  function _isTypeOf(type, obj) {
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
  }
}
