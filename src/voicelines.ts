import { game } from "./game";

const voicelines: Record<string, string> = {
    "1b": `A drink? Coming right up!`,
    "2b": `Back for another one I see. Here.`,
    "3b": `A long day, huh? I don't have solutions, but I do have booze.`,
    "4b": `Want something strong? Alright.`,
    "5b": `I think you had enough, friend.`,
    "1a": `You are in a restricted area. Leave immediately. Your license has been revoked.`,
    "2a": `You are in a restricted area. Leave immediately. You have been fined.`,
    "3a": `You are operating without a license. You have been fined.`,
    fgc: `Hello, can you pick me up from the Gate?`,
    fic: `Hello, I need a ride. I'm at IVA.`,
    fbc: `Hello, I'm calling from Blob.`,
    tgc: `Can you get me to the Gate?`,
    tic: `I need a ride to the IVA.`,
    tbc: `I need to get to the Blob.`,
    "1t": `Sir, please don't write anything else on the form, just fill out the fields.`,
    "2t": `Please pick ONE of the options`,
    "3t": `Ehm. Your signature, please.`,
    "4t": `Looks good. Let me process this for you.`,
    "5t": `I'm afraid you already owe us too much. We can't give you another loan.`,
    "6t": `Ehm. You can't afford to pay back the loan, sir.`,
    "7t": `Sir, I think there's been a mistake, you don't owe us any money.`,
    "1i": `There is nothing complicated about flying a taxi. Fly me near that star satelite. Follow the yellow marker.`,
    "2i": `See? Nothing to worry about. Now, take me to the Blob Station. That's the red marker.`,
    "3i": `When apporaching stations, pay attention to the buoys. Follow the green ones, don't cross the red ones.`,
    "3ai": `No, nononono. Go to the GREEN buoys. So we don't have to pay a fine.`,
    "4i": `Alright, I'll get off here. Before you start ferrying customers, make sure to get the license. Also don't forget to renew, it expires quickly.`,
    "5r": `Hello. I need to be delivered to IVA, the blue station.`,
    "6r": `Be advised, asteroid belt on route.`,
    "7r": `Destination reached. Initiating payment.`,
    "8s": `Hello, is this the taxi service? Great. I am on Blob right now. I need a ride to the Gate. See you in a bit.`,
    "9s": `Here you are! Get me to the Gate. I need to pick up a package, and then you can take me to Star Satelite, okay?`,
    "10s": `Me and my assistant are working on The Wave effect. There seems to be some frequency connecting everything, you know?`,
    "11s": `One moment... Okay I got the package. To the Star Satelite, please.`,
    "12s": `Actually, we may need a pilot to run an experiment in a distant star cluster. You seem like the right one.`,
    "13s": `Thanks. Here's a tip. I'll let you know about the experiment.`,
    "14p": `Oh. Its you. Getting back on your feet, I see. Father's old Crow still got some life in it, eh? Take me to the bank.`,
    "15p": `I've heard the scientist wants to send you somewhere far away for an experiment or something? A one way trip.`,
    "16p": `I suppose it's not like anyone would be waiting for you anyway. Just this old thing, food paste, and unpaid bills. And that's if the pirates don't do anything crazy, again.`,
    "17p": `I'll be a while. I'll call you when I'm done.`,
    "18p": `Hey, I'm done in the bank. I need a ride to the gate.`,
    "19p": `The gate. Quick.`,
    "20p": `I assume you haven't heard, but they just lost a nearby base, presumably to the "Ghost".`,
    "21p": `That's what they suspect what caused that blackout recenlty. Electronic countermeasuers or something.`,
    "22p": `Thank you. Hey, take care of yourself, alright?`,
    "23i": `Um, hey, there's been some comotion, and now there's a military cruiser, asking us to shuttle their personell around the sector. You should see it's signal from the IVA.`,
    "24m": `Alright, listen up. The pirate ship, Ghost, appears to head this way. Pick up one of our lookouts.`,
    "25m": `This one goes to the Gate. This is NOT an emergency, by the way. Follow the rules, get paid the usual rate.`,
    "26m": `The Ghost is just an big'ol cargo ship with a couple of potato cannons. But it's filled to the brim with radar jamming tech.`,
    "27m": `Done? Good. Link up with us. Follow our beacon, we're near Blob.`,
    "28m": `Drop 'em off right here at the Blob.`,
    "29m": `Come pick up the last one, near the Gate.`,
    "30m": `This one goes to Iva.`,
    "31m": `Did we do that in the wrong order? oh well.`,
    "32m": `Everybody in position? Okay, start up the scanners. Let's take a look.`,
    "33m": `OH WHAT THEY ARE ALREADY HERE!`,
    "34m": `Load the main caliber! Get the targeting going! What's with the signal? Hello? [static]`,
    "35m": `Their signal jamming is better than expected, we can't target them like this...`,
    "36m": `Okay. Plan B. We'll eyeball it. Stay near the Ghost, keep it visible.`,
    "37m": `Can't see it.`,
    "38m": `A-and its gone.`,
    "39m": `Okay, safety off! GET CLEAR!`,
    "40s": `Oh hello. You're alive. They left. Everyone left. It's just me now. And you. It's so quiet now, you can almost hear the stars whisper. Mind taking me to the Gate?`,
    "41s": `Your ship looks... expensive to repair. Surely you can afford that, right?`,
    "42s": `Anyway, they greenlit my experiment. You can be the pilot.`,
    "43s": `Have you ever had a feeling, that there is a certain rythm to it all? I think there is. But the noise is too loud, so you can't hear the rythm.`,
    "44s": `But if you go far away from all the noise, I think you could hear it. I think it's possible to hear the rythm. That's the experiment.`,
    "45s": `So, are you interested? I cannot gurantee that you return. In fact, I can gurantee the opposite. Sign here.`,
    I1n: `In 1977, two copies of the Golden record were send to space, designed to be read by extra-terrestrial life. They contained sounds, music, and images, some of which you can see now. Interestingly enough, not all the images are public domain. Meaning the first interaction that an otherwordly civilisation may have with us, could be copyright infringement.`,
    S1n: `The Crow Who Listened to Stars`,
    S2n: `In the deep night, a crow spread its wings and flew from star to star, listening.`,
    S3n: `The crow flew to a golden star. `,
    S4x: `Oh, look!`,
    S5n: `the star sparkled.`,
    S6ax: `I am covered in the most beautiful shimmering dust! It catches my light and makes everything around me glitter. `,
    S6bx: `Can you see how it dances? How it twirls? I am so excited by this tiny, wonderful thing!`,
    S7n: `Next, the crow approached a silver star.`,
    S8x: `You've come,`,
    S9n: `it whispered, its light trembling.`,
    S10x: `I hover here, so far from everything. Once, I had a cluster of stars around me, but they have all drifted away. Now I am here, alone, with nothing but my own quiet light.`,
    S11n: `The crow stayed for a little.`,
    S12n: `The crow glided to a reddish star.`,
    S13x: `I did something terrible`,
    S14n: `the star murmured.`,
    S15x: `I was hungry, so I ate one of my own planets. Whole and complete, it disappeared into me. Now I can taste its memories, and I cannot forget what I have done.`,
    S16n: `The crow flew to small white star.`,
    S17x: `Look how vast everything is,`,
    S18n: `it said softly.`,
    S19x: `So much what can't be seen or understood. I am so small, and the night is so big.`,
    S20n: `The star fell silent, filled with deep stillness.`,
    S21n: `Softly, the crow approached a pale blue star.`,
    S22x: `I keep shining,`,
    S23n: `the star said quietly.`,
    S24x: `Even when darkness surrounds me, even when no one sees me. I do not promise anything will change. I simply continue.`,
    S25n: `The crow listened, dark eyes reflecting each star's story. And in the silence that followed, the crow burrows into thought`,
    S26n: `What star lives inside me tonight?`,
};

export const characters: Record<string, { name: string; color: number }> = {
    i: { name: "Instructor", color: 0x999999 },
    r: { name: "Robot", color: 0xffaaaa },
    s: { name: "Scientist", color: 0xaaaaff },
    a: { name: "System", color: 0xff0000 },
    p: { name: "Psychologist", color: 0xffaa00 },
    c: { name: "Customer", color: 0xaaaaaa },
    t: { name: "Teller", color: 0x99ff99 },
    b: { name: "Bartender", color: 0xff99ff },
    m: { name: "Commander", color: 0x33aa33 },
    n: { name: "Narrator", color: 0x999999 },
    x: { name: "Star", color: 0xffff00 },
};

export class Voicelines {
    isSaying = false;
    characterId = "";
    say(id: string) {
        const line = voicelines[id];
        const character = id[id.length - 1];

        if (line) {
            if (this.isSaying) {
                this.queue.push(id);
            } else {
                this.characterId = character;
                const audio = new Howl({ src: "./voices/" + id + ".ogg" });
                this.isSaying = true;
                audio.once("end", () => {
                    this.isSaying = false;
                    game.ui.clearSubtitles();
                    this.next();
                });
                audio.play();
                game.ui.say(line, characters[character].name, characters[character].color);
            }
        }
    }

    forceEnd(){
        this.isSaying = false;
        game.ui.clearSubtitles();
        this.next();
    }

    next() {
        if (this.queue.length > 0) {
            this.say(this.queue.shift()!);
        }
    }

    queue: Array<string> = [];
}
