//const monaco = window.monaco
import { ITag } from './T'

// import *  as ts from 'typescript'
import { World, VT52 } from './worlds'
import { drillByName } from './canvas'
import { onClickSay } from './onClickSay'
import { EditorInstance } from './editorInstance'
import { LessonFactory, drillMathDispatch } from './drillMath'

export class LessonPage {
    constructor(sections: ITag[]) {
        console.log('In LessonPage')

        // clear the existing lesson space

        // cycle through the ITags, creating a section for each one
        sections.forEach((section) => {
            let s
            if (section.tag === 'code') {
                console.log('section', section.tag, section)
            }
            switch (section.tag) {

                case 'key':         // we don't process these, they are meta for the table of contents
                case 'shortdesc':
                case 'break':       // or in case we want to do something later
                    break

                case 'p':
                    s = new SectionP(section)
                    break
                case 'code':
                    s = new SectionCode(section)
                    break
                case 'module':
                    s = new SectionModule(section)
                    break
                case 'lesson':
                case 'subtitle':
                    s = new SectionTitle(section)
                    break
                case 'drill':
                    s = new SectionDrill(section)
                    break
                default:
                    s = new SectionMystery(section)
                    break

                // console.error(section.tag)
            }


        })
    }
}


///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

let halfMonacoWidth = 800   // always.  if you change, then also change the css file (.halfMonaco)
let bakeryTicket: number = 0

interface IAttribute { name: string, value: string }


/** abstract class for adding lesson sections.  use concrete class like sectionVT52 */
abstract class LessonSections {
    public tkt: number  // bakery ticket for this section
    public sectionName: string // 'sect004' or similar
    public editor: any // used by monaco editor

    constructor(tag: ITag) {
        this.tkt = bakeryTicket++       // unique bakery ticket
        this.sectionName = this.divName('sect', this.tkt)
    }

    /** format a class or id into something like 'sect005' */
    divName(prefix: string, tkt: number) {
        return (prefix + ("00" + tkt).slice(-3))   // prefix + 3-digit tkt
    }

    /** create a new node */
    node(newElement: string, content: string | HTMLElement, newId: string = '', className: string = '', attributes: IAttribute[] = []): HTMLElement {
        let node: HTMLElement = document.createElement(newElement)
        if (className.length > 0) { node.className = className }
        if (typeof content === 'string' && content.length > 0) { node.innerHTML = content }
        if (newId.length > 0) { node.id = newId }
        // paste in any attributes...
        attributes.forEach((element) => {   // can be a string or an array
            // console.log('typeof element', typeof element)
            node.setAttribute(element.name, element.value)
        })
        return (node)
    }

    /** attach node to existing ID */
    attach(existingId: string, pContent: string, pId: string, pClassName: string, aNode: HTMLElement[]) {
        let tag = document.getElementById(existingId)
        console.assert(!(tag === null), `No tag "${existingId}`)

        // always wrap the new elements in a <div></div>
        let pElement = document.createElement('DIV')
        if (pClassName.length > 0) { pElement.className = pClassName }
        if (pContent.length > 0) { pElement.innerHTML = pContent }
        if (pId.length > 0) { pElement.id = pId }
        let pTag = tag.appendChild(pElement)

        // now if there are any elements to put below (perhaps div's)
        aNode.forEach((element) => {   // can be a string or an array
            // console.log('typeof element', typeof element)
            pTag.appendChild(element)  // inside the <p></p>
        })
    }

    /** set up basic parent/left/right divs, with specific class */
    basicLeftRight(thisSectionID: string, parentClassName: string, leftClassName: string, rightClassName: string) {

        let section = this.divName("sect", this.tkt)
        let left = this.divName("left", this.tkt)
        let right = this.divName("right", this.tkt)

        this.attach('lesson', '', parentClassName, section, [
            this.node('DIV', '', left, leftClassName),
            this.node('DIV', '', right, rightClassName),
        ])

    }

}

class SectionModule extends LessonSections {     // paints the menubar at the top

    constructor(section: ITag) {
        super(section)

        // retrieve the information about the user
        let userID = sessionStorage.getItem('id')
        let userName = sessionStorage.getItem('name')
        let userUserName = sessionStorage.getItem('username')
        let userLevel = sessionStorage.getItem('level')
        let userRole = sessionStorage.getItem('role')
        let userTeacherID = sessionStorage.getItem('teacherID')
        let userSchoolID = sessionStorage.getItem('schoolID')


        let user3d = sessionStorage.getItem('3d')
        let user3dDist = sessionStorage.getItem('3dDist')
        let userJoomla = sessionStorage.getItem('Joomla')
        let userCodePath = sessionStorage.getItem('3dCodePath')

        // temporary until we link to Joomla
        user3d = 'http://localhost/3d'

        let HTML = `<table class="modbar" style = "padding:10px;" rules = "cols" >
            <tr><td></td><td> <h5>Current Module</h5> </td><td> <h5> Projects </h5> </td> <td> <h5>Get Help</h5> </td></tr>
            <tr>`

        // always have a home button
        HTML += `<td class="modelement" >
                        <a href=${user3d}> <img height="20px" width = "20px" src = "${user3d}/assets/images/home.png" data - toggle="tooltip" title = "Home" /> </a>
                    `
        // logout button only if logged in
        if (userLevel > '0') {
            HTML += `<br /> <a href=${userJoomla} /index.php ? option = com_users & task=user.logout > <img height=\"20px\" width=\"20px\" src=\"${user3d}/assets / images / shutdown.png\" data-toggle=\"tooltip\" title=\"Logout\" /></a>`
        }
        HTML += '</td>'


        // show the current lesson
        HTML += `<td class="modelement" >
                        <button class="greenbutton" > ${section.textvalue}</button>
                    </td>`

        // add the link to projects and SLACK
        HTML += `<td class="modelement">
                    <img style = "height:30px;" src = "${user3d}/assets/images/files.png" onclick = "document.gameCode.directory(); document.gameCode.render();" >
                </td>
                <td class="modelement" >
                     <a href = "https://communityreading.slack.com" target = "_blank" >
                        <img style="height:25px;" src = "${user3d}/assets/images/slack.png"> </a>
                </td>`


        HTML += `</table>`



        //section.textvalue


        // create the textvalue for the entire header, and pop it into the page

        this.attach('lesson', '', '', '', [
            this.node('div', HTML, '', 'modbar'),
        ])


        // // the 'home' button runs you back to Joomla's home page
        // // the 'logoff' button similarly.  if you are in a lesson, then ALWAYS logged in
        // $currentLesson = '01 - Learn Javascript';
        // $HTML.= << <EOT



        //                         < !--    < br />
        //                         <a href="https://join.slack.com/t/communityreading/shared_invite/enQtMzY2MTU4NzczODcyLTJhODFlMDU3OGQ4YzQ3MjYyNGNjN2FhNTU3YzcyNDhlMTM1MmZjNzE1OTA3ZTMwM2RmNTgxNTk5YzcwMWMxODY" > Join Slack < /a>
        // -->

        //     </td>
        //     < /tr></table >


    }
}

class SectionMystery extends LessonSections {   // we don't know what this section is - certainly an error

    constructor(section: ITag) {
        super(section)

        this.attach('lesson', '', '', '', [
            this.node('P', `< span style = "background-color:pink" > Unknown tag - ${section.tag} with textrawvalue ${section.rawvalue} </span>`),
        ])
    }
}


class SectionCode extends LessonSections {
    constructor(section: ITag) {
        super(section)
        console.log('config lines', section.params.get('lines'))

        this.basicLeftRight(this.divName('code', this.tkt),
            this.sectionName, this.divName("monaco", this.tkt), this.divName("world", this.tkt))  // specifies the DIV styles (not the IDs)

        // if option 'noedit', then just display code
        if (section.params.get('noedit')) {
            let text = section.textvalue.replace(/(?:\r\n|\r|\n)/g, '<br>')
            if (text.startsWith('<br>')) { text = text.slice(4) }  // strip leading <br>

            this.attach(this.sectionName, '', this.divName('nocode', this.tkt), '', [
                this.node('P', `<t3d_codeblock>${text}</t3d_codeblock>`, '', ''),
            ])
        } else {

            // create a monaco editor on the left side
            let initialCode = section.textvalue
            let tag = document.getElementById(this.divName('left', this.tkt))
            let nLines = parseFloat(section.params.get('lines'))  // we know it's a string, but typescript doesn't

            console.log('about to create the editor')
            this.editor = new EditorInstance(initialCode, tag, halfMonacoWidth, nLines)



            // // create a monaco editor on the left side
            // let tag = document.getElementById(this.divName('left', this.tkt))
            // const editor = monaco.editor.create(tag, {
            //     value: section.rawvalue,
            //     language: "typescript",
            // })

            // // set the width and height
            // let stringOrTrue = section.params.get('lines')  // we know it's a string, but typescript doesn't
            // if (typeof stringOrTrue === 'string') {
            //     editor.layout({ width: halfMonacoWidth, height: 20 * parseFloat(stringOrTrue) })   // lines converted to pixels
            // } else {
            //     console.error('Never expect to get a TRUE for nLines', section)
            // }


            // ///////////////////////////////////////////////////////////////////
            // // turn on validation (probably on by default)
            // monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            //     noSemanticValidation: false,
            //     noSyntaxValidation: false,
            // })




            // ///////////////////////////////////////////////////////////////////
            // // add extra libraries
            // monaco.languages.typescript.typescriptDefaults.addExtraLib([
            //     'declare class Facts {',
            //     '    /**',
            //     '     * Returns the next fact',
            //     '     */',
            //     '    static next():string',
            //     '}',
            // ].join('\n'), 'filename/facts.d.ts');


            // monaco.languages.typescript.typescriptDefaults.setCompilerOptions(defaultCompilerOptions)



        }
    }
    onDestroy() { }

}


class SectionP extends LessonSections {   // <p> with speaker and
    public utter: string

    constructor(section: ITag) {
        super(section)

        let utterId = this.divName('utter', this.tkt)
        let textId = this.divName('text', this.tkt)

        this.utter = section.speechvalue
        let text = section.textvalue


        // build up the parts of the div that we need
        let nodes: any[] = []

        // speech icon
        if (section.params.get('SpeechIcon')) {    // i hate truthy and falsy values.  is the empty string true or false?
            nodes.push(this.node('DIV', '', '', 'prespeaker'))
            nodes.push(this.node('IMG', '', utterId, 'speaker', [
                { name: 'src', value: "../assets/images/speaker.png" },
            ]))
        }

        // right side image
        if (section.params.get('img')) {
            nodes.push(this.node('IMG', '', '', 'pimage', [
                { name: 'src', value: section.url },
            ]))
        }

        // do we need to add background betty?
        if (section.params.get('background') && section.params.get('SpeechIcon')) {
            nodes.push(this.node('IMG', '', '', 'background', [
                { name: 'src', value: "../assets/images/anime1.png" },
            ]))
        }

        // do we need to add realworld?
        if (section.params.get('realworld') && section.params.get('SpeechIcon')) {
            nodes.push(this.node('IMG', '', '', 'background', [  // same css as background
                { name: 'src', value: "../assets/images/anime2.png" },
            ]))
        }

        // do we need to add mindset?
        if (section.params.get('mindset') && section.params.get('SpeechIcon')) {
            nodes.push(this.node('IMG', '', '', 'background', [  // same css as background
                { name: 'src', value: "../assets/images/anime3.png" },
            ]))
        }

        // finally the text
        nodes.push(this.node('P', text, textId, ''))

        // finally attach, either for background-betty or for normal
        if (section.params.get('background')) {
            this.attach('lesson', '', this.sectionName, 'background', nodes)
        } else if (section.params.get('realworld')) {
            this.attach('lesson', '', this.sectionName, 'realworld', nodes)
        } else if (section.params.get('mindset')) {
            this.attach('lesson', '', this.sectionName, 'mindset', nodes)
        } else {
            this.attach('lesson', '', this.sectionName, '', nodes)
        }

    }

    onDestroy() { }
}


class SectionTitle extends LessonSections {   // handles titles and subtitles

    constructor(section: ITag) {
        super(section)

        let tag = 'h1'
        if (section.tag === 'subtitle') {
            tag = 'h2'
        }

        this.attach('lesson', '', '', '', [
            this.node(tag, section.textvalue),
        ])
    }
}

class SectionDrill extends LessonSections {   // handles math drills

    constructor(section: ITag) {
        super(section)

        // a drill is just a canvas area, the drill software figures how to fill it

        let nodes: any[] = []

        let drillId = this.divName('drill', this.tkt)

        // <div id="drill???s" width="1000" height="300"></canvas>
        this.attach('lesson', '', this.sectionName, '', [
            this.node('canvas', '', drillId, 'drill', [{ name: 'width', value: "1000" }, { name: 'height', value: "300" }],
            )])

        let drill = drillByName('singleMultiply', drillId, 6)



        // // eventually ask for history, decide what to do next
        // // for now, drill 6x6 simplemultiply
        // let model = LessonFactory([6, 6])
        // let drill = drillMathDispatch(drillId, model, 'SimpleMultiply')

        // // test function
        // let i = 0
        // while (i++ < 1) {
        //     let question = drill.generator(false).next
        //     drill.renderQuestion(question)
        // }
    }


}
