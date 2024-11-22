import { Application, Container } from "pixi.js";
import { Background } from "./background";
import { Player } from "./player";
import { Camera } from "./camera";
import { Asteroid } from "./asteroid";
import { Vector } from "./types";
import { Station } from "./station";
import { Star } from "./star";
import { Beacon } from "./beacon";
import ivaPolygon from "./iva.json";
import blobPolygon from "./blob.json";
import gatePolygon from "./gate.json";
import starsatPolygon from "./starsat.json";
import butterflyPolygon from "./civ_butterfly.json";
import blockPoylgon from "./civ_block.json";
import rocketPoylgon from "./civ_rocket.json";
import civPath from "./civPath.json";
import { Buoy } from "./buoy";
import { MusicManager } from "./musicManager";
import { Ui } from "./ui";
import { Voicelines } from "./voicelines";
import { getLoanOptions, StoryManager } from "./storyManager";
import { SpaceObject } from "./spaceObject";
import { Item, ItemStash, ItemType } from "./stash";
import { System } from "detect-collisions";
import { Ghost } from "./ghost";
import { GhostMissile } from "./ghostMissile";
import { Trail } from "./trail";
import { TrailedParticle } from "./trailedParticle";
import { TimeManager } from "./timeManager";
import { Flak } from "./flak";
import { PathTracer } from "./pathtracer";
import { Civilian } from "./civilian";
export let game: Game;
export class Game {
    timeManager: TimeManager;
    static create(app: Application) {
        game = new Game(app);
        game.init();
        /** @ts-ignore */
        window.game = game;
    }

    app: Application;
    backgroundContainer: Container;
    playerContainer: Container;
    glowContainer: Container;
    objectContainer: Container;
    realBgUiContainer: Container;
    trailContainer: Container;
    realUiContainer: Container;
    realContainer: Container;
    uiContainer: Container;
    itemContainer: Container;

    background!: Background;
    music!: MusicManager;
    voice: Voicelines;
    story: StoryManager;

    system: System;
    player!: Player;
    ghost?: Ghost;
    stash: ItemStash;
    camera!: Camera;
    ui!: Ui;

    time = 0;

    asteroids = new Array<Asteroid>();
    stars = new Array<Star>();
    stations = new Array<Station>();
    buoys = new Array<Buoy>();
    spaceObjects = new Array<SpaceObject>();
    missiles = new Set<GhostMissile>();
    detachedTrails = new Set<Trail>();
    trailedParticles = new Set<TrailedParticle>();
    flak = new Set<Flak>();
    civilians = new Set<Civilian>();

    keys = new Set<string>();

    mousePosition = new Vector(0, 0);

    constructor(app: Application) {
        this.app = app;
        this.backgroundContainer = new Container();
        this.realBgUiContainer = new Container();
        this.glowContainer = new Container();
        this.objectContainer = new Container();
        this.playerContainer = new Container();
        this.trailContainer = new Container();
        this.realUiContainer = new Container();
        this.realContainer = new Container();
        this.uiContainer = new Container();
        this.itemContainer = new Container();
        this.music = new MusicManager();
        this.timeManager = new TimeManager();

        app.ticker.add((delta) => {
            this.update(delta.deltaTime);
        });

        window.addEventListener("keydown", (e) => this.keys.add(e.key));
        window.addEventListener("keyup", (e) => this.keys.delete(e.key));
        window.addEventListener("mousemove", (e) => this.mousePosition.set(e.clientX, e.clientY));

        document.addEventListener("wheel", (e) => (this.camera.targetZoom *= 1 - 0.1 * Math.sign(e.deltaY)));
    }

    resize() {
        this.background.draw();
    }

    init() {
        this.system = new System();
        const star = new Star();
        star.position.set(0, 0);
        this.player = new Player();
        this.camera = new Camera();
        this.voice = new Voicelines();
        this.ui = new Ui();
        this.story = new StoryManager();
        this.stash = new ItemStash();

        PathTracer.init();

        this.player.teleport(0, 3000);
        this.background = new Background();
        this.app.stage.addChild(this.backgroundContainer);
        this.app.stage.addChild(this.realContainer);
        this.realContainer.addChild(this.realBgUiContainer);
        this.realContainer.addChild(this.glowContainer);
        this.realContainer.addChild(this.objectContainer);
        this.realContainer.addChild(this.realUiContainer);
        this.realContainer.addChild(this.playerContainer);
        this.realContainer.addChild(this.trailContainer);
        this.app.stage.addChild(this.uiContainer);
        this.app.stage.addChild(this.itemContainer);

        window.addEventListener("resize", () => this.resize());
        this.resize();



        for (let index = 0; index < 50; index++) {
            const asteroid = new Asteroid(100 + Math.abs(Math.sin(index * 4.3)) * 1000);
            const angle = (index / 50) * Math.PI * 2;
            const pos = Vector.fromAngle(angle).mult(20000 + 3000 * Math.abs(Math.cos(index)));
            asteroid.position.set(pos.x, pos.y);
            this.asteroids.push(asteroid);
        }

        this.story.iva = new Station("iva", new Vector(1000, 30000), 1200, 0x3333ff, ivaPolygon, 1);
        this.story.blob = new Station("blob", new Vector(0, -10000), 1000, 0xff3333, blobPolygon, 1);
        this.story.gate = new Station("gate", new Vector(-30000, -20000), 1500, 0xff33ff, gatePolygon, 1, false);
        this.story.gate.coridoorRadius = 10000;
        this.story.gate.prepareCoridoor();

        const starsat = new SpaceObject("starsat", new Vector(-4000, 1000), starsatPolygon, 1);
        starsat.container.rotation = -Math.PI / 8;
        this.story.starsat = starsat;
        const b = new Beacon(0xffff00);
        b.position.set(-4000, 1000);

        this.story.blob.name = "Blob";
        this.story.blob.description = "Transport hub of this system. Renew your license here.";

        const engineMod = {
            name: "Disable Drag Emulator",
            description: "This ramshackle modification will make your Crow faster, but less controllable.",
            image: null,
            value: "cost: 55c",
            action: () => {
                game.story.blob.services = game.story.blob.services.filter((s) => s.name != "Disable Drag Emulator");
                game.ui.stationUi(game.story.blob);
                this.player.stats.drag = 0.995;
                this.player.moneyTransfer(-55, "Engine Mod");
            },
            condition: () => {
                return this.player.money >= 55;
            },
        };

        const boostMod = {
            name: '"Kickback" Modification',
            description: "This ramshackle modification will make your Crow faster, but less controllable.",
            image: null,
            value: "cost: 45c",
            action: () => {
                game.story.blob.services = game.story.blob.services.filter((s) => s.name != '"Kickback" Modification');
                game.story.blob.services.push(engineMod);
                game.ui.stationUi(game.story.blob);
                this.player.boostUnlocked = true;
                this.player.moneyTransfer(-45, "Engine Mod");
            },
            condition: () => {
                return this.player.money >= 45;
            },
        };

        this.story.blob.services = [
            {
                name: "Taxi License",
                description: "Buy/Renew your license here. Without a license, you will be fined.",
                image: "system",
                value: " 120 seconds | cost: 10c | renew 2c",
                action: () => {
                    //game.story.blob.services = game.story.blob.services.filter((s) => s.name != "License");
                    game.ui.stationUi(game.story.blob);
                    if (game.player.license > 0) {
                        this.player.moneyTransfer(-2, "License - Renew");
                    } else {
                        this.player.moneyTransfer(-10, "License - Purchase");
                    }
                    game.player.license = 120;
                },
                condition: () => {
                    return game.player.license <= 115 && (this.player.money >= 10 || (game.player.license > 0 && this.player.money >= 2));
                },
            },
            boostMod,
        ];

        this.story.iva.name = "Iva";
        this.story.iva.description = "Provides financial services. Pay off loans, get a loan, see transactions.";

        this.story.iva.services = [...getLoanOptions()];

        this.story.gate.name = "Gate";
        this.story.gate.description = "Long range space port. Merchants carry various goods here.";

        const officeSupplies = {
            name: "Office Supplies",
            description: "A couple markers, blank paper, transparency sheet",
            image: "red_marker",
            value: "cost: 2c",
            action: () => {
                game.story.gate.services = game.story.gate.services.filter((s) => s.name != "Office Supplies");
                game.ui.stationUi(game.story.gate);
                this.stash.items.push(Item.fromType(ItemType.greenSharpie));
                this.stash.items.push(Item.fromType(ItemType.blankPaper));
                this.stash.items.push(Item.fromType(ItemType.redSharpie));
                this.stash.items.push(Item.fromType(ItemType.transparency));
                this.ui.renderStash();
                this.player.moneyTransfer(-2, "Office Supplies");
            },
            condition: () => {
                return this.player.money >= 2;
            },
        };

        this.story.gate.services = [officeSupplies];

        game.ui.renderStash();

        const civTypes = [
            {
                sprite: "civ_butterfly",
                polygon: butterflyPolygon,
            },
            {
                sprite: "civ_rocket",
                polygon: rocketPoylgon,
            },
            {
                sprite: "civ_block",
                polygon: blockPoylgon,
            },
        ];

        for (let index = 0; index < 30; index++) {
            const typeIndex = ((2 * index) % 7) % 3;
            Civilian.create(civTypes[typeIndex].sprite, civPath, civTypes[typeIndex].polygon, index / 30);
        }
    }

    update(dt: number) {
        this.timeManager.update(dt);
        dt = this.timeManager.gameDt();
        this.time += dt;
        this.music.update(game.timeManager.realDt);
        this.player.update(this.timeManager.playerDt());
        this.camera.update(dt);
        this.ui.update(game.timeManager.realDt);

        for (const asteroid of this.asteroids) {
            asteroid.update(dt);
        }

        for (const star of this.stars) {
            star.update(dt);
        }

        for (const buoy of this.buoys) {
            buoy.update(dt);
        }

        for (const station of this.stations) {
            station.update(dt);
        }

        for (const spaceObject of this.spaceObjects) {
            spaceObject.update(dt);
        }

        this.ghost?.update(dt);

        for (const missile of this.missiles) {
            missile.update(dt);
        }

        for (const trail of this.detachedTrails) {
            trail.update(dt);
        }

        for (const particle of this.trailedParticles) {
            particle.update(dt);
        }

        for (const flak of this.flak) {
            flak.update(dt);
        }

        for (const civilian of this.civilians) {
            civilian.update(dt);
        }

        this.stash.update(dt);

        this.story.update(dt);

        PathTracer.update();

        console.log(recursiveContainerCounter(this.app.stage));
    }

    clear(){
        this.app.stage.removeChildren();
    }
}

function recursiveContainerCounter(container: Container) {
    let count = 0;
    for (const child of container.children) {
        count += 1;
        if (child instanceof Container) {
            count += recursiveContainerCounter(child);
        }
    }
    return count;
}
