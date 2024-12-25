import { Assets, Graphics, Sprite } from "pixi.js";
import { game } from "./game";
import { Vector, Vectorlike } from "./types";
import { Trail } from "./trail";
import { clamp } from "./utils";
import { Polygon } from "detect-collisions";
import { OutlinedPolygon } from "./outlinedPolygon";
import { LightMask } from "./lightMask";

export class Civilian {
    sprite: Sprite;
    graphics: Graphics;
    position: Vector;
    velocity = new Vector(1, 0);
    path: Vectorlike[];

    readonly fullSpeed = 40;
    useSpeed = this.fullSpeed;
    pathPoint = 0;

    late = 0;

    trail = new Trail(10, 10);

    hitbox: Polygon;
    outlinedPolygon: OutlinedPolygon;
    lightMask: LightMask;
    get nextPosition() {
        return this.path[this.pathPoint % this.path.length];
    }

    remove() {
        this.graphics.destroy();
        this.sprite.destroy();
        game.civilians.delete(this);
        game.system.remove(this.hitbox);
        this.trail.detach();
    }

    danger = false;
    index = 0;

    update(dt: number) {
        if (this.position.distanceSquared(this.nextPosition) < 100 ** 2) {
            this.pathPoint++;
        }

        const nearestStation = game.stations.sort((a, b) => a.position.distanceSquared(this.position) - b.position.distanceSquared(this.position))[0];
        const nstDistSq = nearestStation.position.distanceSquared(this.position);

        const plyDistSq = game.player.position.distanceSquared(this.position);

        if (plyDistSq < 2000 ** 2) {
            const path = game.player.position.diff(this.position).normalize(1).distance(this.velocity.result().normalize(1));
            if (path > 0.5) {
                if ((plyDistSq < 1000 ** 2 && path < 0.3) || plyDistSq < 500 ** 2) {
                    this.danger = true;
                }
            } else {
                this.danger = false;
            }
        } else {
            this.danger = false;
        }

        if (nstDistSq < nearestStation.coridoorRadius ** 2) {
            this.danger = false;
        }

        if (this.danger && nstDistSq > 1500 ** 2) {
            this.useSpeed = 0.01;
        } else {
            this.useSpeed = this.fullSpeed;
        }

        this.late += this.fullSpeed - this.useSpeed;

        if (nstDistSq < nearestStation.coridoorRadius ** 2) this.useSpeed *= 0.75;

        if (this.late > 0) {
            this.useSpeed *= clamp(this.late / 1000, 1, 1.25);
        }

        const direction = this.position.diff(this.nextPosition).normalize(0.1);

        if (this.velocity.normalize().distanceSquared(direction.result().normalize()) > 0.1) {
            this.useSpeed *= 0.5;
        }

        this.velocity.normalize().add(direction).normalize(this.useSpeed);
        this.position.add(this.velocity.result().mult(-dt));

        this.sprite.rotation = this.velocity.toAngle() - Math.PI / 2;

        this.sprite.position.set(this.position.x, this.position.y);
        this.graphics.position.set(this.position.x, this.position.y);
        this.graphics.rotation = this.sprite.rotation;
        this.trail.update(dt, this.position, this.sprite.rotation);
        this.outlinedPolygon.draw(dt);
        this.lightMask.update(this.position, this.sprite.rotation);

        if (nstDistSq > 1500 ** 2) {
            this.hitbox.rotate(this.sprite.rotation);
            this.hitbox.setPosition(this.position.x, this.position.y);
            this.hitbox.group = 0x7fffffff;
        } else {
            this.hitbox.group = 0;
        }

        if (game.camera.view.clone().pad(this.sprite.width * 2).contains(this.position.x, this.position.y)) {
            this.sprite.visible = true;
        } else {
            this.sprite.visible = false;
        }
    }

    static create(sprite: string, path: Vectorlike[], polygon: Vectorlike[], offset = 0) {
        const civilian = new Civilian();
        civilian.index = game.civilians.size;
        game.civilians.add(civilian);
        civilian.path = path;
        const nodeIndex = this.getPercenthNode(path, offset);
        const node = path[nodeIndex];
        civilian.pathPoint = nodeIndex;
        civilian.position = new Vector(node.x, node.y);
        civilian.sprite = new Sprite(Assets.get(sprite));
        game.objectContainer.addChild(civilian.sprite);
        civilian.sprite.anchor.set(0.5, 0.5);
        civilian.trail.teleport(civilian.position.result());
        civilian.hitbox = game.system.createPolygon(civilian.position, polygon);
        civilian.graphics = new Graphics();
        game.objectContainer.addChild(civilian.graphics);
        civilian.outlinedPolygon = new OutlinedPolygon(
            polygon.map((v) => new Vector(v.x, v.y)),
            civilian.graphics
        );
        civilian.lightMask = new LightMask(civilian.sprite);
    }

    static getPercenthNode(path: Vectorlike[], percent: number) {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            length += Vector.fromLike(path[i]).distance(path[i + 1]);
        }
        let current = 0;
        for (let i = 0; i < path.length - 1; i++) {
            current += Vector.fromLike(path[i]).distance(path[i + 1]);
            if (current > length * percent) return i;
        }
    }
}
