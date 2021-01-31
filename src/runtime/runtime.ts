import { ITag } from './T'
import { LessonToITags } from '../createSCORM/lessonToITags'
import { loadVoicesWhenAvailable } from './onClickSay'
import { LessonPage } from '../runtime/lessonpage'




// Basic Run-Time Calls
// This example builds on the Simple Single SCO to demonstrate the proper use of the basic SCORM run-time data model elements. In this example:

// A JavaScript controller is added to handle navigation within the SCO.
// The controller bookmarks the learner’s current location. (cmi.location)
// The controller reports completion as the user progresses through the content. (cmi.completion_status)
// The controller reports success status and score based on the learner’s quiz results 
//     (cmi.success_status, cmi.score.scaled, cmi.score.raw, cmi.score, max and cmi.score.min).
// The controller will record the total time the learner spent in the training (cmi.session_time).
// The controller demonstrates options for exiting the course (cmi.exit and adl.nav.request)
// The manifest includes some basic sequencing information to override some counter-intuitive default values.




interface courseInfo {
    lessons: string[]
    lessonFiles: string[]
    version: string
    copyright: string
    contact: string
    licencedTo: string
    title: string
    launchPage: string
    discordInvite: string
    created: string
}


export class Runtime {

    scormHost: object

    courseInfo: courseInfo
    lessons = new Map<string, ITag[]>()



    constructor() {
        console.log('in class Runtime')
        this.paintWelcome()

        loadVoicesWhenAvailable()
    }


    async httpfetch<T>(fileURI: RequestInfo): Promise<T> {
        const response = await fetch(fileURI);
        const body = await response.json();
        return body;
    }




    async loadAllFiles() {
        console.log('in loadAllFiles')

        // first step - load the course info
        this.courseInfo = await this.httpfetch<courseInfo>("courseinfo.JSON");

        console.log('new lessoninfo', this.courseInfo)

        // now load ALL the course ITag files
        let lesson: ITag[]
        for (let i = 0; i < this.courseInfo.lessonFiles.length; i++) {
            let name = this.courseInfo.lessonFiles[i]
            console.log('fetching lesson ', name)
            const lessonInfo = await this.httpfetch<ITag[]>(name);
            this.lessons.set(name, lessonInfo)
            console.log(this.lessons.get(name))
        }

        // arrgggg..  spent a day trying to make this work, 
        // but all promises fire at the same time and I can't figure
        // how to use Promise.All ...

        // this.courseInfo.lessonFiles.forEach(async (name) => {
        //     const lessonInfo = await this.httpfetch<ITag[]>(name);
        // })
    }



    async paintWelcome() {
        await this.loadAllFiles()

        console.log('all ITag files loaded')

        let firstLesson:ITag[] = this.lessons.values().next().value   // first lesson
        let lessonpage = new LessonPage(firstLesson)
    }
}



// onClickSay("now is the time for all good men to come to the aid of the party")



// let serverURI = 'http://localhost/3d/src/server/AJAX.php'
// let sendData = {
//     cmd: 'test',
//     index: 42,
// }

// let responseData = serverFileSystem(serverURI, sendData)
// console.log('got response', responseData)

// loadLesson(lessonURI, assetsURI, '01_00_hello_world.txt')



// let ls = new SectionVT52('Lesson')
// let ss = new SectionSpeaker('Lesson')

// let ls2 = new SectionVT52('Lesson')
// let ss2 = new SectionSpeaker('Lesson')
// let ls3 = new SectionVT52('Lesson')



// try {
//     alive()
// } catch (err) {
//     console.error(err.message) // Whoops!
//     console.error(err.name) // ValidationError
//     console.error(err.stack) // a list of nested calls with line numbers for each
// }



// async fetchWrapper(fileURI: string): string {
//     const result = await this.fetchJSON(fileURI)
//     return result
// }










// interface Storage {
//   readonly attribute unsigned long length;
//   DOMString? key(unsigned long index);
//   getter DOMString? getItem(DOMString key);
//   setter void setItem(DOMString key, DOMString value);
//   deleter void removeItem(DOMString key);
//   void clear();
// };

// The getItem(key) method must return the current value associated with the given
// key. If the given key does not exist in the list associated with the object then
// this method must return null.
//
// The setItem(key, value) method must first check if a key/value pair with the
// given key already exists in the list associated with the object.
//
// The removeItem(key) method must cause the key/value pair with the given key to
// be removed from the list associated with the object, if it exists. If no item
// with that key exists, the method must do nothing.
//
// The setItem() and removeItem() methods must be atomic with respect to failure.
// In the case of failure, the method does nothing. That is, changes to the data
// storage area must either be successful, or the data storage area must not be
// changed at all.
//
// The clear() method must atomically cause the list associated with the object to
// be emptied of all key/value pairs, if there are any. If there are none, then the
// method must do nothing.

// class DataServer {
//     public cmd: string
//     public data: string
//     public callback: CallableFunction

//     constructor(cmd: string, data: string, callback: CallableFunction) {
//         this.cmd = cmd
//         this.data = data
//         this.callback = callback
//         $.ajax({
//             method: 'POST',
//             url: 'AJAX.php',
//             data: this.data,
//             success: (data) => {
//                 console.log('in DataServer success(', JSON.parse(data))
//                 this.result = data
//                 this.callback(this.result)
//             }
//         })
//     }
// }




////////////////// fetch api  ///////////////////



/** load the lesson in text format, compile it, and insert it into the web page */
export default function loadLesson(lessonURI: string, assetsURI: string, lesson: string) {


    const comboURI = lessonURI + lesson
    console.log('comboURI', comboURI)

    fetch(comboURI)
        .then((response) => response.text())
        .then((data) => {
            // console.log('TEXT', data)

            // now convert to npms (eventually just load ITags)
            const L2H = new LessonToITags()
            const iTags: ITag[] = L2H.parse(assetsURI, data)


            // now build lesson HTML with iTags
            const LP = new LessonPage(iTags)

        })
        .catch((error) => console.assert(error, 'error loading... ' + comboURI))
}


export async function serverFileSystem(serverURL: string, sendData: object): Promise<any> {

    try {
        console.log('posting in postData', JSON.stringify(sendData))

        // Default options are marked with *
        const response = await fetch(serverURL, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow', // manual, *follow, error
            referrer: 'no-referrer', // no-referrer, *client
            body: JSON.stringify(sendData), // body data type must match "Content-Type" header
        })
        return await response.json() // parses JSON response into native JavaScript objects

    } catch (error) {
        console.error('error in serverFileSystem')
    }

}
