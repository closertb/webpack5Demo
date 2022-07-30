const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { resolve } = require;

const entry = {
  index: './src/index.jsx',
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
    // publicPath: './',
  },
  plugins: [new HtmlWebpackPlugin({
    filename: 'index.html',
    template: require.resolve('./index.ejs'),
    inject: false,
    // publicPath: './',
  })],
  resolve: {
    extensions: ['.tsx', '.jsx', '.js'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'antd': 'antd',
    '@ant-design/icons': 'icons',
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
