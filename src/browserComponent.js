var AES = require('crypto-js/aes');
var encoding = require('crypto-js/enc-utf8');

var init = function () {
  if (window.EncryptedBuildPlugin) {
    console.warn('Already initialized');
    return;
  }

  window.EncryptedBuildPlugin = {
    encryptionKey: null,

    decrypt: function (s) {
      if (!window.EncryptedBuildPlugin.encryptionKey) {
        window.EncryptedBuildPlugin.promptForKey();
      }
      try {
        var bytes  = AES.decrypt(
          s.toString(),
          window.EncryptedBuildPlugin.encryptionKey
        );
        return bytes.toString(encoding);
      } catch (err) {
        var doReload = window.confirm(
          'Decryption failed!' +
          '\n\tTo fix this, refresh the page, then enter the correct password.' +
          '\n\nWould you like to reload now?'
        );
        if (doReload) {
          window.location.reload();
        } else {
          throw err;
        }
      }
    },

    promptForKey: function () {
      var answer = prompt('Please enter the EncryptedBuildPlugin password', '');
      window.EncryptedBuildPlugin.encryptionKey = answer;
    }
  };
};

init();
