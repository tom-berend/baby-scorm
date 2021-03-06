import path from 'path'
import { ITag } from '../runtime/T'

const validTags = ['p', 'subtitle', 'section', 'br', 'code', 'asciimath', 'youtube',
    'title', 'module', 'lesson', 'shortdesc', 'break', 'drill', 'key', 'run']


export class LessonToITags {

    public assetsURI: string = ''

    private inASpeechBlock = false
    private utteranceTag: ITag  // accumulate speech over multiple <p> into FIRST tag
    private utterance: string = '' // collect utterances, they all go into the FIRST block

    private hasTitle = false

    constructor() {
        // need to initialize the utteranceTag, but we don't have the first utterance yet
        this.utteranceTag = this.iTagFactory('p', new Map<any, any>(), '')

        this.unitTests()  // we ALWAYS run the unit tests

    }

    // convert a lesson into ready-to-insert HTML
    parse(assetsURI: string, lesson: string): ITag[] {

        this.assetsURI = assetsURI

        // console.log(lesson.slice(0, 100))

        // process lesson into a nice array of lines (actually paragraphs)
        let aLines: string[] = lesson.toString().split('\n')

        // strip out any "byte order mark" from start of lines
        // utf8:  0xEF,0xBB,0xBF.
        // utf16: U+FEFF
        // https://en.wikipedia.org/wiki/Byte_order_mark

        // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
        // conversion translates it to FEFF (UTF-16 BOM)
        for (let i = 0; i < aLines.length; i++) {
            if (aLines[i].charCodeAt(0) === 0xFEFF) {
                aLines[i] = aLines[i].slice(1)
            }
        }

        //////////// show char values for debugging
        // for (let i = 0; i < 5; i++) {
        //     console.log('1', i, aLines[i])
        //     for (let j = 0; j < aLines[i].length; j++) {
        //         console.log(i, j, aLines[i].charCodeAt(j))
        //     }
        // }

        // replace ALL CRLF with ordinary newline \n
        // for (let i = 0; i < aLines.length; i++) {
        //     aLines[i] = aLines[i].replace(new RegExp(/\r/gm), '\n')
        // }

        // convert from text lines to ITags (maybe consolidating)
        let aTags = this.inputToParagraphs(aLines)

        // //////////// show aTags for debugging
        // for (let i = 0; i < 5; i++) {
        //     console.log('aTag', i, aTags)
        // }


        aTags = this.stripAndHideInnerTags(aTags)



        // preprocess tag array in place - this works because call-by-reference
        this.preProcessTagArray(aTags)

        return (aTags)
    }


    threeDigit(n: number): string {
        return ('000' + n).slice(-3) // always a three-digit string-number 001, 002, etc
    }

    isString(value: any): boolean {
        return typeof value === 'string' || value instanceof String
    }

    // Returns if a value is really a number
    isNumber(value: any): boolean {
        return typeof value === 'number' && isFinite(value)
    }

    processMarkdown(sTest: string): string {

        // first alternate voice / speech
        sTest = this.processAlternateMarkdown(sTest, true)  // keep first set
        sTest = this.processSingleMarkdown(sTest, / #.*#/, /[^\\]#/, ' <em>', '</em>')  // allow # with escape \#
        sTest = this.processSingleMarkdown(sTest, /\\#/, /#/, '#', '')

        sTest = this.processSingleMarkdown(sTest, /\^.*\^/, /\^/, '<b>', '</b>')
        sTest = this.processSingleMarkdown(sTest, /\`.*\`/, /\`/, '<t3d_code>', '</t3d_code>')

        sTest = sTest.trimRight()  // take off trailing blanks

        // some global substitutions  // use them carefully
        // sTest = sTest.replace(/^^2/g, '[<sup>2</sup>| squared ]')

        // first alternate voice / speech
        //    sTest = this.processAlternateMarkdown(sTest, true)  // keep first set

        // sTest = this.processSingleMarkdown(sTest, '_','_', '<em>', '</em>')
        //   sTest = this.processSingleMarkdown(sTest, '**','', '<b>', '</b>')
        //   sTest = this.processSingleMarkdown(sTest, '`','', '<span style="font-family:monospacefont-size:smaller">', '</span>')


        // trick, alternate is [text[]voice] and it's TWO different markdowns  [--[ and ]--]

        return (sTest)
    }

    eraseMarkdown(sTest: string): string {   // identical to processMarkdown, but erases the marks without replacement
        // first alternate voice / speech
        sTest = this.processAlternateMarkdown(sTest, false)  // keep second set
        // then the italics (ignore \_)
        sTest = this.processSingleMarkdown(sTest, /#*#/, /#/, '', '')
        sTest = this.processSingleMarkdown(sTest, /\`*\`/, /\`/, '', '')
        sTest = this.processSingleMarkdown(sTest, /\^.*\^/, /\^/, '', '')

        sTest = sTest.trimRight()  // take off trailing blanks


        // // substitution list to improve voices
        // let subs = [
        //     { from: 'JavaScript', to: '[JavaScript | JavvaScript]' },
        //     { from: '\`console.log()\`', to: '[\`console.log()\`|console dot log]' },
        // ]

        // for (let sub of subs) {
        //     while (true) {
        //         let n = sTest.indexOf(sub.from)
        //         if (n === -1) { break }
        //         sTest = sTest.slice(0, n) + sub.to + sTest.slice(n + sub.from.length)
        //     }
        // }
        return (sTest)
    }

    /** don't call this directly, it is shared by processMarkdown() and eraseMarkdown() */
    processSingleMarkdown(sTest: string, openRegex: RegExp, closeRegex: RegExp, openSub: string, closeSub: string): string {
        let aMatch: RegExpMatchArray | null, aMatch2: RegExpMatchArray | null

        while (true) {
            aMatch = sTest.match(openRegex)
            if (aMatch == null) { break }  // all done
            if (aMatch.index == undefined) { break }  // all done
            if (aMatch.input == undefined) { break }  // all done

            aMatch2 = sTest.slice(aMatch.index + 1).match(closeRegex) 
            if (!aMatch2) {
                console.error(`Found open tag for ${openSub}, missing close tag on '${sTest} at ${sTest.slice(aMatch.index)}'`)
            }
            //     console.log("sMatch", sMatch)
            //     console.log("sMatch2", sMatch2)

            let part1 = aMatch.input.slice(0, aMatch.index)

            console.assert(aMatch2[0] !== null, `Matching problem at ${sTest}`)
            console.assert(aMatch2[0].length - 1 !== null, `Matching problem at ${sTest}`)
            if (aMatch2.index == undefined) { break }  // all done
            if (aMatch2.input == undefined) { break }  // all done
            console.assert(aMatch2.index + aMatch2[0].length - 1 !== null, `Matching problem at ${sTest}`)

            let part2 = aMatch2.input.slice(aMatch2[0].length - 1, aMatch2.index + aMatch2[0].length - 1)

            console.assert(aMatch2.index + aMatch2[0].length !== null, `Matching problem at ${sTest}`)
            let part3 = aMatch2.input.slice(aMatch2.index + aMatch2[0].length - 1 + 1)

            sTest = part1 + openSub + part2 + closeSub + part3

            // console.log(`assemble "${part1}" + "${part2}" + "${part3}"`)
            // console.log(sTest)
        }
        return (sTest)
    }


    createWebURL(snippet: string): string {

        // snippet does NOT have the open and close square brackets

        // 2-element: [print|voice]  
        // 3-element [print|voice|weburl]
        // strategy is to convert a 3-element to a 2-element
        //   [ seeFoo | sayFoo | http://foo.com ] becomes
        //    [<a target="_blank" href="http://foo.com"> seeFoo</a> | sayFoo]  

        let aSnippet: string[] = snippet.split('|')
        if (aSnippet.length == 3) { // there is a URL part
            // we don't use _blank because we probably don't want to open multiple windows
            snippet = `<a href='${aSnippet[2]}' target='gamecode'>${aSnippet[0].trimRight()}</a>|${aSnippet[1]}`
        }
        return snippet
    }


    /** don't call this directly, it is shared by processMarkdown() and eraseMarkdown() */
    processAlternateMarkdown(sTest: string, isKeepFirst: boolean): string {
        // console.log(`function processAlternateMarkdown (${sTest}, ${isKeepFirst})`)

        let oldSTest = sTest
        while (true) {    // may have more than one
            let n = sTest.indexOf('[')
            if (n === -1) { break }

            let p = sTest.indexOf(']', n + 1)
            if (p === -1) {
                console.error(`Missing end marker on ${sTest}, p=${p},remainder=${sTest.slice(p + 1)}`)
                throw ('stop')
            }

            // call createWebUrl.  if it is a two=part, then will not change. if a three-part, then 
            // will be converted to a two part
            let snippet = sTest.slice(n + 1, p)
            let fixedSnippet = this.createWebURL(snippet) // convert from 3-part to 2-part (if necessary)
            // and put it back into sTest 
            sTest = sTest.slice(0, n) + '[' + fixedSnippet + ']' + sTest.slice(p + 1)
            // console.log('fixedSnippet',fixedSnippet)


            // start again
            n = sTest.indexOf('[')
            if (n === -1) { break }

            p = sTest.indexOf(']', n + 1)
            if (p === -1) { console.error(`Missing end marker on ${sTest}, p=${p},remainder=${sTest.slice(p + 1)}`) }


            let m = sTest.indexOf('|', n + 1)
            if (m === -1) { console.error(`Missing middle marker on ${sTest}, m=${m},remainder=${sTest.slice(m + 1)}`) }

            // console.log('part 1 ', sTest.slice(0, n))
            // console.log('part 2 ', sTest.slice(n + 1, m))
            // console.log('part 3 ', sTest.slice(m + 1, p))
            // console.log('part 4 ', sTest.slice(p + 1))

            if (isKeepFirst) {  // keep the first part
                sTest = sTest.slice(0, n) + sTest.slice(n + 1, m) + sTest.slice(p + 1)
            } else {            // keep the second part
                sTest = sTest.slice(0, n) + sTest.slice(m + 1, p) + sTest.slice(p + 1)
            }
        }

        return (sTest)
    }



    // ///////////////////////////////////////
    // ///////////////////////////////////////

    /** find tag-type and parameters  */
    inputToParagraphs(aLines: string[]): ITag[] {
        // console.log('we have # lines ', aLines)

        let aTags: ITag[] = []  // this will be our result

        for (let sLine of aLines) {   // weirdly, aLines is an Object of type Array.  JavaSscrpt types are awful.
            // console.log('sline ', sLine)

            /** match is from the first < at the start of line to the  next > */
            let match = sLine.match(new RegExp(/^<([a-z]|[A-Z]|[0-9]|\_|\(|\.|\=|\,|\))*>/)) // matchs <p>  and <h1>, etc

            let sTag = ''
            let sRemain = ''
            let aParams: string[]

            // let bParams: object = {}         // not strict enuf for typescript
            let bParams: { [key: string]: any } = {}

            if (match) {
                // console.log('match', match[0].toString)
                sTag = match[0].toString()
                sTag = sTag.slice(1, sTag.length - 1)  // take out the < and >

                sRemain = sLine.slice(sTag.length + 2) // if no params

                // clean up - look inside match for parameters
                let params = new RegExp(/\(([^)]+)\)/).exec(sTag)
                // console.log(`params of '${sTag}'`, params)
                if (params) {
                    // console.log('processing a parameter')
                    let sMatch = params[1].toString()
                    // console.log('params', sMatch, aParams)
                    sTag = sTag.slice(0, params.index)  // patch the tag part

                    aParams = sMatch.split(',') // and turn into an array of params
                    // now convert to a map, expanding from 'xx' to 'xx:true' where necessary
                    aParams.map((element: string) => {

                        if (element == null) {
                            throw ('should never happen')
                        }
                        let rule = element.split('=')
                        if (rule.length === 1) { // no colon
                            bParams[element] = ''
                        } else {
                            bParams[rule[0]] = rule[1]
                        }
                    })
                }

                // create a new object, add to aTags
                aTags.push(this.iTagFactory(sTag, bParams, sRemain))

            } else {

                // many reasons we might be here
                // we allow a BLANK line without a tag
                // we allow follow lines in code


                // here for continuation lines (without tags)
                // so patch the PREVIOUS aTag
                // just test that the first character isn't a '<'
                console.assert(sLine.slice(0, 1) !== '<', 'Looks like a bad tag:  ' + sLine)

                // console.log("aTags", aTags)
                // special case, this line didn't start with a tag, append to last aTag
                // console.log("here's the bad puppy:", sLine)
                // console.log('atags:', aTags)

                if (aTags.length === 0) { console.error(`File must start with a tag, we got '${sLine}'`) }

                // console.log ("before",aTags[aTags.length-1].value, " plus", sLine)
                aTags[aTags.length - 1].rawvalue += '\n' + sLine
                // console.log ("after",aTags[aTags.length-1].value)
            }
        }
        return (aTags)
    }

    /** convert internal HTML tags (not general, specific tags in specific ways) 
     * DO NOT TRY TAG-WITHIN-TAG, this is not a recursive DOM-style parser
    */
    stripAndHideInnerTags(aTags: ITag[]): ITag[] {
        let infiniteLoopGuard = 1000

        // test every tag in the document, we bring in the whole file and traverse it
        aTags.forEach((o, i) => {   // can modify aTags[i] this way

            // console.log('testing o.rawvalue',o.rawvalue)

            // process these specific tags
            let tags = ['a', 'b']
            tags.forEach((tag: string) => {
                let regex = `<\s*${tag}[^>]*>(.*?)<\s*\/\s*${tag}>`
                let matches: any[] | null

                // process multiple tags on a single line
                while (matches = o.rawvalue.match(new RegExp(regex))) {

                    // IMPORTANT - must REMOVE the tag, or infinite loop
                    if (infiniteLoopGuard-- < 0) {
                        console.error(`stripAndHide: infinite loop testing tag '${tag}' against ${o.rawvalue}`)
                        break
                    }


                    // o.rawvalue = before<a ref="someone">something</a>after 
                    // match[0] = "<a ref="someone">something</a>" 
                    // match[1] = "something"



                    // console.log('matches', matches)

                }
            })


        })

        return aTags
    }

    // ///////////////////////////////////////
    /** parse the tag for voice/text, markdown, implicit params, etc */
    preProcessTagArray(aTags: ITag[]): void {

        // TODO move this into a separate compile step, and make it more powerful

        aTags.forEach((o, i) => {   // can modify aTags[i] this way
            // there may be multiple <p> tags in a speech block

            // console.log('preprocess', o)
            // we also close off speech block for <p(h1)> and reopen another
            if (this.inASpeechBlock &&
                (('h1' in aTags[i].params) ||
                    ('h2' in aTags[i].params) ||
                    ('h3' in aTags[i].params))
            ) { // need to close off our prior speech block
                // if we aren't in a speech block, then this is the FIRST tag of a speech Icon
                this.utteranceTag = aTags[i]  // point at new tag
                this.utterance = ''     // and start a new speech
                aTags[i].params['SpeechIcon'] = 'true'  // push out a SpeechIcon on this tag
                this.inASpeechBlock = true
            }
            if (!this.inASpeechBlock && aTags[i].tag === 'p') { // need to open our speech blocks
                // if we aren't in a speech block, then this is the FIRST tag of a speech Icon
                this.utteranceTag = aTags[i]
                aTags[i].params['SpeechIcon'] = 'true'  // push out a SpeechIcon on this tag
                this.inASpeechBlock = true
            }
            if (this.inASpeechBlock && aTags[i].tag !== 'p') { // need to close off our speech block
                this.utteranceTag.speechvalue = this.utterance
                this.utterance = ''
                this.inASpeechBlock = false
                // watch out - fix up at the bottom of the for loop too
            }

            switch (aTags[i].tag) {

                case 'br':
                case 'break':
                case 'drill':
                case 'key':
                case 'run':
                    break

                case 'module':
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    this.hasTitle = true
                    break

                case 'lesson':
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    this.hasTitle = true
                    break


                case 'shortdesc':
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    break

                case 'section':         // can put bold and keys in these fields
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    break

                case 'title':
                case 'subtitle':
                case 'asciimath':
                case 'youtube':
                    aTags[i].textvalue = aTags[i].rawvalue  // don't try to process markdown
                    break

                case 'code':

                    // make sure there is an 'lines' parameter
                    if ('lines' in o.params) {

                        let nLines: number = o.rawvalue.split('\n').length + 1  // default to # of lines in code, plus 1 
                        nLines = Math.min(nLines, 8)    // to maximum of 8 lines
                        aTags[i].params['lines'] = nLines.toString()
                    }
                    break

                case 'p':
                    // processMarkdown(s)  adds <em> and <b>, and some standard voice substitutions
                    // eraseMarkdown(s)    gets rid of markdowns, leaving text intact
                    // processAlternateMarkdown(s, isKeepFirst)  looks for [a|b] returns first or second


                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue) // nice HTML

                    // add a pause to each sentence, makes it more human.
                    this.utterance += ' ' + this.eraseMarkdown(aTags[i].rawvalue) + " . " // clean speech
                    if (this.utterance.length > 0) {
                        // only single-quotes allowed in utter
                        this.utterance = this.utterance.replace(/"/g, '\\"') // escape out double-quotes

                    }

                    // maybe an image to the right
                    if ('img' in o.params) {
                        //TODO: 01 is hardcoded, need to change to lesson#
                        aTags[i].url = 'assets/' + '01/' + o.params['img']  // TODO - check that this image exists
                        break
                    }

                    // maybe a video to the right
                    if ('video' in o.params) {
                        //TODO: 01 is hardcoded, need to change to lesson#
                        aTags[i].url = 'assets/' + '01/' + o.params['video']  // TODO - check that this image exists
                        break
                    }

                    break


                // case '<quote>':
                //     HTML += `<blockquote class="blockquote" style="margin-bottom:0pxpadding-bottom:0px">${i.value}</blockquote>\n`
                //     break
                // case '<citation>':
                //     HTML += `<cite><footer class="blockquote-footer" style="text-indent:100pxmargin-bottom:30px">${i.value}</footer></cite>\n`
                //     break
                // case '<pre>':
                //     HTML += `<pre>${i.value}</pre>\n`
                //     break
                // case '<youtube>':
                //     HTML += `<iframe width="480" height="270" align="right"
                //                src="https://www.youtube.com/embed/${i.value}?rel=0&ampcontrols=0" frameborder="0"
                //                allow="autoplay encrypted-media" allowfullscreen></iframe>\n`
                //     break
                default:
                    console.error('Should never get here on, ' + JSON.stringify(aTags[i]))

            }

            // all done.  just close off
            if (this.inASpeechBlock) { // maybe need to close off our last speech block
                this.utteranceTag.speechvalue = this.utterance
            }
        })
    }

    pad(n: number): string {
        return (n < 10 ? '0' : '') + n
    }

    iTagFactory(newtag: string, aParams: object, remainder: string): ITag {

        // verify that tag is 'legal'
        let LCtag = newtag.toLowerCase()
        let x = validTags.find((element) => element === LCtag)
        console.assert(x === LCtag, `LessonToHTML.iTagFactory not legal tag: `, 'illegal tag ', newtag)


        let ret: ITag = {
            tag: LCtag,   // always lowercase
            params: aParams,
            rawvalue: remainder.trim(),
            textvalue: "",
            speechvalue: "",
            url: "",
            innerTags: []
        }
        return (ret)
    }

    // ////////////////////////////////////
    // //////////   tests
    // ////////////////////////////////////

    unitTests() {
        console.log('Starting unit tests...')

        // TODO put testing conditions on this
        // check out iTagFactory
        let iTag = this.iTagFactory('p', new Map<any, any>(), '')
        // console.log('test iTagFactory', iTag)

        // regex
        let rTests = [
            { test: new RegExp(/abc/), target: 'abcde', result: 'abc' },
            { test: new RegExp(/^abc/), target: 'abcde', result: 'abc' },
            { test: new RegExp(/^[a-z]*/), target: 'abc99', result: 'abc' },
            { test: new RegExp(/^<[a-z]+>/), target: '<p>stuff', result: '<p>' },
            { test: new RegExp(/^<([a-z]|[0-9]|\(|\))*>/), target: '<p1>stuff', result: '<p1>' }, // allow <h1> or similar
            { test: new RegExp(/^<([a-z]|[0-9]|\(|\))*>/), target: '<p1(p2)>stuff', result: '<p1(p2)>' },
            { test: new RegExp(/\(([^)]+)\)/), target: '<p1(param)>stuff', result: '(param)' }, // get the brackets
        ]

        //TODO figure how to get this past typescript
        // for (let oT of rTests) {
        //     // console.log('test: ', oT)
        //     // console.log('result: ', oT.test.exec(oT.target))
        //     console.assert(oT.test.exec(oT.target)[0] === oT.result,
        //         oT.test + ' ' + oT.target + ' ' + oT.result + ' ' + oT.test.exec(oT.target))
        // }

        // inputToParagraphs()

        let aLines = ['<p>testParagraph']
        let aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(aTags[0].rawvalue === 'testParagraph', `Expected string to be 'testParagraph' and got '${aTags[0].textvalue}'`)


        aLines = ['<p>testParagraph', ' and more']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(aTags[0].rawvalue === 'testParagraph\n and more', JSON.stringify(aTags[0].textvalue))


        aLines = ['<p(p1)>testParagraph']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params['p1'] === '', 'Expected params to be "p1=" and got ' + JSON.stringify(aTags[0].params))
        console.assert(aTags[0].rawvalue === 'testParagraph', 'test paragraph fails ' + JSON.stringify(aTags[0].textvalue))

        aLines = ['<p(p1=4)>testParagraph']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params['p1'] === '4', 'Expected params to be ["p1=4"] and got ' + JSON.stringify(aTags[0].params['p1']))
        console.assert(aTags[0].rawvalue === 'testParagraph', 'test paragraph fails ' + JSON.stringify(aTags[0].textvalue))

        aLines = ['<p(p1=4,p2=five)>testParagraph']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params['p1'] === '4', 'Expected param p1 to be ["p1=4"] and got ' + JSON.stringify(aTags[0].params['p1']))
        console.assert(aTags[0].params['p2'] === 'five', 'Expected p2 to be ["p2=five"] and got ' + JSON.stringify(aTags[0].params['p2']))
        console.assert(aTags[0].rawvalue === 'testParagraph', JSON.stringify(aTags[0].textvalue))

        aLines = ['<p(p1)>testParagraph', ' and more']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params['p1'] === '', 'Expected params to be ["p1"] and got ' + JSON.stringify(aTags[0].params))
        console.assert(aTags[0].rawvalue === 'testParagraph\n and more', JSON.stringify(aTags[0].textvalue))


        // one day, if we need it, we can add   <p(p1,p2)>text

        // processMarkdown()

        let rTests2 = [
            { test: 'this #value# is', result: 'this <em>value</em> is' },
            { test: 'this #value# is #great#', result: 'this <em>value</em> is <em>great</em>' },

            // doesn't work, don't know why, come back to this later
            // { test: 'this _value_ is *great*', result: 'this <em>value</em> is <b>great</b>' },

            { test: 'this `value` is #great#', result: 'this <t3d_code>value</t3d_code> is <em>great</em>' },
        ]

        for (let sTest of rTests2) {
            let result2 = this.processMarkdown(sTest.test)
            console.assert(result2 === sTest.result, `From '${sTest.test}' we expected '${sTest.result}' but got '${result2}'`)
        }

        // eraseMarkdown()
        let rTests3 = [
            { test: 'this #value# is', result: 'this value is' },
            { test: 'this #value# is #great#', result: 'this value is great' },
            { test: '[tomato|tomawto]', result: 'tomawto' },
        ]

        rTests3.forEach((i) => {
            let result3 = this.eraseMarkdown(i.test)
            console.assert(result3 === i.result, `From '${i.test}' we expected '${i.result}' but got '${result3}'`)
        })

        // processAlternateMarkdown (sTest, marker, isKeep)
        let rTests4 = [
            { test: 'this[?|,] value', resultKeep: 'this? value', resultDisc: 'this, value' },
        ]

        for (let sTest of rTests4) {
            let resultKeep = this.processAlternateMarkdown(sTest.test, true)
            let resultDisc = this.processAlternateMarkdown(sTest.test, false)

            console.assert(resultKeep === sTest.resultKeep,
                `From '${sTest.test}' we expected '${sTest.resultKeep}' but got '${resultKeep}}'`)
            console.assert(resultDisc === sTest.resultDisc,
                `From '${sTest.test}' we expected '${sTest.resultDisc}' but got '${resultDisc}'`)
        }


        //         // TODO put testing conditions on this
        //         let test = `<title>Hello World\n
        // <p>I'm alive\n

        // let result = this.parse('', test)
        // // console.log(result)


        this.unittests2()
    }

    unittests2() {

        let test: string
        let rslt: ITag[]

        let assets = path.join(__dirname, '../assets')
        const validTags = [
            'p',
            'subtitle',
            'section',
            'br',
            'code',
            'title',
            'module',
            'lesson',
            'shortdesc',
            'break',
            'drill',
            'cm',
            'key',
            'run']

        // <module>
        // test = '<module> 01-Beginner Javascript'
        // rslt = this.parse(assets, test)
        // console.log(rslt)

        // // <p>
        // test = '<p(img=radius.jpg)>The image on the right'
        // rslt = this.parse(assets, test)
        // console.log(rslt)

        // test = '<p> [<a href="https://www.google.com/chrome">https://www.google.com/chrome</a>|w w w dot google dot com]'
        // rslt = this.parse(assets, test)
        // console.log(rslt)

        //         test = `<p> [tomato|tomawto]
        // <p> [first|second]`
        //         rslt = this.parse(assets, test)
        //         console.log(rslt)


        //         test = '<p(p1)>testParagraph'
        //         rslt = this.parse(assets, test)
        //         console.log(rslt)

    }

}


