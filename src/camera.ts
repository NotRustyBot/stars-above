import { Graphics, Rectangle } from "pixi.js";
import { game } from "./game";
import { Vector, Vectorlike } from "./types";

export interface ITrackable {
    position: Vectorlike;
}

export enum TrackingMode {
    playerSoft,
    playerAndTarget,
}

export class Camera {
    position = new Vector();
    smoothPosition = new Vector();
    target?: ITrackable;

    graphics = new Graphics();

    constructor() {
        game.realContainer.addChild(this.graphics);
    }

    mode = TrackingMode.playerSoft;

    targetZoom = 1;

    public set zoom(v: number) {
        game.realContainer.scale.set(v);
    }

    public get zoom(): number {
        return game.realContainer.scale.x;
    }

    get hardwareZoom(): number {
        return window.innerHeight / 1000;
    }

    get view() {
        return new Rectangle(this.position.x - window.innerWidth / this.zoom / 2, this.position.y - window.innerHeight / this.zoom / 2, window.innerWidth / this.zoom, window.innerHeight / this.zoom);
    }

    update(dt: number) {
        //this.graphics.clear();
        //this.graphics.rect(this.view.x, this.view.y, this.view.width, this.view.height).stroke({ color: 0xffaa00, alpha: 0.5, width: 1/ this.zoom });
        const speedLookAhead = game.player.velocity.result().mult(5);
        if (speedLookAhead.length() > 50) {
            speedLookAhead.normalize(50);
        }
        this.position = game.player.visualPosition.result().add(speedLookAhead.mult(5 / this.zoom));
        if (this.mode == TrackingMode.playerSoft) {
            this.targetZoom = Math.max(0.01 * this.hardwareZoom, this.targetZoom);
        }

        if (this.mode == TrackingMode.playerAndTarget && this.target) {
            this.position.add(this.target.position).mult(0.5);
            this.targetZoom = 500 / game.player.visualPosition.distance(this.target.position);
        }

        this.targetZoom = Math.min(0.5 * this.hardwareZoom, this.targetZoom);
        this.zoom = this.zoom * 0.9 + this.targetZoom * 0.1;

        game.music.sounds.zoom.volume(Math.abs(this.zoom - this.targetZoom) * 1);
        game.music.sounds.zoom.rate(1 / this.zoom);

        this.smoothPosition = this.smoothPosition.add(this.position.diff(this.smoothPosition).mult(0.1));

        game.realContainer.position.set(-this.smoothPosition.x * this.zoom + game.app.renderer.width / 2, -this.smoothPosition.y * this.zoom + game.app.renderer.height / 2);
        this.mode = TrackingMode.playerSoft;
    }
}
