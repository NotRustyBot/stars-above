import { Assets, Container, Graphics, Sprite } from "pixi.js";
import { game } from "./game";
import { Vector } from "./types";
import { OutlinedPolygon } from "./outlinedPolygon";
import { LightMask } from "./lightMask";
import ghostPolygon from "./ghost.json";
import path from "./testPath.json";
import { GhostMissile } from "./ghostMissile";
import { Flak } from "./flak";
import { TrackingMode } from "./camera";

export class Ghost {
    sprite: Sprite;
    container: Container;
    graphics: Graphics;
    gunA: Sprite;
    gunB: Sprite;

    outlinedPolygon: OutlinedPolygon;
    lightMask: LightMask;
    lightMaskGunA: LightMask;
    lightMaskGunB: LightMask;

    position = new Vector(0, 5000);
    velocity = new Vector(1, 0);

    phase = 0;

    constructor() {
        this.container = new Container();
        this.sprite = new Sprite(Assets.get("ghost"));
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(3);
        this.graphics = new Graphics();
        this.container.addChild(this.graphics);
        this.container.addChild(this.sprite);
        game.realContainer.addChild(this.container);

        this.gunA = new Sprite(Assets.get("ghost_gun"));
        this.gunB = new Sprite(Assets.get("ghost_gun"));
        this.gunA.anchor.set(0.85, 0.5);
        this.gunB.anchor.set(0.85, 0.5);
        this.gunA.scale.set(3);
        this.gunB.scale.set(3);
        this.gunA.x = -900;
        this.gunB.x = -100;
        this.container.addChild(this.gunA);
        this.container.addChild(this.gunB);

        const usePolygon = ghostPolygon.map((v) => new Vector(v.x * 3, v.y * 3));

        this.outlinedPolygon = new OutlinedPolygon(usePolygon, this.graphics);

        this.lightMask = new LightMask(this.sprite);
        this.lightMaskGunA = new LightMask(this.gunA);
        this.lightMaskGunB = new LightMask(this.gunB);
        this.container.rotation = 2;

        this.position.set(path[0].x, path[0].y);
        console.log(this.position);
    }

    timer = 0;
    pathPoint = 1;
    flakCooldown = 0;
    useSpeed = 20;
    invisibilityBoost = 4;
    isVisible = true;

    get nextPosition() {
        return path[this.pathPoint % path.length]
    }

    update(dt: number) {
        const direction = this.position.diff(this.nextPosition).normalize(1);
        this.velocity.normalize().add(direction).normalize(this.useSpeed * this.invisibilityBoost);
        this.position.add(this.velocity.result().mult(-dt));

        if (this.position.distanceSquared(this.nextPosition) < 5000 ** 2) {
            this.pathPoint++;
        }

        this.container.rotation = this.velocity.toAngle();

        this.container.position.set(this.position.x, this.position.y);
        // this.outlinedPolygon.draw(dt);
        this.lightMask.update(this.position, this.container.rotation);
        this.lightMaskGunA.update(this.position, this.container.rotation + this.gunA.rotation);
        this.lightMaskGunB.update(this.position, this.container.rotation + this.gunB.rotation);

        this.timer += dt / 60;
        if (this.missilesToFire == 0 && this.timer > 0.2 && !game.timeManager.isCheeze) {
            this.missilesToFire = 3;
            this.timer = 0;
        }

        const dsq = game.player.position.distanceSquared(this.position);
        this.flakCooldown -= dt / 60;

        if (dsq < 10000 ** 2) this.isVisible = true;
        if (dsq > 15000 ** 2) this.isVisible = false;

        if (this.isVisible) {
            game.camera.mode = TrackingMode.playerAndTarget;
            game.camera.target = this;
            this.container.alpha = 1;
            this.invisibilityBoost = 1;
            this.considerMissiles();
        } else {
            this.container.alpha = 0;
            this.invisibilityBoost = 20;
        }

        if (dsq < 5000 ** 2) {
            const finalAngle = game.player.position
                .result()
                .add(game.player.velocity.result().mult(Math.sqrt(dsq) / 100))
                .diff(this.position)
                .toAngle();

            this.gunA.rotation = -this.container.rotation + finalAngle + Math.PI;
            this.gunB.rotation = -this.container.rotation + finalAngle + Math.PI;

            if (this.flakCooldown <= 0) {
                this.flakCooldown = 0.5;
                this.fireFlak(finalAngle);
            }
        }
    }

    missilesToFire = 0;
    considerMissiles() {
        if (this.missilesToFire > 0) {
            if (game.music.isGoodBeat && game.music.isBeat) {
                this.missilesToFire--;
                this.fireMissile(-1, this.missilesToFire);
                this.fireMissile(1, this.missilesToFire);
            }
        }
    }

    fireFlak(angle: number) {
        const flak = new Flak();
        flak.position = this.position.result();
        flak.velocity = Vector.fromAngle(angle + 0.3 * (Math.random() - 0.5)).mult(100);
    }

    fireMissile(direction: number, mag: number = 1) {
        const missile = new GhostMissile();
        const angle = this.container.rotation + (direction * Math.PI) / 2;
        const offset = new Vector(0, ((mag % 3) * 80 + 100) * direction).rotate(angle);
        missile.position = this.position.result();
        const facing = Vector.fromAngle(angle);
        missile.position.add(offset).add(facing.result().mult(800));
        const flying = Vector.fromAngle(angle + direction * ((mag % 3) - 1));
        missile.velocity = flying.result().mult(50);
        missile.trail.teleport(missile.position.result());
    }
}
