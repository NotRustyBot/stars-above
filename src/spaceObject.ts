import { Assets, Container, Graphics, Sprite } from "pixi.js";
import { Vector, Vectorlike } from "./types";
import { game } from "./game";
import { OutlinedPolygon } from "./outlinedPolygon";
import { LightMask } from "./lightMask";
import { Beacon } from "./beacon";

export class SpaceObject {
    position = new Vector(0, 0);
    velocity = new Vector(0, 0);
    sprite: Sprite;
    graphics: Graphics;
    container: Container;
    outlinedPolygon: OutlinedPolygon;
    mask: LightMask;
    beacon?: Beacon;
    constructor(sprite: string, position: Vector, polygon: Vectorlike[], polygonImportScale: number) {
        this.position.set(position.x, position.y);
        this.sprite = new Sprite(Assets.get(sprite));
        this.sprite.anchor.set(0.5, 0.5);
        this.graphics = new Graphics();
        this.container = new Container();
        const usePolygon = polygon.map((v) => new Vector(v.x * polygonImportScale, v.y * polygonImportScale));
        this.outlinedPolygon = new OutlinedPolygon(usePolygon, this.graphics);
        this.container.addChild(this.graphics);
        this.container.addChild(this.sprite);
        game.objectContainer.addChild(this.container);
        this.mask = new LightMask(this.sprite);

        game.spaceObjects.push(this);
    }


    update (dt: number) {
        this.position = this.position.add(this.velocity.result().mult(dt));
        this.container.position.set(this.position.x, this.position.y);
        this.outlinedPolygon.draw(dt);
        this.mask.update(this.position, this.container.rotation);

        if(this.beacon) this.beacon.position.set(this.position.x, this.position.y);
    }
}