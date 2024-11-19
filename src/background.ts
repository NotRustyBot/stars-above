import { Graphics } from "pixi.js";
import { game } from "./game";

export class Background {
    graphics: Graphics;
    color = 0x111111;
    constructor() {
        this.graphics = new Graphics();
        game.backgroundContainer.addChild(this.graphics);
    }

    draw() {
        this.graphics.clear();
        this.graphics.rect(0, 0, window.innerWidth, window.innerHeight).fill(this.color);
    }
}
