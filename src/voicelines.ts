import { game } from "./game";

const voicelines: Record<string, string> = {
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
};

const characters: Record<string, { name: string; color: number }> = {
    i: { name: "Instructor", color: 0x999999 },
    r: { name: "Robot", color: 0xffaaaa },
    s: { name: "Scientist", color: 0xaaaaff },
    a: { name: "System", color: 0xff0000 },
    p: { name: "Psychologist", color: 0xffaa00 },
    c: { name: "Customer", color: 0xaaaaaa },
    t: { name: "Teller", color: 0x99ff99 },
};

export class Voicelines {
    isSaying = false;
    say(id: string) {
        const line = voicelines[id];
        const character = id[id.length - 1];
        console.log(character);

        if (line) {
            if (this.isSaying) {
                this.queue.push(id);
            } else {
                const audio = new Howl({ src: "./voices/" + id + ".ogg" });
                audio.play();
                this.isSaying = true;
                audio.once("end", () => {
                    this.isSaying = false;
                    game.ui.clearSubtitles();
                    this.next();
                });
                game.ui.say(line, characters[character].name, characters[character].color);
            }
        }
    }

    next() {
        if (this.queue.length > 0) {
            this.say(this.queue.shift()!);
        }
    }

    queue: Array<string> = [];
}
