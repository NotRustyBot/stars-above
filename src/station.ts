import { Assets, Container, Graphics, Sprite } from "pixi.js";
import { Vector, Vectorlike } from "./types";
import { game } from "./game";
import { OutlinedPolygon } from "./outlinedPolygon";
import { LightMask } from "./lightMask";
import { Buoy } from "./buoy";
import { TrackingMode } from "./camera";

export type StationService = {
    name: string;
    description: string;
    value?: string;
    image: string | null;
    action: () => void;
    condition?: () => boolean;
};

export class Station {
    position = new Vector(0, 0);
    velocity = new Vector(0, 0);
    sprite: Sprite;
    radius: number;
    graphics: Graphics;

    coridoorRadius = 5000;
    container = new Container();

    outlinedPolygon: OutlinedPolygon;
    color = 0xffffff;
    lightMask: LightMask;
    shipInRestrictedArea = false;

    coridoor = new Array<Vector>();

    name = "";
    description = "";

    services = new Array<StationService>();

    constructor(sprite: string, position: Vector, radius: number, beaconColor: number, polygon: Vectorlike[], polygonImportScale: number, addCridoor = true) {
        this.color = beaconColor;
        this.position.set(position.x, position.y);
        this.sprite = new Sprite(Assets.get(sprite));
        this.sprite.anchor.set(0.5, 0.5);
        this.graphics = new Graphics();
        this.container.addChild(this.graphics);
        this.container.addChild(this.sprite);
        game.objectContainer.addChild(this.container);
        this.radius = radius;
        game.player.signals.push(this);
        game.stations.push(this);
        const usePolygon = polygon.map((v) => new Vector(v.x * polygonImportScale, v.y * polygonImportScale));
        this.outlinedPolygon = new OutlinedPolygon(usePolygon, this.graphics);

        this.lightMask = new LightMask(this.sprite);

        addCridoor && this.prepareCoridoor();
    }

    update(dt: number) {
        this.container.position.set(this.position.x, this.position.y);
        this.outlinedPolygon.draw(dt);
        this.container.rotation += 0.001 * dt;
        this.lightMask.update(this.position, this.container.rotation);

        if (game.player.position.distanceSquared(this.position) < (this.coridoorRadius + 3000) ** 2) {
            game.camera.mode = TrackingMode.playerAndTarget;
            game.camera.target = this;
        }

        let okay = true;
        const disq = game.player.position.distanceSquared(this.position);
        if (disq < (this.coridoorRadius - 500) ** 2 && disq > (this.coridoorRadius - 1500) ** 2) {
            okay = false;
            for (const pos of this.coridoor) {
                if (game.player.position.distanceSquared(pos) < (this.coridoorRadius / 2) ** 2) {
                    okay = true;
                    break;
                }
            }
        }

        if (disq < this.radius ** 2) {
            if (!this.showingMyServices) {
                game.ui.stationUi(this);
                this.showingMyServices = true;
            }
        } else {
            if (this.showingMyServices) {
                game.ui.hideStationUi();
                this.showingMyServices = false;
            }
        }

        this.shipInRestrictedArea = !okay;
    }

    showingMyServices = false;

    prepareCoridoor() {
        let angle = 0;
        for (let i = 1; i < this.coridoorRadius / 2000 + 1; i++) {
            const position = Vector.fromAngle(angle)
                .mult(2000 * i)
                .add(this.position);
            new Buoy(position);
            this.coridoor.push(position);
            angle += 0.1;
        }

        for (let i = 1; i < 6; i++) {
            const position = Vector.fromAngle(((i * Math.PI) / 6) * 2)
                .mult(this.coridoorRadius)
                .add(this.position);
            new Buoy(position, 0xff0000);
            angle += 0.1;
        }
    }
}
