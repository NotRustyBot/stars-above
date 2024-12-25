import { Assets, Sprite } from "pixi.js";
import { Vector } from "./types";
import { Trail } from "./trail";
import { game } from "./game";
import { TrailedParticle } from "./trailedParticle";
import { TrackingMode } from "./camera";
import { Point, Response } from "detect-collisions";

export class GhostMissile {
    sprite: Sprite;
    glow: Sprite;
    trail: Trail;

    position = new Vector(0, 0);
    velocity = new Vector(0, 0);

    constructor() {
        this.sprite = new Sprite(Assets.get("missile"));
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(3);
        this.glow = new Sprite(Assets.get("light"));
        this.glow.anchor.set(0.5, 0.5);
        this.glow.scale.set(3);
        this.glow.alpha = 0.25;
        this.glow.tint = 0x333333;
        this.sprite.addChild(this.glow);
        game.objectContainer.addChild(this.sprite);
        game.glowContainer.addChild(this.glow);
        game.missiles.add(this);

        this.trail = new Trail(30, 10);
        this.hitbox = game.system.createPoint(this.position);
    }

    stage = 0;
    life = 5;

    targetVelocity = 50;
    targetTargetVelocity = 50;

    hitbox: Point;

    untilCheeze = 0.001;

    update(dt: number) {
        this.life -= dt / 60;
        this.sprite.rotation = this.velocity.toAngle() + Math.PI / 2;
        this.velocity.normalize(this.targetVelocity);
        this.position.add(this.velocity.result().mult(dt));
        this.sprite.position.set(this.position.x, this.position.y);
        this.glow.position.set(this.position.x, this.position.y);
        this.trail.update(dt, this.position, this.sprite.rotation);

        this.hitbox.setPosition(this.position.x, this.position.y);
        this.hitbox.updateBody();
        const plyDistSq = this.position.distanceSquared(game.player.position);

        if (this.stage == 0) {
            if (this.life <= 4.5 && game.music.isGoodBeat && game.music.isBeat) {
                this.stage = 1;
                this.glow.tint = 0xffffff;
            }
        }

        if (this.stage == 1) {
            const toPlayer = game.player.position.diff(this.position).normalize(dt * 1);
            this.velocity.add(toPlayer.result());
            this.targetTargetVelocity = 40;
            this.glow.scale.set((this.life - 2) * 3 + 1);

            if ((this.life <= 2 && game.music.isGoodBeat && game.music.isBeat) || plyDistSq < 1000 ** 2) {
                this.stage = 2;
                this.life = 2;
                this.glow.tint = 0xff0000;
            }
        }

        if (this.stage == 2) {
            this.targetTargetVelocity = 50;
            this.glow.scale.set(this.life * 5 + 1);
            this.glow.alpha = 0.25 + Math.sin(game.time + this.life * 5) * 0.25;
        }

        this.targetVelocity += Math.sign(this.targetTargetVelocity - this.targetVelocity) * 1 * dt;

        if (this.life <= 0 && game.music.isGoodBeat && game.music.isBeat) {
            this.remove();
        }

        if (plyDistSq < 2000 ** 2) {
            const path = game.player.position.diff(this.position).normalize(1).distance(this.velocity.result().normalize(1));
            if (path < 0.5) {
                if (plyDistSq < 1000 ** 2 && path < 0.3 || plyDistSq < 300 ** 2) {
                    if (!this.danger) {
                        game.music.sounds.inhale.play();
                        game.player.velocity.set(0, 0);
                    }
                    this.danger = true;
                }
            } else {
                this.danger = false;
            }
        } else {
            this.danger = false;
        }

        if (this.danger) {
            this.untilCheeze -= dt /60;
            game.timeManager.danger(1);
            game.camera.mode = TrackingMode.playerAndTarget;
            game.camera.target = this;

            if(this.untilCheeze <= 0) {
                for (const miss of game.missiles) {
                    if(miss != this){
                        miss.remove();
                    }
                }
            }
        }

        game.system.checkOne(this.hitbox, (e: Response) => {
            this.remove();
        });
    }

    danger = false;

    remove() {
        game.missiles.delete(this);
        this.sprite.destroy();
        this.glow.destroy();
        this.trail.detach();
        for (let index = 0; index < 7; index++) {
            new TrailedParticle(this.position, ((index * Math.PI) / 7) * 2 + Math.random());
        }
        game.system.remove(this.hitbox);
    }
}
