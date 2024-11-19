import { Container, Graphics, Rectangle } from "pixi.js";
import { Vector } from "./types";
import { game } from "./game";
import { Polygon } from "detect-collisions";
import { LightMask } from "./lightMask";
import { OutlinedPolygon } from "./outlinedPolygon";

export class Asteroid {
    position = new Vector(0, 0);
    velocity = new Vector(0, 0);
    graphics = new Graphics();
    container = new Container();
    outline = new Graphics();
    radius = 0;
    polygon = new Array<Vector>();

    mask: LightMask;
    hitbox: Polygon;
    outlinedPolygon: OutlinedPolygon;

    constructor(radius = 100) {
        this.graphics = new Graphics();
        game.objectContainer.addChild(this.container);
        this.container.addChild(this.graphics);
        this.container.addChild(this.outline);

        this.radius = radius;
        this.polygon = this.createPolygon(this.radius, radius ** 0.5);
        this.hitbox = game.system.createPolygon(this.position, this.polygon);
        let skip = true;
        for (const point of this.polygon) {
            if (skip) {
                this.graphics.moveTo(point.x, point.y);
                skip = false;
            } else {
                this.graphics.lineTo(point.x, point.y);
            }
        }
        this.graphics.closePath();

        this.graphics.stroke({ color: 0xffffff, width: 4, alpha: 0.5, cap: "round" });
        this.graphics.fill({ color: 0xffffff, alpha: 0.15 });

        this.mask = new LightMask(this.graphics);
        this.mask.mask.width = this.radius * 3;
        this.mask.mask.height = this.radius * 3;

        this.outlinedPolygon = new OutlinedPolygon(this.polygon, this.outline);
    }

    createPolygon(radius: number, points: number) {
        const polygon = new Array<Vector>();
        for (let index = 0; index < points; index++) {
            const angle = ((Math.PI * 2) / points) * index + (Math.PI / points) * Math.random();
            const point = Vector.fromAngle(angle)
                .mult(radius * Math.random() * 0.5 + radius * 0.75)
                .add(this.position);
            polygon.push(point);
        }
        return polygon;
    }

    update(dt: number) {
        if (game.camera.view.clone().pad(this.radius * 2).contains(this.position.x, this.position.y)) {
            this.container.visible = true;
        } else {
            this.container.visible = false;
            return;
        }
        this.container.position.set(this.position.x, this.position.y);
        this.hitbox.setPosition(this.position.x, this.position.y);
        this.hitbox.updateBody();
        this.mask.update(this.position, this.graphics.rotation);
        this.outlinedPolygon.draw(dt);
    }
}
