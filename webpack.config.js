const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { resolve } = require;

const entry = {
  index: './src/index.jsx',
};

module.exports = {
  entry,
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    port: 8090,
    hot: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [new HtmlWebpackPlugin({
    filename: 'index.html',
    template: require.resolve('./index.ejs'),
  })],
  resolve: {
    extensions: ['.jsx', '.js'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    '@ant-design/icons': 'icons',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
            plugins: [
              resolve('@babel/plugin-proposal-object-rest-spread'),
              [
                  resolve('@babel/plugin-proposal-decorators'),
                  {
                      legacy: true,
                  },
              ],
              resolve('@babel/plugin-transform-runtime'),
              resolve('@babel/plugin-proposal-class-properties'),
              resolve('@babel/plugin-proposal-function-bind'),
              resolve('@babel/plugin-proposal-export-default-from'),
              resolve('@babel/plugin-proposal-export-namespace-from'),
              resolve('@babel/plugin-syntax-dynamic-import'),
            ],
          },
        },
      },
    ],
  }
};
