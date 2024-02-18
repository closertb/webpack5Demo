const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const ChunkOptimazitionPlugin = require('./plugin/split-helper').default;
const TerserPlugin = require('terser-webpack-plugin');

const entry = {
  index: './src/index.jsx',
  example:  './src/example.jsx',
};


module.exports = {
  entry,
  mode: process.env.NODE_ENV || 'development',
  devtool: 'cheap-source-map',
  devServer: {
    port: 8090,
    hot: true,
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    pathinfo: false,
    filename: '[name].js',
    libraryTarget: 'system',
    publicPath: '//localhost:8090/',
  },
  plugins: [new HtmlWebpackPlugin({
    title: 'index',
    filename: 'index.html',
    template: require.resolve('./index.ejs'),
    chunks: ['index.js'],
    inject: false,
    // publicPath: './',
  }), new HtmlWebpackPlugin({
    title: 'example',
    filename: 'example.html',
    template: require.resolve('./index.ejs'),
    chunks: ['example.js'],
    inject: false,
  // adjust systemJS split chunk,
  }), new ChunkOptimazitionPlugin({
    cacheGroups: {
      jsonpFunction: 'demoJSonp',
      // 去掉默认配置, 否则除了vendors，还会将node_modules其他复用的模块打一个包；
      default: false,
      fasterBuild: true,
      vendors: {
          // cacheGroups重写继承配置，设为false不继承
          test: /[\\/]node_modules[\\/]_?(react-router|react-router-dom|antd)[@,\\/]/,
          name: 'vendors',
          minChunks: 1,
          priority: -20,
      },
  },
  })],
  resolve: {
    extensions: ['.tsx', '.jsx', '.js'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    // 'antd': 'antd',
    // '@ant-design/icons': 'icons',
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          }
        }
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
            // plugins: [
            //   resolve('@babel/plugin-proposal-object-rest-spread'),
            //   [
            //       resolve('@babel/plugin-proposal-decorators'),
            //       {
            //           legacy: true,
            //       },
            //   ],
            //   resolve('@babel/plugin-transform-runtime'),
            //   resolve('@babel/plugin-proposal-class-properties'),
            //   resolve('@babel/plugin-proposal-function-bind'),
            //   resolve('@babel/plugin-proposal-export-default-from'),
            //   resolve('@babel/plugin-proposal-export-namespace-from'),
            //   resolve('@babel/plugin-syntax-dynamic-import'),
            // ],
          },
        },
      },
    ],
  }
};
