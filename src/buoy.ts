import { Assets, Container, Graphics, Sprite } from "pixi.js";
import { Vector } from "./types";
import { game } from "./game";
import { OutlinedPolygon } from "./outlinedPolygon";
import buoyPolygon from "./buoy.json";

export class Buoy {
    position: Vector = new Vector(0, 0);
    glow: Sprite;
    sprite: Sprite;
    graphics: Graphics;
    outlinedPolygon: OutlinedPolygon;

    container = new Container();
    color: number;

    constructor(position: Vector, color = 0x00ff00) {
        this.color = color;
        this.position.set(position.x, position.y);
        this.glow = new Sprite(Assets.get("light"));
        game.glowContainer.addChild(this.glow);
        this.glow.alpha = 0.25;
        this.glow.tint = color;
        this.glow.anchor.set(0.5, 0.5);

        this.sprite = new Sprite(Assets.get("buoy"));
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.alpha = 0.5;
        game.objectContainer.addChild(this.container);
        game.buoys.push(this);

        const usePolygon = buoyPolygon.map((v) => new Vector(v.x * 1, v.y * 1));

        this.graphics = new Graphics();
        this.container.addChild(this.sprite);
        this.container.addChild(this.graphics);

        this.outlinedPolygon = new OutlinedPolygon(usePolygon, this.graphics);
    }

    update(dt: number) {
        this.glow.tint = this.color;
        this.glow.position.set(this.position.x, this.position.y - 100);
        this.container.position.set(this.position.x, this.position.y);

        this.outlinedPolygon.draw(dt);

        if (game.music.isBeat && game.music.isGoodBeat) {
            this.glow.visible = !this.glow.visible;
        }
    }

    remove() {
        game.buoys = game.buoys.filter((b) => b != this);
        this.container.destroy();
        this.glow.destroy();
    }
}
