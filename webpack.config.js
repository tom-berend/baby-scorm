var path = require('path');

module.exports = {
    target: "web",
    mode: "development",
    entry: "./src/runtime/T.ts",
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: ["ts-loader"],
            exclude: [__dirname + "./lib/"
            ]
        }]
    },
    devtool: 'inline-source-map',
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/dist/',
        filename: 'bundle.js',
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 8080
    },
}