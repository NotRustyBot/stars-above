import { Assets, Container, Sprite } from "pixi.js";
import { Vector } from "./types";
import { game } from "./game";

export class LightMask {
    target: Container;
    mask: Sprite;
    constructor(target: Container) {
        this.target = target;
        this.mask = new Sprite(Assets.get("gradient"));
        target.mask = this.mask;
        this.mask.anchor.set(0.5, 0.5);
        this.mask.width = Math.max(target.width, target.height) * 1.5;
        this.mask.height = Math.max(target.width, target.height) * 1.5;
        target.addChild(this.mask);
    }

    update(position: Vector, rotation: number) {
        this.mask.rotation = (position.diff(game.stars[0].position).toAngle() + Math.PI - rotation);
    }
}
