import { Graphics } from "pixi.js";
import { game } from "./game";
import { interpolateColors } from "./utils";

export class Background {
    graphics: Graphics;
    color = 0x111111;
    nightmareColor = 0x110909;
    currentColor = 0x111111;
    constructor() {
        this.graphics = new Graphics();
        game.backgroundContainer.addChild(this.graphics);
    }

    fateToNightmare(ratio: number) {
        this.currentColor = interpolateColors(this.nightmareColor, this.currentColor, ratio).toNumber();
    }

    flash() {
        this.currentColor = 0xffffff;
    }

    draw() {
        this.graphics.clear();
        this.graphics.rect(0, 0, window.innerWidth, window.innerHeight).fill(this.currentColor);
    }
}
