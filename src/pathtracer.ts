import { Graphics } from "pixi.js";
import { Vector } from "./types";
import { game } from "./game";


export class PathTracer {
    static graphics: Graphics;
    static points = new Array<Vector>();
    static init() {
        //this.points = civPath.map((point) => new Vector(point.x, point.y));
        PathTracer.graphics = new Graphics();
        game.realContainer.addChild(PathTracer.graphics);
    }

    static update() {
        this.graphics.clear();

        if (game.player.control.addPressed) {
            this.points.push(game.player.position.result());
            console.log(this.points);
        }

        if (game.player.control.removePressed) {
            this.points.pop();
            console.log(this.points);
        }

        this.graphics.moveTo(game.player.position.x, game.player.position.y);
        for (const point of this.points) {
            this.graphics.lineTo(point.x, point.y);
        }

        this.graphics.closePath();
        this.graphics.stroke({ color: 0xffaa00, width: 5, cap: "round" });

       //this.graphics.circle(game.ghost.nextPosition.x, game.ghost.nextPosition.y, 10 / game.camera.zoom);
       //this.graphics.fill({ color: 0xffaa00 });
    }
}
