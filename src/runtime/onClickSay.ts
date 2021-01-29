/////////////////////////////////////////////////////////////////////////////////////
////////////////////// speech support ///////////////////////////////////////////////

let synth = window.speechSynthesis
let synthRunning = false // don't want two instances
let synthCancelled = false // if cancelled then don't restart
let voices: any

// we need to load the voices before we can use them
export function loadVoicesWhenAvailable() {
    voices = synth.getVoices()
    if (voices.length !== 0) {
        // console.log('voices already loaded')
        // console.log('voices', voices)
    } else {
        // console.log('loading voices')
        setTimeout(() => {
            loadVoicesWhenAvailable()
        }, 10)
    }
}

export function onClickSay(utterance: string) {
    if (voices === undefined) {
        alert('Speech not ready yet, still loading voices.')
        return
    }
    if (synthRunning) {     // someone clicked, likelywants to STOP the playback
        // finish this later
    }
    synthCancelled = false
    speekResponse(utterance)
    //
    // if (synth.speaking) { /* stop narration */
    //      /* for safari */
    //   synthRunning = false
    //   synth.cancel()
    // }
    //
    // if (!synthRunning) {
    //   synthRunning = true
    //   let utterance = new SpeechSynthesisUtterance(document.getElementById(id).innerHTML)
    //   console.log(utterance)
    //   utterance.voice = synth.getVoices()[3]
    //   utterance.voiceURI = 'native';
    //
    //   utterance.onend = function () {
    //     synthRunning = false
    //   }
    //   synth.speak(utterance)
    // }
}

// problem with longer speech chunks, here's a workaround
// https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts

function sayit(utterance) {
    let msg = new SpeechSynthesisUtterance()

    // 1:  US english
    // 2:  UK english male
    // 3:  UK english female

    msg.voice = synth.getVoices()[2] // Note: some voices don't support altering params
    msg.lang = 'en-US'
    msg.volume = 1 // 0 to 1
    msg.rate = 1.0 // 0.1 to 1.0
    msg.pitch = 1 // 0 to 2
    msg.onstart = (event) => {
        console.log(`'Speech Starts ${event}`)
    }
    msg.onend = (event) => {
        synthRunning = false
        console.log(`Speech Ends ${event}`)
    }
    msg.onerror = (event) => {
        synthRunning = false
        console.assert(false, `Errored ${event}`)
    }
    msg.onpause = (event) => {
        synthRunning = false
        console.assert(false, `paused ${event}`)
    }
    msg.onboundary = (event) => {
        console.assert(false, `onboundary ${event}`)
    }
    return msg
}

function speekResponse(text: string) {
    speechSynthesis.cancel() // if it errors, this clears out the error.

    if (!synthRunning) {
        synthRunning = true // try to prevent a second speaker from starting
        let sentences = text.split('.')
        for (let i = 0; i < sentences.length; i++) {
            let toSay = sayit(i)
            toSay.text = sentences[i]
            speechSynthesis.speak(toSay)
        }
        synthRunning = false
    }
}


