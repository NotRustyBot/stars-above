import { game } from "./game";
import { Vector } from "./types";

export class Beacon {

    position = new Vector(0, 0);
    color = 0xffffff;
    range = 10000;

    constructor(color: number) {
        this.color = color;
        game.player.signals.push(this);
    }

    remove() {
        game.player.signals = game.player.signals.filter((s) => s != this);
    }
}