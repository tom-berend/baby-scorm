import path from 'path'
import { ITag } from '../runtime/T'

const validTags = ['p', 'subtitle', 'br', 'code',
    'title', 'module', 'lesson', 'shortdesc', 'break', 'drill', 'cm', 'key']


export class LessonToHTML {

    public assetsURI: string

    private inASpeechBlock = false
    private utteranceTag: ITag  // accumulate speech over multiple <p> into FIRST tag
    private utterance: string = '' //

    private hasTitle = false

    constructor() {

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
        for (let i = 0; i < aLines.length; i++) {
            aLines[i] = aLines[i].replace(new RegExp(/\r/gm), '\n')
        }

        // convert from text lines to ITags (maybe consolidating)
        let aTags = this.inputToParagraphs(aLines)

        //////////// show aTags for debugging
        // for (let i = 0; i < 5; i++) {
        //     console.log('aTag', i, aTags)
        // }


        // preprocess tag array in place - this works because call-by-reference
        this.preProcessTagArray(aTags)

        return (aTags)
    }


    threeDigit(n: number) {
        return ('000' + n).slice(-3) // always a three-digit string-number 001, 002, etc
    }

    isString(value) {
        return typeof value === 'string' || value instanceof String
    }

    // Returns if a value is really a number
    isNumber(value) {
        return typeof value === 'number' && isFinite(value)
    }

    processMarkdown(sTest: string) {

        // first alternate voice / speech
        sTest = this.processAlternateMarkdown(sTest, true)  // keep first set
        sTest = this.processSingleMarkdown(sTest, /_*_/, /_/, '<em>', '</em>')
        sTest = this.processSingleMarkdown(sTest, /\^.*\^/, /\^/, '<b>', '</b>')
        sTest = this.processSingleMarkdown(sTest, /\`.*\`/, /\`/, '<t3d_code>', '</t3d_code>')

        // some global substitutions  // use them carefully
        sTest = sTest.replace(/^^2/g, '[<sup>2</sup>| squared ]')

        // first alternate voice / speech
        //    sTest = this.processAlternateMarkdown(sTest, true)  // keep first set

        // sTest = this.processSingleMarkdown(sTest, '_','_', '<em>', '</em>')
        //   sTest = this.processSingleMarkdown(sTest, '**','', '<b>', '</b>')
        //   sTest = this.processSingleMarkdown(sTest, '`','', '<span style="font-family:monospacefont-size:smaller">', '</span>')


        // trick, alternate is [text[]voice] and it's TWO different markdowns  [--[ and ]--]

        // substitution list to improve voices
        let subs = [{ from: 'JavaScript', to: 'JavvaScript' },
        { from: '\`console.log()\`', to: '[\`console.log()\`|console dot log]' },
        ]

        for (let sub of subs) {
            while (true) {
                let n = sTest.indexOf(sub.from)
                if (n === -1) { break }
                sTest = sTest.slice(0, n) + sub.to + sTest.slice(n + sub.from.length)
            }
        }

        return (sTest)
    }
    eraseMarkdown(sTest: string): string {   // identical to processMarkdown, but erases the marks without replacement
        // first alternate voice / speech
        sTest = this.processAlternateMarkdown(sTest, false)  // keep second set
        // then the italics (ignore \_)
        sTest = this.processSingleMarkdown(sTest, /_*_/, /_/, '', '')
        sTest = this.processSingleMarkdown(sTest, /\`*\`/, /\`/, '', '')
        sTest = this.processSingleMarkdown(sTest, /\^.*\^/, /\^/, '', '')

        // substitution list to improve voices
        let subs = [{ from: 'JavaScript', to: 'JavvaScript' },
        { from: '\`console.log()\`', to: '[\`console.log()\`|console dot log]' },
        ]

        for (let sub of subs) {
            while (true) {
                let n = sTest.indexOf(sub.from)
                if (n === -1) { break }
                sTest = sTest.slice(0, n) + sub.to + sTest.slice(n + sub.from.length)
            }
        }
        return (sTest)
    }

    processSingleMarkdown(sTest: string, openRegex: RegExp, closeRegex: RegExp, openSub: string, closeSub: string) {
        let aMatch: RegExpMatchArray, aMatch2: RegExpMatchArray

        while (true) {
            aMatch = sTest.match(openRegex)
            if (!aMatch) { break }  // all done

            aMatch2 = sTest.slice(aMatch.index + 1).match(closeRegex)
            if (!aMatch2) {
                console.error(`Found open tag for ${openSub}, missing close tag on '${sTest} at ${sTest.slice(aMatch.index)}'`)
            }
            //     console.log("sMatch", sMatch)
            //     console.log("sMatch2", sMatch2)

            let part1 = aMatch.input.slice(0, aMatch.index)
            let part2 = aMatch2.input.slice(aMatch2[0].length - 1, aMatch2.index + aMatch2[0].length - 1)
            let part3 = aMatch2.input.slice(aMatch2.index + aMatch2[0].length - 1 + 1)

            sTest = part1 + openSub + part2 + closeSub + part3

            // console.log(`assemble "${part1}" + "${part2}" + "${part3}"`)
            // console.log(sTest)
        }
        return (sTest)
    }

    processAlternateMarkdown(sTest, isKeepFirst) {
        // console.log(`function processAlternateMarkdown (${sTest}, ${isKeepFirst})`)
        while (true) {    // may have more than one
            let n = sTest.indexOf('[')
            if (n === -1) { break }
            let m = sTest.indexOf('|', n + 1)
            if (m === -1) { console.error(`Missing middle marker on ${sTest}, m=${m},remainder=${sTest.slice(m + 1)}`) }
            let p = sTest.indexOf(']', m + 1)
            if (p === -1) { console.error(`Missing end marker on ${sTest}, p=${p},remainder=${sTest.slice(p + 1)}`) }

            // console.log('part 1 ', sTest.slice(0, n))
            // console.log('part 2 ', sTest.slice(n + 1, m))
            // console.log('part 3 ', sTest.slice(m + 1, p))
            // console.log('part 4 ', sTest.slice(p + 1))

            if (isKeepFirst) {
                sTest = sTest.slice(0, n) + sTest.slice(n + 1, m) + sTest.slice(p + 1)
            } else {
                sTest = sTest.slice(0, n) + sTest.slice(m + 1, p) + sTest.slice(p + 1)
            }
        }
        return (sTest)
    }



    // ///////////////////////////////////////
    // ///////////////////////////////////////

    inputToParagraphs(aLines: string[]): ITag[] {
        // console.log('we have # lines ', aLines)

        let aTags: ITag[] = []  // this will be our result

        for (let sLine of aLines) {   // weirdly, aLines is an Object of type Array.  JavaSscrpt types are awful.
            // console.log('sline ', sLine)
            let match = sLine.match(new RegExp(/^<([a-z]|[A-Z]|[0-9]|\(|\.|\=|\,|\))*>/)) // matchs <p>  and <h1>, etc

            let sTag = ''
            let sRemain = ''
            let aParams: string[]
            let bParams: Map<any, any> = new Map()

            if (match) {
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
                    aParams.map((element) => {

                        let rule = element.split('=')
                        if (rule.length === 1) { // no colon
                            bParams.set(element, '')
                        } else {
                            bParams.set(rule[0], rule[1])
                        }
                    })
                }

                // create a new object, add to aTags
                aTags.push(this.iTagFactory(sTag, bParams, sRemain))

            } else {
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

    // ///////////////////////////////////////
    // ////////// parse the tag for voice/text, markdown, implicit params, etc

    preProcessTagArray(aTags: ITag[]) {

        // TODO move this into a separate compile step, and make it more powerful

        aTags.forEach((o, i) => {   // can modify aTags[i] this way
            // there may be multiple <p> tags in a speech block

            if (!this.inASpeechBlock && aTags[i].tag === 'p') { // need to open our speech blocks
                // if we aren't in a speech block, then this is the FIRST tag of a speech Icon
                this.utteranceTag = aTags[i]
                aTags[i].params.set('SpeechIcon', 'true')  // push out a SpeechIcon on this tag
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
                case 'cm':
                case 'shortdesc':
                case 'break':
                case 'drill':
                case 'title':
                case 'key':
                    break

                case 'module':
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    this.hasTitle = true
                    break

                case 'lesson':
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    this.hasTitle = true
                    break

                case 'subtitle':
                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue)
                    break

                case 'code':
                    // make sure there is an 'lines' parameter
                    if (o.params.get('lines') === undefined) {
                        let nLines: number = o.rawvalue.split('\n').length + 1  // default to # of lines in code, plus 1
                        aTags[i].params.set('lines', nLines.toString())
                    }
                    break

                case 'p':
                    // processMarkdown(s)  adds <em> and <b>, and some standard voice substitutions
                    // eraseMarkdown(s)    gets rid of markdowns, leaving text intact
                    // processAlternateMarkdown(s, isKeepFirst)  looks for [a|b] returns first or second


                    aTags[i].textvalue = this.processMarkdown(aTags[i].rawvalue) // nice HTML
                    this.utterance += ' '+ this.eraseMarkdown(aTags[i].rawvalue) // clean speech
                    if (this.utterance.length > 0) {
                        // only single-quotes allowed in utter
                        this.utterance = this.utterance.replace(/"/g, '\\"') // escape out double-quotes

                    }

                    // maybe an image to the right
                    if (o.params.get('img')) {
                        aTags[i].url = this.assetsURI + 'images/' + o.params.get('img')  // TODO - check that this image exists
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

    pad(n: number) {
        return (n < 10 ? '0' : '') + n
    }

    iTagFactory(newtag: string, aParams: Map<any, any>, remainder: string): ITag {

        // verify that tag is 'legal'
        let LCtag = newtag.toLowerCase()
        let x = validTags.find((element) => element === LCtag)
        console.assert(x === LCtag, `LessonToHTML.iTagFactory not legal tag: `, 'illegal tag ' + newtag)


        let ret: ITag = {
            tag: LCtag,   // always lowercase
            params: aParams,
            rawvalue: remainder,
            textvalue: "",
            speechvalue: "",
            url: "",
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

        for (let oT of rTests) {
            // console.log('test: ', oT)
            // console.log('result: ', oT.test.exec(oT.target))
            console.assert(oT.test.exec(oT.target)[0] === oT.result,
                oT.test + ' ' + oT.target + ' ' + oT.result + ' ' + oT.test.exec(oT.target))
        }

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
        console.assert(aTags[0].params.get('p1') === '', 'Expected params to be "p1=" and got ' + JSON.stringify(aTags[0].params))
        console.assert(aTags[0].rawvalue === 'testParagraph', 'test paragraph fails ' + JSON.stringify(aTags[0].textvalue))

        aLines = ['<p(p1=4)>testParagraph']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params.get('p1') === '4', 'Expected params to be ["p1=4"] and got ' + JSON.stringify(aTags[0].params.get('p1')))
        console.assert(aTags[0].rawvalue === 'testParagraph', 'test paragraph fails ' +JSON.stringify(aTags[0].textvalue))

        aLines = ['<p(p1=4,p2=five)>testParagraph']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params.get('p1') === '4', 'Expected param p1 to be ["p1=4"] and got ' + JSON.stringify(aTags[0].params.get('p1')))
        console.assert(aTags[0].params.get('p2') === 'five', 'Expected p2 to be ["p2=five"] and got ' + JSON.stringify(aTags[0].params.get('p2')))
        console.assert(aTags[0].rawvalue === 'testParagraph', JSON.stringify(aTags[0].textvalue))

        aLines = ['<p(p1)>testParagraph', ' and more']
        aTags = this.inputToParagraphs(aLines)
        console.assert(aTags.length === 1, 'Expected array of one object')
        console.assert(aTags[0].tag === 'p', 'Expected tag to be "<p>" and got "' + aTags[0].tag + '"')
        console.assert(typeof aTags[0].params === 'object', 'Expected the params to be a Map object')
        console.assert(aTags[0].params.get('p1') === '', 'Expected params to be ["p1"] and got ' + JSON.stringify(aTags[0].params))
        console.assert(aTags[0].rawvalue === 'testParagraph\n and more', JSON.stringify(aTags[0].textvalue))


        // one day, if we need it, we can add   <p(p1,p2)>text

        // processMarkdown()

        let rTests2 = [
            { test: 'this _value_ is', result: 'this <em>value</em> is' },
            { test: 'this _value_ is _great_', result: 'this <em>value</em> is <em>great</em>' },

            // doesn't work, don't know why, come back to this later
            // { test: 'this _value_ is *great*', result: 'this <em>value</em> is <b>great</b>' },

            { test: 'this `value` is _great_', result: 'this <t3d_code>value</t3d_code> is <em>great</em>' },
        ]

        for (let sTest of rTests2) {
            let result2 = this.processMarkdown(sTest.test)
            console.assert(result2 === sTest.result, `From '${sTest.test}' we expected '${sTest.result}' but got '${result2}'`)
        }

        // eraseMarkdown()
        let rTests3 = [
            { test: 'this _value_ is', result: 'this value is' },
            { test: 'this _value_ is _great_', result: 'this value is great' },
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
            'br',
            'code',
            'title',
            'module',
            'lesson',
            'shortdesc',
            'break',
            'drill',
            'cm',
            'key']

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

        test = `<p> [tomato|tomawto]
<p> [first|second]`
        rslt = this.parse(assets, test)
        console.log(rslt)


        test = '<p(p1)>testParagraph'
        rslt = this.parse(assets, test)
        console.log(rslt)

        throw ('stop')
    }

}

