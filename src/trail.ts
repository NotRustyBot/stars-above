import { Graphics } from "pixi.js";
import { Vector, Vectorlike } from "./types";
import { game } from "./game";

export class Trail {
    graphics: Graphics;
    positions = new Array<Vectorlike>();
    length = 100;
    width = 20;
    constructor(length = 30, width = 20) {
        this.length = length;
        this.width = width;
        for (let index = 0; index < this.length; index++) {
            this.positions.push({ x: 0, y: 0 });
        }

        this.graphics = new Graphics();
        game.trailContainer.addChild(this.graphics);
    }

    timer = 0;
    lindex = 0;

    offset = new Vector();

    isDetached = false;

    teleport(position: Vectorlike) {
        this.positions = new Array<Vectorlike>();
        for (let index = 0; index < this.length; index++) {
            this.positions.push({ x: position.x, y: position.y });
        }
    }

    update(dt: number, position?: Vectorlike, rotation?: number) {
        if (position == undefined) position = { x: this.positions[0].x, y: this.positions[0].y };
        if (rotation == undefined) rotation = 0;

        position = Vector.fromLike(position).add(this.offset.result().rotate(rotation));
        const s = dt / 60;
        this.timer += s;

        this.graphics.clear();
        this.graphics.moveTo(position.x, position.y);
        let previous = position;
        const otherSide = [];
        let index = 0;

        for (const position of this.positions) {
            let angle = Math.atan2(position.y - previous.y, position.x - previous.x);
            angle += Math.PI / 2;
            const useWidth = this.width * (1 - index / this.length) + Math.abs(Math.sin(index - this.lindex) * 10);
            const drawPos = Vector.fromAngle(angle).mult(useWidth).add(position);
            const drawPos2 = Vector.fromAngle(angle).mult(-useWidth).add(position);
            otherSide.unshift(drawPos2);
            this.graphics.lineTo(drawPos.x, drawPos.y);
            previous = position;
            index++;
        }

        for (const drawPos2 of otherSide) {
            this.graphics.lineTo(drawPos2.x, drawPos2.y);
        }

        this.graphics.closePath();
        this.graphics.fill({ color: game.stars[0].color, alpha: 0.1 });

        while (this.timer > 0.1) {
            this.lindex++;
            this.timer -= 0.1;
            this.positions.unshift(position);
            this.positions.pop();

            if (this.isDetached) {
                if (this.positions.length > 1) {
                    this.positions.pop();
                } else {
                    this.graphics.destroy();
                    game.detachedTrails.delete(this);
                }
            }
        }
    }

    detach() {
        this.isDetached = true;
        game.detachedTrails.add(this);
    }
}
