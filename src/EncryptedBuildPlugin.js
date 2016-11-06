'use strict';
const path = require('path');

const debug = require('debug');
// const _ = require('lodash');
const ConcatSource = require('webpack-core/lib/ConcatSource');
const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');
const Promise = require('bluebird');

const TemplatePlugin = require('./TemplatePlugin');


const log = debug('EncryptedBuildPlugin');


const browserComponent_name = 'EncryptedBuildPlugin_browserComponent'


const EcryptedBuildPlugin = function (options) {
  this._encryptionKey = options.encryptionKey;
  if (!this._encryptionKey) {
    throw new Error('Must provide an encryptionKey');
  }
  log('encryptionKey= ' + this._encryptionKey);
};


EcryptedBuildPlugin.prototype.apply = function (compiler) {
  let browserComponentCodePromiseResolve;
  const browserComponentCodePromise = new Promise((resolve, reject) => {
    browserComponentCodePromiseResolve = resolve;
  });

  const wrapFile = (compilation, fileName) => {
    return new Promise ((resolve, reject) => {
      log('Encrpyting file: ' + fileName);

      const concatSource = compilation.assets[fileName];
      const origSource = concatSource.source();
      // log('> origSource= ' + origSource);

      if (fileName === browserComponent_name + '.js') {
        browserComponentCodePromiseResolve(origSource)
        resolve();
        return;
      } else {
        browserComponentCodePromise.then((browserComponentCode) => {
          compilation.assets[fileName] = new ConcatSource(
            '(function () {' +
            '\n\n' +
            browserComponentCode +
            '\n\n' +
            origSource +
            '})();'
          );

          log('> output= ' + compilation.assets[fileName].source());

          resolve();
        });
      }
    });
  };

  const wrapChunks = (compilation, chunks) => {
    return Promise.map(chunks, (chunk) => {
      return Promise.map(chunk.files, (fileName) => {
        return wrapFile(compilation, fileName);
      }, { concurrency: 1 });
    }, { concurrency: 1 });
  };

  compiler.plugin('make', (compilation, callback) => {
    const dep = new SingleEntryDependency('./browserComponent.js');
    dep.loc = browserComponent_name;
    compilation.addEntry(
      path.resolve(__dirname),
      dep,
      dep.loc,
      callback
    );
  });

  compiler.plugin('compilation', (compilation, params) => {
    const normalModuleFactory = params.normalModuleFactory;
    compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);

    compilation.moduleTemplate.apply(
      new TemplatePlugin(compilation, this._encryptionKey)
    );

    compilation.plugin('optimize-chunk-assets', (chunks, done) => {
      wrapChunks(compilation, chunks).then(() => {
        done();
      });
    })
  });
};


module.exports = EcryptedBuildPlugin;
