"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
// fs.readFile(path.join(__dirname, '../../client/index.html'), 'utf8', (error, data) => {
//     // ...
// })
var CreateSCORM = /** @class */ (function () {
    function CreateSCORM() {
        var dirname = path_1["default"].dirname('');
        this.SCORMDirectory = path_1["default"].join(dirname, '../../SCORM');
        console.log(this.SCORMDirectory);
        this.rmdir(this.SCORMDirectory);
    }
    /** remove the old directory recursively, if it exists */
    CreateSCORM.prototype.rmdir = function (dir) {
        var list = fs_1["default"].readdirSync(dir);
        for (var i = 0; i < list.length; i++) {
            var filename = path_1["default"].join(dir, list[i]);
            var stat = fs_1["default"].statSync(filename);
            if (filename == "." || filename == "..") {
                // pass these files
            }
            else if (stat.isDirectory()) {
                // rmdir recursively
                this.rmdir(filename);
            }
            else {
                // rm fiilename
                fs_1["default"].unlinkSync(filename);
            }
        }
        fs_1["default"].rmdirSync(dir);
    };
    return CreateSCORM;
}());
// and fire it up
new CreateSCORM();
