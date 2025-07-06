const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/'
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/contexts': path.resolve(__dirname, 'src/contexts')
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html'
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public')
      },
      port: 3001,
      hot: true,
      open: false,
      historyApiFallback: true,
      server: {
        type: 'https',
        options: {
          key: fs.readFileSync('C:\\Users\\david\\.office-addin-dev-certs\\localhost.key'),
          cert: fs.readFileSync('C:\\Users\\david\\.office-addin-dev-certs\\localhost.crt'),
          ca: fs.readFileSync('C:\\Users\\david\\.office-addin-dev-certs\\ca.crt')
        }
      },
      allowedHosts: 'all',
      client: {
        overlay: {
          errors: true,
          warnings: false
        },
        webSocketURL: {
          hostname: 'localhost',
          pathname: '/ws',
          port: 3001,
          protocol: 'wss'
        }
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          // Split large libraries into separate chunks
          fluentui: {
            test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
            name: 'fluentui',
            chunks: 'all',
            priority: 10
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 10
          }
        }
      },
      // Enable tree shaking and minification
      usedExports: true,
      sideEffects: false
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};
