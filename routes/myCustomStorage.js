// myCustomStorage.js
const {unlinkFile} = require('../models/database')
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

function getDestination(req, file, cb) {
  cb(null, '/dev/null');  // You can set the default destination if needed
}

function MyCustomStorage(opts) {
  if (typeof opts.destination === 'string') {
    this.getDestination = function (req, file, cb) {
      const dest = opts.destination;
      cb(null, dest);
    };
  } else if (typeof opts.destination === 'function') {
    this.getDestination = opts.destination;
  } else {
    this.getDestination = getDestination;
  }
}

MyCustomStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const self = this;
  self.getDestination(req, file, function (err, dest) {
    if (err) return cb(err);

    const finalPath = path.join(dest, file.originalname); // Ensure a file path

    const outStream = fs.createWriteStream(finalPath);

    file.stream.pipe(outStream);
    outStream.on('error', function (err) {
      cb(err);
    });
    outStream.on('finish', function () {
      const dimensions = sizeOf(finalPath);

      cb(null, {
        path: finalPath,
        size: outStream.bytesWritten,
        width: dimensions.width,
        height: dimensions.height,
      });
    });
  });
};

MyCustomStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  // Ensure that the file path is present before attempting to unlink
 
  if (file.path) {
    unlinkFile(file.path, cb);
  } else {
    cb(null); // File already removed or never existed
  }
};

MyCustomStorage.prototype.onFileUploadComplete = function onFileUploadComplete(file) {
  // Trigger manual removal of the temporary file after upload is complete
  this._removeFile(null, file, function(err) {
    // if (err) {
    //   c onsole.error('Error removing file:', err);
    // } else {
    //   c onsole.log('File removed successfully:', file.path);
    // }
  });
};

module.exports = function (opts) {
  return new MyCustomStorage(opts);
};
