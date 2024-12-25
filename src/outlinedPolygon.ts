import { Assets, Graphics } from "pixi.js";
import { Vector, Vectorlike } from "./types";
import { game } from "./game";

export class OutlinedPolygon {
    graphics: Graphics;
    recentAcceleration = new Vector(0, 0);
    polygonJitter = 10;
    usePolygon = new Array<Vectorlike>();
    accelerationStrech = 0.5;

    constructor(polygon: Vector[], graphics: Graphics) {
        this.usePolygon = polygon;
        this.graphics = graphics;
        this.drawPolygon();
    }

    drawSkipFrames = 60 / 10;
    drawFrameSkip = 0;

    draw(dt: number) {
        3;
        if (game.camera.zoom < 0.2) return;
        this.drawFrameSkip += dt;
        while (this.drawFrameSkip > this.drawSkipFrames) {
            this.drawFrameSkip -= this.drawSkipFrames;
            this.drawPolygon();
        }
    }

    updateAcceleration(acceleration: Vector) {
        const recencyFalloff = 10;
        this.recentAcceleration.x = (acceleration.x + this.recentAcceleration.x * recencyFalloff) / (recencyFalloff + 1);
        this.recentAcceleration.y = (acceleration.y + this.recentAcceleration.y * recencyFalloff) / (recencyFalloff + 1);
    }

    drawPolygon() {
        this.graphics.clear();

        this.outlinePolygon();
        this.graphics.stroke({ color: game.stars[0].color, width: 4, alpha: 0.5, cap: "round" });

        const matrix = this.graphics.getTransform();
        matrix.scale(2, 2);
        this.graphics.fill({ color: game.stars[0].color, texture: Assets.get("hash"), matrix, alpha: 0.15 });

        this.outlinePolygon();
        this.graphics.stroke({ color: game.stars[0].color, width: 2, cap: "round" });
    }

    private outlinePolygon() {
        let skip = true;
        for (const point of this.usePolygon) {
            const randomX = Math.random() * this.polygonJitter - this.polygonJitter / 2;
            const randomY = Math.random() * this.polygonJitter - this.polygonJitter / 2;

            const accelX = this.recentAcceleration.x * this.accelerationStrech * Math.abs(point.x) * -1.5;
            const accelY = this.recentAcceleration.y * this.accelerationStrech * Math.abs(point.y) * -1;

            if (skip) {
                this.graphics.moveTo(point.x + randomX + accelX, point.y + randomY + accelY);
                skip = false;
            } else {
                this.graphics.lineTo(point.x + randomX + accelX, point.y + randomY + accelY);
            }
        }
        this.graphics.closePath();
    }
}
