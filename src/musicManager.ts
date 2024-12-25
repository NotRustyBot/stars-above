import { Howl } from "howler";
import { pickRandom } from "./utils";
import { game } from "./game";

export class MusicManager {
    music = {
        bour: new Track("./music/bour.ogg", 120, [
            { n: 0, of: 2 },
            { n: 13, of: 16 },
        ]),
        short: new Track("./music/short.ogg", 140, [
            { n: 0, of: 2 },
            { n: 5, of: 8 },
        ]),
        rocky: new Track("./music/rockyStart.ogg", 160, [
            { n: 0, of: 2 },
            { n: 5, of: 8 },
        ]),
        awaitingGhost: new Track("./music/awaitingGhost.ogg", 280, [
            { n: 0, of: 2 },
            { n: 5, of: 8 },
        ]),
        firefight: new Track("./music/firefight.ogg", 360, [
            { n: 0, of: 64 },
            { n: 1, of: 64 },
            { n: 2, of: 64 },
            { n: 3, of: 64 },
            { n: 8, of: 64 },
            { n: 10, of: 64 },
            { n: 16, of: 64 },
            { n: 18, of: 64 },
            { n: 24, of: 64 },
            { n: 26, of: 64 },
            { n: 32, of: 64 },
            { n: 36, of: 64 },
            { n: 48, of: 64 },
            { n: 52, of: 64 },
        ]),
        firefight2: new Track("./music/firefight2.ogg", 280, [
            { n: 0, of: 16 },
            { n: 2, of: 16 },
            { n: 3, of: 16 },
            { n: 4, of: 16 },
            { n: 6, of: 16 },
            { n: 8, of: 16 },
            { n: 10, of: 16 },
            { n: 12, of: 16 },
            { n: 14, of: 16 },

        ]),
    };

    sounds = {
        zoom: new Howl({ src: "./music/zoom.ogg", volume: 0, loop: true, autoplay: true }),
        money: new Howl({ src: "./music/money.ogg", volume: 0.25 }),
        inhale: new Howl({ src: "./music/inhale.ogg", volume: 0.5 }),
        key: new Howl({ src: "./music/key.ogg", volume: 1 }),
        click: new Howl({ src: "./music/click.ogg", volume: 1 }),
        piano1: new Howl({ src: "./music/pianoStinger1.ogg", volume: 0.25 }),
        piano2: new Howl({ src: "./music/pianoStinger2.ogg", volume: 0.25 }),
    };

    chill = new Array<Track>();
    action = new Array<Track>();
    combat1 = new Array<Track>();
    currentFamily: Array<Track>;
    beatTrack?: Track;

    noMusic = false;
    constructor() {
        this.beatTrack = this.music.short;
        this.beatTrack.targetVolume = 1;
        this.beatTrack.howl.seek(0.1);
        this.beatTrack.howl.play();
        this.chill.push(this.music.bour);
        this.chill.push(this.music.short);
        this.chill.push(this.music.rocky);
        this.action.push(this.music.awaitingGhost);
        this.combat1.push(this.music.firefight2);
        this.currentFamily = this.chill;
    }

    get isBeat() {
        if (this.beatTrack && !this.noMusic) {
            return this.beatTrack.isBeat;
        }
        return false;
    }

    get sinceBeat() {
        if (this.beatTrack && !this.noMusic) {
            return this.beatTrack.sinceBeat;
        }
        return 0;
    }

    get isGoodBeat() {
        if (this.beatTrack && !this.noMusic) {
            return this.beatTrack.isGoodBeat;
        }
        return false;
    }

    get beat() {
        if (this.beatTrack && !this.noMusic) {
            return this.beatTrack.beat;
        }
        return 0;
    }

    update(dt: number) {
        for (const track of Object.values(this.music)) {
            track.update(dt);
        }

        if (this.beatTrack.howl.seek() == 0 && !game.story.isNightmare) {
            this.beatTrack.howl.stop();
            this.beatTrack = pickRandom(this.currentFamily);
            this.beatTrack.howl.play();
            this.beatTrack.targetVolume = 1;
        }

        if (this.beatTrack.howl.seek() >= this.beatTrack.howl.duration() - 3) {
            this.beatTrack.targetVolume = 0;
        }

        this.beatTrack.targetVolume = 1;

        if (game.voice.isSaying) {
            this.beatTrack.targetVolume = 0.2;
        }

        if (game.story.isNightmare) {
            this.beatTrack.targetVolume = 0;
        }

        if (game.timeManager.isCheeze) {
            this.beatTrack.targetVolume = 0.1;
        }

        if(this.noMusic){
            this.beatTrack.targetVolume = 0;
        }
    }
}

class Track {
    targetVolume = 0;
    bpm: number;
    howl: Howl;
    previousSeek = 0;
    goodBeats: any;

    constructor(src: string, bpm: number, goodBeats: Array<{ n: number; of: number }>) {
        this.bpm = bpm;
        this.goodBeats = goodBeats;
        this.howl = new Howl({ src: src, volume: 0 });
    }

    get beat() {
        return Math.floor(this.previousSeek / (60 / this.bpm));
    }

    get sinceBeat() {
        return (this.previousSeek / (60 / this.bpm)) % 1;
    }

    get isGoodBeat() {
        for (const goodBeat of this.goodBeats) {
            if (this.nthBeat(goodBeat.n, goodBeat.of)) {
                return true;
            }
        }
        return false;
    }

    nthBeat(n: number, of: number) {
        return this.beat % of == n;
    }

    isBeat = false;

    staticUpdate = 0;
    update(dt: number) {
        this.staticUpdate += dt;
        const updateSpeed = 0.03;
        while (this.staticUpdate > 1) {
            this.staticUpdate -= 1;
            this.howl.volume(this.targetVolume * updateSpeed + this.howl.volume() * (1 - updateSpeed));
        }

        const currentSeek = this.howl.seek();
        this.isBeat = Math.floor(currentSeek / (60 / this.bpm)) != this.beat;
        this.previousSeek = currentSeek;
    }
}
