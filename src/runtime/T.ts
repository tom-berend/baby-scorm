
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
    params: Map<any, string>,
    rawvalue: string,
    textvalue: string,
    speechvalue: string,
    url: string,
}


///////////////////////////////////////////////////////
/////////// load up the (static) lessons //////////////
///////////////////////////////////////////////////////

//TODO: needs to be driven from manifest



let fetchBuffer:string = ''

/** this will load a single file */
async function fetchJSON(fileURI: string) {
    console.log('in fetchJSON')
    await fetch(fileURI)
        .then(response => response.json())
        .then((data) => {
            console.log('JSON', data)
            fetchBuffer = data 
            const p = document.createElement('P')
            p.style.display = 'none'
            p.innerHTML = data.message
            document.body.appendChild(p)
        })
        .catch(() => alert('oh no! could not load '+fileURI))
}


async function waitForFetchs(){
    await fetchJSON('testfile.json')
    console.log(' waiting2 has received ',fetchBuffer)

    let runtime = new Runtime()

}


waitForFetchs()
