import { game } from "./game";
import { Trail } from "./trail";
import { Vector } from "./types";

export class TrailedParticle {
    position: Vector;
    velocity: Vector;

    trail: Trail;
    constructor(position: Vector, velocity: number) {
        this.position = position.result();
        this.velocity = Vector.fromAngle(velocity);

        this.trail = new Trail(10, 50);
        this.trail.teleport(this.position.result());
        game.trailedParticles.add(this);
    }

    life = 0.25;

    update(dt: number) {
        this.velocity.normalize(this.life * 200);
        this.position.add(this.velocity.result().mult(dt));
        this.life -= dt / 60;
        if (this.life <= 0) {
            this.trail.detach();
            game.trailedParticles.delete(this);
        }else {
            this.trail.update(dt, this.position, 0);
        }
    }
}
