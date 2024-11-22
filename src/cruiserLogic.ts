import { SpaceObject } from "./spaceObject";
import path from "./cruiserPath.json";
import { Vector, Vectorlike } from "./types";
import { Trail } from "./trail";

export class CruiserLogic {
    cruiser: SpaceObject;
    velocity = new Vector(1, 0);

    trailA: Trail;
    trailB: Trail;

    constructor(cruiser: SpaceObject) {
        this.cruiser = cruiser;
        this.path = path;

        this.trailA = new Trail(100, 300);
        this.trailA.offset.set(2200, 400);

        this.trailB = new Trail(100, 300);
        this.trailB.offset.set(2200, -400);
        this.trailA.teleport(this.cruiser.position.result());
        this.trailB.teleport(this.cruiser.position.result());
    }

    readonly fullSpeed = 30;
    useSpeed = this.fullSpeed;

    pathPoint = 0;

    get nextPosition() {
        return this.path[this.pathPoint % this.path.length];
    }

    path: Vectorlike[];

    stopAtPoint = 3;
    update(dt: number) {
        if (this.cruiser.position.distanceSquared(this.nextPosition) < 500 ** 2) {
            this.pathPoint++;
        }

        if (this.stopAtPoint == this.pathPoint) {
            this.useSpeed = 0.001;
        } else {
            this.useSpeed = this.fullSpeed;
        }

        const direction = this.cruiser.position.diff(this.nextPosition).normalize(0.05);
        this.velocity.normalize().add(direction).normalize(this.useSpeed);
        this.cruiser.position.add(this.velocity.result().mult(-dt));
        this.cruiser.container.rotation = this.velocity.toAngle();

        this.trailA.update(dt, this.cruiser.position, this.cruiser.container.rotation);
        this.trailB.update(dt, this.cruiser.position, this.cruiser.container.rotation);
    }
}
