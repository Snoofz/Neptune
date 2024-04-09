// const MidiPlayer = require("./midi-player-js");
const JZZ = require("../lib/JZZ");
require('../lib/JZZ.midi.SMF')(JZZ);

let songTime = 0;
let numTracks = 0;

const jsonSongs = {
    "bad apple": {
        songName: "Bad Apple",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Bad%2BApple7.mid"
    },
    "death waltz": {
        songName: "Death Waltz",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Death%20Waltz.mid"
    },
    "renai circulation": {
        songName: "Renai Circulation",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Renai_Circulation.mid"
    },
    "polish cow": {
        songName: "Polish Cow",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/PolishCowPiano.mid"
    },
    "sweden": {
        songName: "Sweden",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Sweden_Minecraft.mid"
    },
    "necrofantasia": {
        songName: "Necrofantasia",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Necrofantasia.mid"
    },
    "payphone": {
        songName: "Payphone",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Payphone.mid"
    },
    "hey there delilah": {
        songName: "Hey there Delilah",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Hey_There_Delilah.mid"
    },
    "circus galop": {
        songName: "Circus Galop",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Circus%2BGalop.mid"
    },
    "blend s opening": {
        songName: "Blend S Opening",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Blend_S_OP.mid"
    },
    "impossible despacito": {
        songName: "Impossible Despacito",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Despacito%20Deblacked.mid"
    },
    "impossible let it go": {
        songName: "Impossible Let It Go",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Let%20It%20Go%20by%20MBMS%20Deblacked.mid"
    },
    "impossible heart afire": {
        songName: "Impossible Heart Afire",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Heart%20Afire%20Deblacked.mid"
    },
    "impossible ghost busters theme": {
       songName: "Impossible Ghost Busters Theme",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Ghost%20Busters%20Deblacked.mid"
    },
    "voyage": {
        songName: "Voyage",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Voyage%20Deblacked.mid"
    },
    "unravel": {
        songName: "Unravel",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Unravel%20Deblacked.mid"
    },
    "the titan": {
        songName: "The Titan",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/The%20Titan%20Deblacked.mid"
    },
    "ouranos": {
        songName: "Ouranos",
        url: "https://raw.githubusercontent.com/PhoenixTheCoder/NMPB/main/Deblacked/Ouranos%20-%20HDSQ%20%26%20The%20Romanticist%20%5Bv1.6.7%5D.mid"
    }
}

function fromURL(url) {
    return new Promise((resolve, reject) => {
        try {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
              if (this.readyState == 4) {
                if (this.status == 200) {
                  let r, i;
                  let data = '';
                  r = xhttp.response;
                  if (r instanceof ArrayBuffer) {
                    r = new Uint8Array(r);
                    for (i = 0; i < r.length; i++) data += String.fromCharCode(r[i]);
                  } else { // for really antique browsers
                    r = xhttp.responseText;
                    for (i = 0; i < r.length; i++) data += String.fromCharCode(r.charCodeAt(i) & 0xff);
                    }
                    resolve(data);
                } else {
                    console.log('XMLHttpRequest error');
                    reject(undefined);
                }
              }
            };
            try { xhttp.responseType = 'arraybuffer'; } catch (e) {}
            xhttp.overrideMimeType('text/plain; charset=x-user-defined');
            xhttp.open('GET', url, true);
            xhttp.send();
          }
          catch (e) {
            console.log('XMLHttpRequest error');
            reject(undefined);
          }
    });
}

let MIDI_TRANSPOSE = -12;
let MIDI_KEY_NAMES = ["a-1", "as-1", "b-1"];
let bare_notes = "c cs d ds e f fs g gs a as b".split(" ");

for (let oct = 0; oct < 7; oct++) {
    for (let i in bare_notes) {
        MIDI_KEY_NAMES.push(bare_notes[i] + oct);
    }
}

MIDI_KEY_NAMES.push("c7");

let logarithmicVelocity = false;
const pitchBends = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
}

const formatTime = ms => {
    let ss = ms / 1000;
    let mm = ss / 60;
    let hh = mm / 60;

    return `${Math.floor(mm).toString().padStart(2, '0')}:${Math.floor(ss % 60).toString().padStart(2, '0')}`;
}

class Player {
    constructor(cl) {
        this.isPlaying = false;
        this.octave = 0;
        this.echo = 0;
        this.echod = 0;
        this.transpose = 0;
        this.bot = cl;
        
        this.player;
        this.midiout = JZZ.Widget({ _receive: (evt) => {
            let channel = evt[0] & 0xf;
            let cmd = evt[0] >> 4;
            let note_number = evt[1];
            let vel = evt[2];

            if (channel == 9) return;

            if (cmd == 8 || (cmd == 9 && vel == 0)) {
                // if (vel < 54) return;
                // NOTE_OFF
                MPP.release(
                    MIDI_KEY_NAMES[
                        note_number - 9 + MIDI_TRANSPOSE + pitchBends[channel]
                    ]
                );
            } else if (cmd == 9) {
                // if (vel < 54) return;
                // NOTE_ON
                MPP.press(
                    MIDI_KEY_NAMES[
                        note_number - 9 + MIDI_TRANSPOSE + pitchBends[channel]
                    ],
                    vel / 127
                );
            } else if (cmd == 11) {
                // CONTROL_CHANGE
                if (!MPP.gAutoSustain) {
                    if (note_number == 64) {
                        if (vel > 0) {
                            MPP.pressSustain();
                        } else {
                            MPP.releaseSustain();
                        }
                    }
                }
            } else if (cmd == 14) {
                let pitchMod = evt[1] + (evt[2] << 7) - 0x2000;
                pitchMod = Math.round(pitchMod / 1000);
                pitchBends[channel] = pitchMod;
            }
        }});
        navigator.requestMIDIAccess = JZZ.requestMIDIAccess;
        JZZ.addMidiOut('Neptune MIDI Port #1', this.midiout);
        JZZ.requestMIDIAccess();

    //     this.Player = new MidiPlayer.Player(function(event) {
    //         if (event.name == "Note off" || (event.name == "Note on" && event.velocity === 0)) {
    //             if (event.velocity < 54) return;
    //             MPP.release(keyNameMap[event.noteName]);
    //             if (octave !== 0) {
    //                 for (let i = 1; i <= octave; i++) {
    //                     MPP.release(keyNameMap[Object.keys(keyNameMap)[Object.keys(keyNameMap).indexOf(event.noteName) + (i * 12)]]);
    //                 } 
    //             }
    //         } else if (event.name == "Note on") {
    //             if (event.velocity < 54) return;
    //             var volume = event.velocity/127;
    //             MPP.press(keyNameMap[event.noteName], volume);
    //         }
    //         if (echo !== 0) {
    //             let delay = 30;
    //             for (var j = 0; j < echo; j++) {
    //                 setTimeout(() => {
    //                     volume *= 0.5;
    //                         MPP.press(keyNameMap[event.noteName], volume);
    //                 }, echod * (j + delay));
    //                 delay *= 2;
    //             }
    //         }
    //         if (echo !== 0) {
    //             let delay = 30;
    //             for (let i = 1; i <= this.octave; i++) {
    //                 MPP.press(keyNameMap[Object.keys(keyNameMap)[Object.keys(keyNameMap).indexOf(event.noteName) + (i * 12)]], volume);
    //                 for (var a = 0; a < echo; a++) {
    //                     setTimeout(() => {
    //                         volume *= 0.5;
    //                         MPP.press(keyNameMap[Object.keys(keyNameMap)[Object.keys(keyNameMap).indexOf(event.noteName) + (i * 12)]], volume);
    //                     }, echod * (a + delay));
    //                     delay *= 2;
    //                 }
    //             }
    //         } else if (event.name == "Set tempo") {
                
    //         }
    //     });
    }

    listMIDIs() {
        this.bot.sendChat(`${Object.values(jsonSongs).map(a => a.songName).join(", ")}`);
    }

    async playMIDI(url) {
        try {
            if (!url.includes('https://')) {
                const file = Object.keys(jsonSongs).filter(a => a.includes(url.toLowerCase()));
                if (file === undefined) return this.bot.sendChat('Song not found.');
                let input = /* "https://cors-anywhere3.herokuapp.com/"  + */ jsonSongs[file].url
                let songFileName = jsonSongs[file].songName;

                if (this.player) this.player.stop();
                let data = await fromURL(input);
                let smf = new JZZ.MIDI.SMF(data);
                let output = JZZ().openMidiOut('Neptune MIDI Port #1');
                this.player = smf.player();
                this.player.connect(output);
                this.player.play();
                this.isPlaying = true;
        
                songTime = formatTime(this.player.durationMS());
                numTracks = this.player.tracks();
        
                this.bot.sendChat(`Playing ${songFileName} [${songTime}] | Tracks: ${numTracks}.`);
                this.player.onEnd(() => {
                    this.isPlaying = false;
                });
            } else {
                if (this.player) this.player.stop();
                let data = await fromURL(/* "https://cors-anywhere3.herokuapp.com/" + */ url);
                let smf = new JZZ.MIDI.SMF(data);
                let output = JZZ().openMidiOut('Neptune MIDI Port #1');
                this.player = smf.player();
                this.player.connect(output);
                this.player.play();
                this.isPlaying = true;
        
                songTime = formatTime(this.player.durationMS());
                numTracks = this.player.tracks();
        
                this.bot.sendChat(`Playing MIDI... [${songTime}] | Tracks: ${numTracks}.`);
                this.player.onEnd(() => {
                    this.isPlaying = false;
                });
            }
        } catch(err) {
            this.bot.sendChat(err);
        }
    }

    async playMIDIFromData(data, fileName) {
        try {
            if (this.player) this.player.stop();
            let smf = new JZZ.MIDI.SMF(data);
            let output = JZZ().openMidiOut('Neptune MIDI Port #1');
            this.player = smf.player();
            this.player.connect(output);
            this.player.play();
            this.isPlaying = true;
    
            songTime = formatTime(this.player.durationMS());
            numTracks = this.player.tracks();
    
            this.bot.sendChat(`Playing ${fileName} [${songTime}] | Tracks: ${numTracks}.`);

            this.player.onEnd(() => {
                this.isPlaying = false;
                this.bot.sendChat(`Finished playing (End of file)`);
            });
        } catch(err) {
            this.bot.sendChat(err);
        }
    }

    stopMIDI() {
        if (this.isPlaying) {
            this.player.stop();
            this.bot.sendChat("Stopping music...");
            this.isPlaying = false;
        }
    }

    pauseMIDI() {
        this.player.pause();
        this.bot.sendChat("Pausing music...");
        this.isPlaying = false;
    }

    resumeMIDI() {
        this.player.resume();
        this.bot.sendChat("Resuming music...");
        this.isPlaying = true;
    }
}

module.exports = Player;