
import { VT52 } from './worlds'

import { loadVoicesWhenAvailable } from './onClickSay'
import loadLesson, { serverFileSystem } from './runtime'
import { Scorm } from './SCORM_LOCAL'
import { Runtime } from './runtime'



// TODO: change URI addresses to be configurations
const lessonURI = 'http://localhost/3d/lessons/'
const assetsURI = 'http://localhost/3d/assets/'

const studentID = '00001'
const firstName = 'Tom '
const lastName = 'Berend'

export interface ITag {
    tag: string,   // always lowercase
    params: object,
    rawvalue: string,
    textvalue: string,
    speechvalue: string,
    url: string,
}



///////////////////////////////////////////////////////
/////////// load up the (static) lessons //////////////
///////////////////////////////////////////////////////

//TODO: needs to be driven from manifest




console.log('Starting runtime in T.ts')
let t = new Runtime()




