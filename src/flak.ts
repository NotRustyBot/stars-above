import { Graphics } from "pixi.js";
import { Vector } from "./types";
import { game } from "./game";
import { TrailedParticle } from "./trailedParticle";
import { Point, Response } from "detect-collisions";

export class Flak {
    graphics: Graphics;

    position = new Vector(0, 0);
    velocity = new Vector(0, 0);
    hitbox: Point;
    life = 3;

    constructor() {
        this.graphics = new Graphics();
        game.objectContainer.addChild(this.graphics);
        this.graphics.circle(0, 0, 20);
        this.graphics.fill({ color: 0xffffff });
        this.graphics.moveTo(0, 0);
        this.graphics.lineTo(-400, 0);
        this.graphics.stroke({ color: 0xffffff, alpha: 0.15, width: 60, cap: "round" });
        game.flak.add(this);
        this.hitbox = game.system.createPoint(this.position);
    }

    update(dt: number) {
        this.life -= dt / 60;
        this.graphics.position.set(this.position.x, this.position.y);
        this.position.add(this.velocity.result().mult(dt));
        this.graphics.rotation = this.velocity.toAngle();
        this.graphics.scale.set(Math.abs(Math.sin(game.time * 0.5) * 0.1) + 1);

        this.hitbox.setPosition(this.position.x, this.position.y);
        this.hitbox.updateBody();

        if (game.player.position.distanceSquared(this.position) < 300 ** 2) {
            game.player.velocity.add(this.position.diff(game.player.position).normalize(-100));
            this.remove();
            return true;
        }

        game.system.checkOne(this.hitbox, (e: Response) => {
            if (e.b == game.player.hitbox) {
                game.player.velocity.add(this.position.diff(game.player.position).normalize(-100));
            }
            this.remove();
            return true;
        });

        if(this.life <= 0) {
            this.remove();
        }
    }

    remove() {
        game.flak.delete(this);
        this.graphics.destroy();

        for (let index = 0; index < 7; index++) {
            new TrailedParticle(this.position, ((index * Math.PI) / 7) * 2 + Math.random());
        }

        game.system.remove(this.hitbox);
    }
}
