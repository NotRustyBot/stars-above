import { Assets, Container, Graphics, Sprite } from "pixi.js";
import playerPolygon from "./playerPolygon.json";
import { Vector, Vectorlike } from "./types";
import { game } from "./game";
import { PlayerControls } from "./controls";
import { ITrackable } from "./camera";
import { OutlinedPolygon } from "./outlinedPolygon";
import { LightMask } from "./lightMask";
import { ItemType } from "./stash";
import { Polygon, Response } from "detect-collisions";
import { Trail } from "./trail";

export interface IRadarable extends ITrackable {
    velocity: Vectorlike;
    radius: number;
}

export interface ISignal extends ITrackable {
    color: number;
    range?: number;
}

const polygonImportScale = 0.4;

export class Player {
    position = new Vector(0, 0);
    visualPosition = new Vector(0, 0);
    velocity = new Vector(0, 0);
    container: Container;
    signal: Graphics;
    graphics: Graphics;
    sprite: Sprite;
    acceleration = new Vector(0, 0);
    lightMask: LightMask;

    showBgUi: Sprite;

    outlinedPolygon: OutlinedPolygon;

    signals = new Array<ISignal>();

    control = new PlayerControls();
    license = 0;
    restrictedAreaBypass = 0;
    money = 0;

    hitbox: Polygon;
    trail: Trail;

    constructor() {
        this.container = new Container();
        this.graphics = new Graphics();
        this.signal = new Graphics();
        this.sprite = new Sprite(Assets.get("ply"));
        this.sprite.anchor.set(0.5, 0.5);

        this.lightMask = new LightMask(this.sprite);

        this.container.addChild(this.graphics);
        this.container.addChild(this.sprite);
        game.realUiContainer.addChild(this.signal);
        game.playerContainer.addChild(this.container);
        this.outlinedPolygon = new OutlinedPolygon(
            playerPolygon.map((v) => new Vector(v.x * polygonImportScale, v.y * polygonImportScale)),
            this.graphics
        );

        game.realBgUiContainer.mask = this.showBgUi = new Sprite(Assets.get("light"));
        this.showBgUi.anchor.set(0.5, 0.5);
        this.showBgUi.scale.set(20);
        this.container.addChild(this.showBgUi);

        this.money = this.transactions.reduce((a, b) => a + b.amount, 0);

        this.hitbox = game.system.createPolygon(
            this.position,
            playerPolygon.map((v) => new Vector(v.x * polygonImportScale, v.y * polygonImportScale))
        );

        this.control.init();
        this.trail = new Trail(30, 20);
        this.trail.offset.set(0, 110);
    }

    stats = {
        baseThrust: 0.5,
        drag: 0.99,
        boost: 4,
        boostCooldown: 10,
        boostLength: 60,
    };

    physics = 0;
    boostCooldown = 0;
    boostEffect = 0;

    totalRotation = 0;

    boostUnlocked = false;
    update(dt: number) {
        const s = dt / 60;

        if (this.license > 0) this.license -= s;
        if (this.restrictedAreaBypass > 0) this.restrictedAreaBypass -= s;

        this.control.update();

        this.physics += dt;

        this.acceleration.set(0, 0);

        if (this.control.up) this.acceleration.y -= this.stats.baseThrust;
        if (this.control.down) this.acceleration.y += this.stats.baseThrust;
        if (this.control.left) this.acceleration.x -= this.stats.baseThrust;
        if (this.control.right) this.acceleration.x += this.stats.baseThrust;

        const angle = this.getMouse().toAngle() + Math.PI / 2;
        this.totalRotation += Math.abs(angle - this.container.rotation);
        this.container.rotation = angle;

        let accLength = this.acceleration.length();

        let accAngle = this.acceleration.toAngle();

        if (this.control.brake) {
            accLength = this.stats.baseThrust;
            accAngle = this.velocity.result().mult(-1).toAngle() - angle;
        }

        if (this.boostUnlocked && this.boostEffect <= 0 && this.boostCooldown <= 0 && this.control.boost) {
            this.boostEffect = this.stats.boostLength;
        }

        if (this.boostCooldown > 0) this.boostCooldown -= s;

        const rotatedAcceleration = Vector.fromAngle(accAngle + angle).mult(accLength);

        let useBoost = 1;
        if (this.boostEffect > 0) {
            this.boostEffect -= 1;
            useBoost = this.stats.boost;
            this.boostCooldown = this.stats.boostCooldown;
        }

        this.velocity = this.velocity.add(rotatedAcceleration.result().mult(0.5 * useBoost));
        this.position = this.position.add(this.velocity.result().mult(dt));
        this.velocity = this.velocity.add(rotatedAcceleration.result().mult(0.5 * useBoost));

        if(game.timeManager.isCheeze) this.physics = 1;

        while (this.physics > 0) {
            this.velocity.mult(this.stats.drag);
            this.physics -= 1;
        }

        this.hitbox.rotate(this.container.rotation);
        this.hitbox.setPosition(this.position.x, this.position.y);
        this.hitbox.updateBody();

        game.system.checkOne(this.hitbox, (e: Response) => {
            console.log( e.b);
            
            this.position.x -= e.overlapV.x;
            this.position.y -= e.overlapV.y;
            if (this.velocity.length() > 20 && !game.story.useStarLogic) {
                this.moneyTransfer(-5, "Repairs");
            }
            this.velocity.mult(-0.1);
        });

        this.outlinedPolygon.updateAcceleration(this.acceleration);
        this.outlinedPolygon.draw(dt);

        this.signal.scale.set(1 / game.camera.zoom);

        this.visualPosition.mult(0.75).add(this.position.result().mult(0.25));

        this.container.position.set(this.visualPosition.x, this.visualPosition.y);

        this.updateSignals();

        this.lightMask.update(this.visualPosition, this.container.rotation);

        this.trail.update(dt, this.visualPosition.result(), this.container.rotation);

        if(this.control.skipDialog) game.voice.forceEnd();
    }

    teleport(x: number, y: number) {
        this.position.x = x;
        this.position.y = y;
        this.visualPosition.x = x;
        this.visualPosition.y = y;
        this.trail.teleport(this.visualPosition.result());
        game.camera.smoothPosition = this.visualPosition.result();
    }

    updateSignals() {
        this.signal.clear();

        const signalsSize = 200;
        for (const signal of this.signals) {
            if (signal.range && this.position.distance(signal.position) > signal.range) continue;
            const pos = Vector.fromLike(signal.position).diff(this.position);
            const angle = pos.toAngle();
            const length = pos.length();

            const arrowAngle = Math.min(0.1, 1000 / length);

            const dotPos = Vector.fromAngle(angle - arrowAngle).mult(signalsSize);
            const dotPos2 = Vector.fromAngle(angle).mult(signalsSize + 10);
            const dotPos3 = Vector.fromAngle(angle + arrowAngle).mult(signalsSize);

            this.signal.moveTo(dotPos.x, dotPos.y);
            this.signal.lineTo(dotPos2.x, dotPos2.y);
            this.signal.lineTo(dotPos3.x, dotPos3.y);
            this.signal.closePath();
            this.signal.stroke({ color: signal.color, width: 2, alpha: 0.5, cap: "round" });
            this.signal.fill({ color: signal.color, alpha: 0.2 });
        }

        this.signal.position.set(this.visualPosition.x, this.visualPosition.y);
    }

    getMouse() {
        const mouse = Vector.fromLike(game.mousePosition)
            .sub(new Vector(window.innerWidth / 2, window.innerHeight / 2))
            .mult(1 / game.camera.zoom)
            .add(game.camera.position);
        return new Vector(mouse.x - this.position.x, mouse.y - this.position.y);
    }

    transactions: Array<{ amount: number; reason: string }> = [
        { amount: 1390, reason: "Inheritance" },
        { amount: -80, reason: "fun'eral" },
        { amount: -42, reason: "Gate casino" },
        { amount: +46, reason: "Gate casino" },
        { amount: -1290, reason: "Gate casino" },
        { amount: 400, reason: "Loan - IVA Bank" },
        { amount: -130, reason: "Therapy session" },
        { amount: -250, reason: "Learn2Taxi course" },
    ];

    moneyTransfer(amount: number, reason: string) {
        this.money += amount;
        game.ui.queueTransation(amount, reason);
        this.transactions.push({ amount: amount, reason: reason });
        game.stash.items.filter((i) => i.type == ItemType.finReport).forEach((i) => i.updateReport());
    }
}
