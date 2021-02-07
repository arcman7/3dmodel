 const path = require('path');
 
 module.exports = {
  entry: './mdx/index.js',
    output: {
        filename: 'mdx_bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
        globalObject: 'this',
        library: 'mdx_bundle',
    },
 };