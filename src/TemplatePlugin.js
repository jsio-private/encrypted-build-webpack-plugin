'use strict';
const AES = require('crypto-js/aes');
const debug = require('debug');
const RawSource = require('webpack-core/lib/RawSource');


const log = debug('EncryptedBuildPlugin:TemplatePlugin');


const TemplatePlugin = function (compilation, encryptionKey) {
  this.compilation = compilation;
  this._encryptionKey = encryptionKey;
};


TemplatePlugin.prototype.encrypt = (s, key) => {
  return AES.encrypt(s, key);
};


TemplatePlugin.prototype.apply = function (moduleTemplate) {
  const self = this;

  moduleTemplate.plugin('module', function (source, module) {
    if(source.__EncryptPluginData) {
      return source.__EncryptPluginData;
    }

    // const util = require('util')
    // log('MODULE=', util.inspect(module))
    // log('SOURCE=', util.inspect(source))
    if (module.context && module.context.indexOf('encrypted-build-webpack-plugin') >= 0) {
      return source;
    }

    // log('> original= ' + source.source());

    source.__EncryptPluginData = new RawSource(
      'eval(window.EncryptedBuildPlugin.decrypt("' +
      self.encrypt(source.source(), self._encryptionKey) +
      '"));'
    );

    // log('> encrypted= ' + source.__EncryptPluginData.source());

    return source.__EncryptPluginData;
  });
};


module.exports = TemplatePlugin;
