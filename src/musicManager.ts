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
    };

    sounds = {
        zoom: new Howl({ src: "./music/zoom.ogg", volume: 0, loop: true, autoplay: true }),
        money: new Howl({ src: "./music/money.ogg", volume: 0.25 }),
    };

    chill = new Array<Track>();
    action = new Array<Track>();
    currentFamily: Array<Track>;
    beatTrack?: Track;
    constructor() {
        this.beatTrack = this.music.rocky;
        this.beatTrack.targetVolume = 1;
        this.beatTrack.howl.seek(0.1);
        this.beatTrack.howl.play();
        this.chill.push(this.music.bour);
        this.chill.push(this.music.short);
        this.chill.push(this.music.rocky);
        this.action.push(this.music.awaitingGhost);
        this.currentFamily = this.chill;
    }

    get isBeat() {
        if (this.beatTrack) {
            return this.beatTrack.isBeat;
        }
        return false;
    }

    get sinceBeat() {
        if (this.beatTrack) {
            return this.beatTrack.sinceBeat;
        }
        return 0;
    }

    get isGoodBeat() {
        if (this.beatTrack) {
            return this.beatTrack.isGoodBeat;
        }
        return false;
    }

    get beat() {
        if (this.beatTrack) {
            return this.beatTrack.beat;
        }
        return 0;
    }

    update(dt: number) {
        for (const track of Object.values(this.music)) {
            track.update(dt);
        }

        if (this.beatTrack.howl.seek() == 0) {
            this.beatTrack.howl.stop();
            this.beatTrack = pickRandom(this.currentFamily);
            this.beatTrack.howl.play();
            this.beatTrack.targetVolume = 1;
        }

        if (this.beatTrack.howl.seek() >= this.beatTrack.howl.duration() - 3) {
            this.beatTrack.targetVolume = 0;
        }

        if (game.voice.isSaying) {
            this.beatTrack.targetVolume = 0.2;
        } else {
            this.beatTrack.targetVolume = 1;
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
        const updateSpeed = 0.01;
        while (this.staticUpdate > 1) {
            this.staticUpdate -= 1;
            this.howl.volume(this.targetVolume * updateSpeed + this.howl.volume() * (1 - updateSpeed));
        }

        const currentSeek = this.howl.seek();
        this.isBeat = Math.floor(currentSeek / (60 / this.bpm)) != this.beat;
        this.previousSeek = currentSeek;
    }
}
