import fs from 'fs';
import path from 'path';



// fs.readFile(path.join(__dirname, '../../client/index.html'), 'utf8', (error, data) => {
//     // ...
// })

class CreateSCORM {
    
    SCORMDirectory:string

    constructor() {
        let dirname = path.dirname('')
        this.SCORMDirectory = path.join(dirname, '../../SCORM')
        console.log(this.SCORMDirectory)
        this.rmdir(this.SCORMDirectory)

    }


    /** remove the old directory recursively, if it exists */
    rmdir(dir: string) {
        let list = fs.readdirSync(dir);
        for (var i = 0; i < list.length; i++) {
            var filename = path.join(dir, list[i]);
            var stat = fs.statSync(filename);

            if (filename == "." || filename == "..") {
                // pass these files
            } else if (stat.isDirectory()) {
                // rmdir recursively
                this.rmdir(filename);
            } else {
                // rm fiilename
                fs.unlinkSync(filename);
            }
        }
        fs.rmdirSync(dir);

    }

}

// and fire it up
new CreateSCORM()