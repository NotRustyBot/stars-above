import { Assets, Graphics, Sprite } from "pixi.js";
import { Vector } from "./types";
import { game } from "./game";

export class Star {
    color: number = 0xffffff;
    position: Vector = new Vector(0, 0);
    gravity = 10000000;

    size = 1000;

    graphics = new Graphics();
    glow = new Sprite();

    plypos = new Array<Vector>();

    constructor() {
        this.glow = new Sprite(Assets.get("light"));
        this.glow.anchor.set(0.5, 0.5);
        this.glow.setSize(this.size * 4);
        this.glow.tint = this.color;
        game.glowContainer.addChild(this.glow);
        game.objectContainer.addChild(this.graphics);
        game.stars.push(this);
    }

    circleSpeed = 0.01;

    update(dt: number) {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.size);
        this.graphics.fill({ color: this.color });
        this.graphics.circle(Math.sin(game.time * 0.1 * this.circleSpeed) * 100, Math.cos(game.time * 0.3 * this.circleSpeed) * 100, this.size * 2.1);
        this.graphics.circle(Math.sin(game.time * -0.4 * this.circleSpeed) * 100, Math.cos(game.time * -0.2 * this.circleSpeed) * 100, this.size * 2.1);
        if (game.music.isGoodBeat) {
            this.graphics.stroke({ color: this.color, alpha: Math.max(0.03 * (1 - game.music.sinceBeat), 0.01), width: 200 });
        } else {
            this.graphics.stroke({ color: this.color, alpha: 0.01, width: 200 });
        }
        this.graphics.position.set(this.position.x, this.position.y);
        this.glow.position.set(this.position.x, this.position.y);

        game.ui.starMask.moveTo(this.position.x, this.position.y);
        game.ui.starMask.lineTo(game.player.position.x, game.player.position.y);
        game.ui.starMask.lineTo(this.position.x, this.position.y);

        game.ui.starMask.stroke({ color: this.color, alpha: 1, width: this.size * 2, cap: "round" });

        game.ui.starMask.moveTo(this.position.x, this.position.y);
        game.ui.starMask.lineTo(game.player.position.x, game.player.position.y);
        game.ui.starMask.lineTo(this.position.x, this.position.y);

        game.ui.starMask.stroke({ color: this.color, alpha: 0.1, width: this.size * 4, cap: "round" });

        if (this.position.distanceSquared(game.player.position) < (this.size * 2) ** 2) {
            game.player.velocity.add(this.position.diff(game.player.position).normalize(-2));
        }
    }
}
