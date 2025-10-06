const path = require('path');

module.exports = {
  mode: 'production',
  entry: './aiadvisor/js/bundle-entry.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'aiadvisor/dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  }
};
