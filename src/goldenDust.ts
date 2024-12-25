import { Assets, Graphics, Sprite } from "pixi.js";
import { game } from "./game";
import { Vector } from "./types";

export class GoldenDust {
    graphics: Graphics;
    glow: Sprite;

    position = new Vector(0, 0);

    rotation = 0;

    constructor() {
        this.graphics = new Graphics();
        game.objectContainer.addChild(this.graphics);
        this.graphics.rect(-20, -25, 40, 50);
        this.graphics.fill({ color: 0x999944 });
        game.goldenDust.add(this);
        this.glow = new Sprite(Assets.get("light"));
        this.glow.anchor.set(0.5, 0.5);
        this.glow.tint = 0xffff00;
        this.glow.alpha = 0.1;
        game.glowContainer.addChild(this.glow);
        this.rotation = (Math.random() - 0.5) / 100;
    }

    static create(position: Vector) {
        const dust = new GoldenDust();
        dust.position.set(position.x, position.y);
        return dust;
    }

    update(dt: number) {
        this.graphics.position.set(this.position.x, this.position.y);
        this.glow.position.set(this.position.x, this.position.y);
        this.graphics.scale.set(Math.abs(Math.sin(game.time * 0.5) * 0.1) + 1);
        this.graphics.rotation += this.rotation * dt;
        this.glow.rotation = this.graphics.rotation;

        if (game.player.position.distanceSquared(this.position) < 100 ** 2) {
            this.rotation = 0.1;
        }
        if (Math.abs(this.rotation) > 0.05) this.rotation *= 0.99;

        if (Math.abs(this.graphics.rotation % 3) < 0.1) {
            this.glow.scale.set((0.1 - Math.abs(this.graphics.rotation % 3)) * 10, (0.1 - Math.abs(this.graphics.rotation % 3)) * 100);
        } else {
            this.glow.scale.set(0.1);
        }
    }

    remove() {
        game.goldenDust.delete(this);
        this.graphics.destroy();
        this.glow.destroy();
    }
}
