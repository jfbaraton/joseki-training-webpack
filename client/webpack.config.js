// webpack.config.js //
const HtmlWebPackPlugin = require("html-webpack-plugin")
const path = require('path')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')


module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: { loader: "babel-loader" }
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: { loader: "babel-loader" }
            },
            {
                test:  /\.html$/,
                use: { loader: "html-loader" }
            },
            {
                 test: /\.css$/,
                 use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
            {
                test: /\.(png|jpg|gif|jpeg|svg|sgf)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: './resources/imgs',
                            name: '[name].[ext]'
                        }
                    },
                ]
            },
            {
                test: /test\.js$/,
                use: 'mocha-loader',
                exclude: /node_modules/,
            }
        ],
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./public/index.html",
            filename: "./index.html"
        }),
        new HtmlWebPackPlugin({
            template: "./public/miniBoard.html",
            filename: "./miniBoard.html"
        }),
        new FaviconsWebpackPlugin('./public/favicon.ico') // svg works too!
    ],
    devServer: {
        proxy: [{
            context: ['/'],
            target: 'http://localhost:8090',
          }]
    }
}
