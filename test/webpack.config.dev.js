
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: path.join(__dirname, './test.js'),
  mode: 'development',
  output: {
      filename: 'bundle.js',
      path: path.join(__dirname, './'),
  },
  devServer: {
    contentBase: __dirname,
    historyApiFallback: true,
    inline: true,
    publicPath: "/",
    host: '0.0.0.0',
    port: 9093
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './index.html'),
    })
  ]
}