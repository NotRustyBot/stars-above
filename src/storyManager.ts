import { game } from "./game";
import { SpaceObject } from "./spaceObject";
import { Station, StationService } from "./station";
import { Vector } from "./types";
import cruiserPolygon from "./cruiser.json";
import { Beacon } from "./beacon";
import { Assets, Sprite } from "pixi.js";
import { Item, ItemType } from "./stash";
import { Ghost } from "./ghost";
import { CruiserLogic } from "./cruiserLogic";
import { CrowIntroIntermission, EmptyIntermission, FinalIntermission, GoldenRecordIntermission, LightsNightmare, LightsNightmareBad, MissilesNightmare, Nightmare } from "./nightmare";
import { clamp } from "./utils";
import { TrackingMode } from "./camera";
import { GoldenDust } from "./goldenDust";
import { characters } from "./voicelines";
import { Asteroid } from "./asteroid";

enum Progress {
    nothing,
    start,
    sunSatReached,
    blobApproach,
    blobReached,
    robotFirstTripReady,
    robotFirstTripDeparted,
    robotFirstTripArrived,
    scientistCalling,
    returnToBlob,
    departedFromBlob,
    scientistReachedGate,
    scientistDepartGate,
    scientistReachedStarSat,
    psychologistDepartGate,
    psychologistArriveIva,
    psychologistCalling,
    psychologistDepartedIva,
    psychologistArrivedGate,
    approachCruiser,
    loadPersonellForGate,
    departCruiserToGate,
    deliverPersonellForGate,
    loadPersonellForIva,
    deliverPersonellForIva,
    departCruiserToIva,
    loadPersonellForBlob,
    deliverPersonellForBlob,
    allPersonellDelivered,
    spotted,
    panic,
    planB,
    targetingComplete,
    ghostBusted,
    aftermath,
    starsatArrivedAftermath,
    starsatDepartedAftermath,
    gateArrivedAftermath,
    goldenStar,
    goldenStarListening,
    goldenStarDone,
    lonelyStar,
    lonelyStarListening,
    lonelyStarDone,
    regretStar,
    regretStarListening,
    regretStarDone,
    hopeStar,
    hopeStarListening,
    hopeStarDone,
    final,
}

export class StoryManager {
    progressIndex = Progress.nothing;
    iva: Station;
    blob: Station;
    starsat: SpaceObject;
    bypassBlob = true;
    robotLoaded = false;
    scientistLoaded = false;
    psychologistLoaded = false;
    gate: Station;

    allowFoodDelivery = false;
    allowCustomers = false;
    delayedDialogueUsed = false;
    personOnBoard = false as string | false;

    storyTimer = 0;

    loan = 4;
    untilLoan = 10;
    cruiser: SpaceObject;
    cruiserLogic?: CruiserLogic;
    cruiserGun: Sprite;

    nightmare = new Nightmare();
    isNightmare = false;
    wasGhostVisible = false;
    hiddenLine = 0;

    releaseOfLiability?: Item;
    readonly targetingProgressCap = 80;
    targetingProgress = 0;
    useUiBlur = false;
    useStarLogic = false;
    useAftermathLogic = false;
    stingerPlayed = false;
    update(dt: number) {
        const s = dt / 60;
        if (!this.isNightmare) {
            this.untilLoan -= s;
            this.storyTimer += s;
            if (this.untilLoan < 0) {
                this.untilLoan += 60;
                game.player.moneyTransfer(-this.loan, "Loan - Interest");
            }
        }

        if (this.isNightmare) {
            this.nightmare.update(dt);
        } else if (this.progressIndex == Progress.nothing && this.tutorialIndex > 1) {
            this.bartend();
            this.progressIndex = Progress.start;
            this.maxTutorialIndex = 3;
            game.voice.say("1i");
            this.personOnBoard = "instructor";
        } else if (this.progressIndex == Progress.start) {
            if (game.player.position.distanceSquared(this.starsat.position) < 500 ** 2) {
                this.progressIndex = Progress.sunSatReached;
                this.maxTutorialIndex = 4;
                game.voice.say("2i");
            }
        } else if (this.progressIndex == Progress.sunSatReached) {
            if (game.player.position.distanceSquared(this.blob.position) < 10000 ** 2) {
                this.progressIndex = Progress.blobApproach;
                game.voice.say("3i");
                this.blob.services.push({
                    name: "Robot",
                    description: "Customer - story",
                    image: "robot",
                    action: () => {
                        game.story.blob.services = game.story.blob.services.filter((s) => s.name != "Robot");
                        game.ui.stationUi(game.story.blob);
                        this.robotLoaded = true;
                        this.personOnBoard = "robot";
                    },
                    condition: () => !this.personOnBoard,
                });
            }
        } else if (this.progressIndex == Progress.blobApproach) {
            if (game.voice.isSaying) game.timeManager.danger(1);
            if (this.blob.shipInRestrictedArea && this.bypassBlob) {
                this.bypassBlob = false;
                game.voice.say("3ai");
                game.player.restrictedAreaBypass = 10;
            }
            if (game.player.position.distanceSquared(this.blob.position) < 1000 ** 2) {
                this.progressIndex = Progress.blobReached;
                game.voice.say("4i");
                this.personOnBoard = false;
            }
        } else if (this.progressIndex == Progress.blobReached) {
            if (this.robotLoaded) {
                this.progressIndex = Progress.robotFirstTripReady;
                game.voice.say("5r");
            }
        } else if (this.progressIndex == Progress.robotFirstTripReady) {
            if (game.player.position.distanceSquared(this.blob.position) > 5000 ** 2) {
                this.progressIndex = Progress.robotFirstTripDeparted;
                game.voice.say("6r");
                this.maxTutorialIndex = 6;
                this.allowCustomers = true;
            }
        } else if (this.progressIndex == Progress.robotFirstTripDeparted) {
            if (game.player.position.distanceSquared(this.iva.position) < 1000 ** 2) {
                this.progressIndex = Progress.robotFirstTripArrived;
                game.voice.say("7r");
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Robot");
                this.personOnBoard = false;
            }
        } else if (this.progressIndex == Progress.robotFirstTripArrived) {
            if (game.player.position.distanceSquared(this.iva.position) > 5000 ** 2) {
                this.progressIndex = Progress.scientistCalling;
                game.voice.say("8s");
                this.blob.services.push({
                    name: "Scientist",
                    description: "Customer - story",
                    image: "scientist",
                    action: () => {
                        game.story.blob.services = game.story.blob.services.filter((s) => s.name != "Scientist");
                        game.ui.stationUi(game.story.blob);
                        this.scientistLoaded = true;
                        game.voice.say("9s");
                        this.personOnBoard = "scientist";
                    },
                    condition: () => !this.personOnBoard,
                });
            }
        } else if (this.progressIndex == Progress.scientistCalling) {
            if (game.player.position.distanceSquared(this.blob.position) < 1000 ** 2) {
                this.progressIndex = Progress.returnToBlob;
            }
        } else if (this.progressIndex == Progress.returnToBlob) {
            if (game.player.position.distanceSquared(this.blob.position) > 5000 ** 2 && this.scientistLoaded) {
                this.progressIndex = Progress.departedFromBlob;
                game.voice.say("10s");
                this.allowFoodDelivery = true;
            }
        } else if (this.progressIndex == Progress.departedFromBlob) {
            if (game.player.position.distanceSquared(this.gate.position) < 1000 ** 2) {
                this.progressIndex = Progress.scientistReachedGate;
                game.voice.say("11s");
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Scientist");
            }
        } else if (this.progressIndex == Progress.scientistReachedGate) {
            if (game.player.position.distanceSquared(this.gate.position) > 5000 ** 2) {
                this.progressIndex = Progress.scientistDepartGate;
                game.voice.say("12s");
            }
        } else if (this.progressIndex == Progress.scientistDepartGate) {
            if (game.player.position.distanceSquared(this.starsat.position) < 1000 ** 2) {
                this.progressIndex = Progress.scientistReachedStarSat;
                game.voice.say("13s");
                game.player.moneyTransfer(15, "Fare - Scientist");
                game.player.moneyTransfer(5, "Tip - Scientist");
                this.personOnBoard = false;

                this.gate.services.push({
                    name: "Psychologist",
                    description: "Customer - story",
                    image: "psychologist",
                    action: () => {
                        game.story.gate.services = game.story.gate.services.filter((s) => s.name != "Psychologist");
                        game.ui.stationUi(game.story.gate);
                        this.psychologistLoaded = true;
                        game.voice.say("14p");
                        this.personOnBoard = "psychologist";
                    },
                    condition: () => !this.personOnBoard,
                });
            }
        } else if (this.progressIndex == Progress.scientistReachedStarSat) {
            if (game.player.position.distanceSquared(this.gate.position) > 5000 ** 2 && this.psychologistLoaded) {
                this.progressIndex = Progress.psychologistDepartGate;
                game.voice.say("15p");
                this.storyTimer = 0;
            }
        } else if (this.progressIndex == Progress.psychologistDepartGate) {
            if (this.storyTimer > 10 && this.delayedDialogueUsed == false) {
                game.voice.say("16p");
                this.delayedDialogueUsed = true;
            }

            if (game.player.position.distanceSquared(this.iva.position) < 1000 ** 2) {
                this.progressIndex = Progress.psychologistArriveIva;
                game.voice.say("17p");
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Psychologist");
                this.personOnBoard = false;
                this.storyTimer = 0;
                this.psychologistLoaded = false;
            }
        } else if (this.progressIndex == Progress.psychologistArriveIva) {
            if (this.storyTimer > 120) {
                this.progressIndex = Progress.psychologistCalling;
                game.voice.say("18p");
                this.iva.services.push({
                    name: "Psychologist",
                    description: "Customer - story",
                    image: "psychologist",
                    action: () => {
                        game.story.iva.services = game.story.iva.services.filter((s) => s.name != "Psychologist");
                        game.ui.stationUi(game.story.iva);
                        this.psychologistLoaded = true;
                        game.voice.say("19p");
                        this.personOnBoard = "psychologist";
                    },
                    condition: () => !this.personOnBoard,
                });
            }
        } else if (this.progressIndex == Progress.psychologistCalling) {
            if (game.player.position.distanceSquared(this.iva.position) > 5000 ** 2 && this.psychologistLoaded) {
                game.voice.say("20p");
                this.storyTimer = 0;
                this.delayedDialogueUsed = false;
                this.progressIndex = Progress.psychologistDepartedIva;
                game.music.currentFamily = game.music.action;
            }
        } else if (this.progressIndex == Progress.psychologistDepartedIva) {
            if (this.storyTimer > 10 && this.delayedDialogueUsed == false) {
                game.voice.say("21p");
                this.delayedDialogueUsed = true;
                this.bartend();
            }

            if (game.player.position.distanceSquared(this.gate.position) < 1000 ** 2) {
                this.progressIndex = Progress.psychologistArrivedGate;
                game.voice.say("22p");
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Psychologist");
                this.personOnBoard = false;
            }
        } else if (this.progressIndex == Progress.psychologistArrivedGate) {
            if (game.player.position.distanceSquared(this.gate.position) > 5000 ** 2) {
                game.voice.say("23i");
                this.progressIndex = Progress.approachCruiser;

                this.cruiser = new SpaceObject("cruiser", new Vector(-10000, 50000), cruiserPolygon, 1);
                this.cruiserGun = new Sprite(Assets.get("cruiser_gun"));
                this.cruiserGun.anchor.set(0.7, 0.5);
                this.cruiserGun.x = -1000;
                this.cruiser.container.addChild(this.cruiserGun);
                this.cruiser.beacon = new Beacon(0x55ff55);
                this.cruiser.beacon.range = 30000;
                this.cruiser.beacon.position.set(this.cruiser.position.x, this.cruiser.position.y);
                this.cruiserLogic = new CruiserLogic(this.cruiser);
            }
        } else if (this.progressIndex == Progress.approachCruiser) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 10000 ** 2) {
                this.progressIndex = Progress.loadPersonellForGate;
                game.voice.say("24m");
            }
        } else if (this.progressIndex == Progress.loadPersonellForGate) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 1000 ** 2) {
                this.progressIndex = Progress.departCruiserToGate;
                this.personOnBoard = "commander";
                this.cruiserLogic.stopAtPoint = 13;
                game.voice.say("25m");

                for (const civilian of game.civilians) {
                    if (civilian.index % 3 == 0) civilian.remove();
                }
            }
        } else if (this.progressIndex == Progress.departCruiserToGate) {
            if (game.player.position.distanceSquared(this.cruiser.position) > 10000 ** 2) {
                this.progressIndex = Progress.deliverPersonellForGate;
                game.voice.say("26m");
            }
        } else if (this.progressIndex == Progress.deliverPersonellForGate) {
            if (game.player.position.distanceSquared(this.gate.position) < 1000 ** 2) {
                this.progressIndex = Progress.loadPersonellForBlob;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Military personell");
                this.personOnBoard = false;
                game.voice.say("27m");
            }
        } else if (this.progressIndex == Progress.loadPersonellForBlob) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 1000 ** 2) {
                this.progressIndex = Progress.deliverPersonellForBlob;
                this.cruiserLogic.stopAtPoint = 17;
                game.voice.say("28m");
                this.personOnBoard = "commander";

                for (const civilian of game.civilians) {
                    if (civilian.index % 3 == 1) civilian.remove();
                }
            }
        } else if (this.progressIndex == Progress.deliverPersonellForBlob) {
            if (game.player.position.distanceSquared(this.blob.position) < 1000 ** 2) {
                this.progressIndex = Progress.loadPersonellForIva;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Military personell");
                this.personOnBoard = false;
                game.voice.say("29m");
            }
        } else if (this.progressIndex == Progress.loadPersonellForIva) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 1000 ** 2) {
                this.progressIndex = Progress.departCruiserToIva;
                this.personOnBoard = "commander";
                game.voice.say("30m");
                for (const civilian of game.civilians) {
                    if (civilian.index % 3 == 2) civilian.remove();
                }
            }
        } else if (this.progressIndex == Progress.departCruiserToIva) {
            if (game.player.position.distanceSquared(this.cruiser.position) > 10000 ** 2) {
                this.progressIndex = Progress.deliverPersonellForIva;
                this.allowCustomers = false;
                this.allowFoodDelivery = false;
                this.personOnBoard = false;
                this.foodDeliveryStatus = 0;
                this.customerStatus = 0;
                this.useAftermathLogic = true;
                game.voice.say("31m");
            }
        } else if (this.progressIndex == Progress.deliverPersonellForIva) {
            if (game.player.position.distanceSquared(this.iva.position) < 1000 ** 2) {
                this.progressIndex = Progress.allPersonellDelivered;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Military personell");
                game.voice.say("32m");
                game.ghost = new Ghost();
                game.music.currentFamily = game.music.combat1;
            }
        } else if (this.progressIndex == Progress.allPersonellDelivered) {
            if (this.wasGhostVisible) {
                this.progressIndex = Progress.spotted;
                game.voice.say("33m");
                game.voice.say("34m");
                this.storyTimer = 0;
                this.cruiser.remove();
            }
        } else if (this.progressIndex == Progress.spotted) {
            if (this.storyTimer > 10) {
                game.voice.say("35m");
                this.progressIndex = Progress.panic;
                this.useUiBlur = true;
                this.storyTimer = 0;
            }
        } else if (this.progressIndex == Progress.panic) {
            if (this.storyTimer > 10) {
                this.progressIndex = Progress.planB;
                game.voice.say("36m");
                this.storyTimer = 0;
            }
        } else if (this.progressIndex == Progress.planB) {
            if (this.targetingProgress >= this.targetingProgressCap) {
                this.progressIndex = Progress.targetingComplete;
                game.voice.say("39m");
                this.storyTimer = 0;
            }
        } else if (this.progressIndex == Progress.targetingComplete) {
            game.music.noMusic = true;
            if (this.storyTimer >= 3) {
                this.storyTimer = 0;
                this.progressIndex = Progress.ghostBusted;
                this.useUiBlur = false;
                game.background.flash();
                game.ghost?.remove();
                game.flak.forEach((f) => f.remove());
                game.missiles.forEach((m) => m.remove());
            }
        } else if (this.progressIndex == Progress.ghostBusted) {
            if (this.storyTimer >= 1) {
                this.storyTimer = 0;
                this.progressIndex = Progress.aftermath;
                game.player.stats.drag = 0.95;
                this.nightmare.selectedNightmare = new LightsNightmareBad();
                this.personOnBoard = false;
                this.nightmare.start();
                this.nightmare.savedCoordinate = new Vector(0, 3000);
                this.nightmare.fadeInTimer = 1;
                game.player.signals = [];
                game.player.signals.push(this.starsat.beacon);
                game.player.signals.push(this.gate);
                this.untilLoan = Infinity;
                game.player.transactions.push({ reason: "Dramatic Effect", amount: -game.player.money + this.loan + 1 });
                game.player.money = this.loan + 1;
                game.ui.showMoney = game.player.money;
            }
        } else if (this.progressIndex == Progress.aftermath) {
            game.camera.mode = TrackingMode.sillyCam;
            if (game.player.position.distanceSquared(this.starsat.position) < 1000 ** 2) {
                game.voice.say("40s");
                this.progressIndex = Progress.starsatArrivedAftermath;
                this.personOnBoard = "scientist";
            }
        } else if (this.progressIndex == Progress.starsatArrivedAftermath) {
            game.camera.mode = TrackingMode.sillyCam;
            if (game.player.position.distanceSquared(this.starsat.position) > 2000 ** 2) {
                game.voice.say("41s");
                this.progressIndex = Progress.starsatDepartedAftermath;
                this.storyTimer = 0;
                this.delayedDialogueUsed = false;
            }
        } else if (this.progressIndex == Progress.starsatDepartedAftermath) {
            game.camera.mode = TrackingMode.sillyCam;
            if (this.storyTimer >= 3 && !this.delayedDialogueUsed) {
                game.player.moneyTransfer(-this.loan, "Loan - Interest");
                game.voice.say("42s");
                game.voice.say("43s");
                game.voice.say("44s");
                this.delayedDialogueUsed = true;
            }
            if (game.player.position.distanceSquared(this.gate.position) < 1000 ** 2) {
                this.progressIndex = Progress.gateArrivedAftermath;
                game.voice.say("45s");
                this.personOnBoard = false;
                this.gate.services = [
                    {
                        name: "The experiment",
                        description: "Signed release of liability\nParticipate in the experiment",
                        image: "scientist",
                        value: "cost: signed release of liability",
                        condition: () => false,
                        action: () => {},
                    },
                ];
                game.ui.stationUi(this.gate);
                this.releaseOfLiability = Item.fromType(ItemType.releaseOfLiability);
                game.stash.items.push(this.releaseOfLiability);
                this.releaseOfLiability.stashed = false;
                game.ui.renderStash();
            }
        } else if (this.progressIndex == Progress.gateArrivedAftermath) {
            if (this.releaseOfLiability == undefined) {
                this.releaseOfLiability = Item.fromType(ItemType.releaseOfLiability);
                game.stash.items.push(this.releaseOfLiability);
                this.releaseOfLiability.stashed = false;
                game.ui.renderStash();
            }
            if (this.releaseOfLiability.points.length > 20) {
                game.player.stats.drag = 0.99;
                this.nightmare.startIntermission(new CrowIntroIntermission());
                this.progressIndex = Progress.goldenStar;
                this.useStarLogic = true;
                game.softClear();
                game.stars[0].color = 0xffffaa;
                game.stars[0].size = 500;
                characters["x"].color = 0xffff00;
                characters["x"].name = "Joyful Star";
                const count = 300;
                for (let index = 0; index < count; index++) {
                    const pos = Vector.fromAngle((index / count) * Math.PI * 2).mult(3000 + Math.random() * 1000);
                    GoldenDust.create(pos);
                }
                game.player.teleport(-10000, 0);
                game.player.velocity.set(0, 0);
                this.stingerPlayed = false;
            }
        } else if (this.progressIndex == Progress.goldenStar) {
            if (this.stingerPlayed == false) {
                this.stingerPlayed = true;
                game.music.sounds.piano1.play();
            }
            if (game.player.position.distanceSquared(game.stars[0].position) < 5000 ** 2) {
                game.voice.say("S3n");
                game.voice.say("S4x");
                game.voice.say("S5n");
                game.voice.say("S6ax");
                game.voice.say("S6bx");
                this.progressIndex = Progress.goldenStarListening;
            }
        } else if (this.progressIndex == Progress.goldenStarListening) {
            game.camera.target = game.stars[0];
            game.camera.mode = TrackingMode.playerAndTarget;
            if (game.voice.isSaying == false && game.voice.queue.length == 0) {
                this.progressIndex = Progress.goldenStarDone;
            }
        } else if (this.progressIndex == Progress.goldenStarDone) {
            if (game.player.position.distanceSquared(game.stars[0].position) > 10000 ** 2) {
                this.progressIndex = Progress.lonelyStar;
                this.nightmare.startIntermission(new GoldenRecordIntermission());
                game.softClear();
                characters["x"].color = 0xccccdd;
                characters["x"].name = "Lonely Star";
                game.stars[0].color = 0xccccdd;
                game.stars[0].size = 800;
                this.stingerPlayed = false;
                game.player.teleport(-10000, 0);
                game.player.velocity.set(0, 0);
            }
        } else if (this.progressIndex == Progress.lonelyStar) {
            if (this.stingerPlayed == false) {
                this.stingerPlayed = true;
                game.music.sounds.piano2.play();
            }
            if (game.player.position.distanceSquared(game.stars[0].position) < 5000 ** 2) {
                game.voice.say("S7n");
                game.voice.say("S8x");
                game.voice.say("S9n");
                game.voice.say("S10x");
                game.voice.say("S11n");
                this.progressIndex = Progress.lonelyStarListening;
            }
        } else if (this.progressIndex == Progress.lonelyStarListening) {
            game.camera.target = game.stars[0];
            game.camera.mode = TrackingMode.playerAndTarget;
            if (game.voice.isSaying == false && game.voice.queue.length == 0) {
                this.progressIndex = Progress.lonelyStarDone;
            }
        } else if (this.progressIndex == Progress.lonelyStarDone) {
            if (game.player.position.distanceSquared(game.stars[0].position) > 10000 ** 2) {
                this.progressIndex = Progress.regretStar;
                game.softClear();
                characters["x"].color = 0xff6666;
                characters["x"].name = "Regreful Star";
                game.stars[0].color = 0xff6666;
                game.stars[0].size = 800;
                this.nightmare.startIntermission(new EmptyIntermission());
                const asteroid = new Asteroid(1000);
                const pos = new Vector(2000, -3000);
                asteroid.position.set(pos.x, pos.y);
                asteroid.updateHitbox();
                game.asteroids.push(asteroid);
                this.stingerPlayed = false;
                game.player.teleport(-10000, 0);
                game.player.velocity.set(0, 0);
            }
        } else if (this.progressIndex == Progress.regretStar) {
            if (this.stingerPlayed == false) {
                this.stingerPlayed = true;
                game.music.sounds.piano1.play();
            }
            if (game.player.position.distanceSquared(game.stars[0].position) < 5000 ** 2) {
                game.voice.say("S12n");
                game.voice.say("S13x");
                game.voice.say("S14n");
                game.voice.say("S15x");
                this.progressIndex = Progress.regretStarListening;
            }
        } else if (this.progressIndex == Progress.regretStarListening) {
            game.camera.target = game.stars[0];
            game.camera.mode = TrackingMode.playerAndTarget;
            if (game.voice.isSaying == false && game.voice.queue.length == 0) {
                this.progressIndex = Progress.regretStarDone;
            }
        } else if (this.progressIndex == Progress.regretStarDone) {
            if (game.player.position.distanceSquared(game.stars[0].position) > 10000 ** 2) {
                this.progressIndex = Progress.hopeStar;
                game.softClear();
                this.nightmare.startIntermission(new EmptyIntermission());
                game.stars[0].color = 0xccccff;
                game.stars[0].size = 800;
                characters["x"].color = 0xccccff;
                characters["x"].name = "Hopeful Star";
                for (let index = 0; index < 10; index++) {
                    const asteroid = new Asteroid(100 + Math.abs(Math.sin(index * 4.3)) * 10);
                    const angle = (index / 10) * Math.PI * 2;
                    const pos = Vector.fromAngle(angle).mult(2000 + 3000 * Math.abs(Math.cos(index)));
                    asteroid.position.set(pos.x, pos.y);
                    asteroid.updateHitbox();
                    game.asteroids.push(asteroid);
                }
                this.stingerPlayed = false;
                game.player.teleport(-10000, 0);
                game.player.velocity.set(0, 0);
            }
        } else if (this.progressIndex == Progress.hopeStar) {
            if (this.stingerPlayed == false) {
                this.stingerPlayed = true;
                game.music.sounds.piano2.play();
            }
            if (game.player.position.distanceSquared(game.stars[0].position) < 5000 ** 2) {
                game.voice.say("S21n");
                game.voice.say("S22x");
                game.voice.say("S23n");
                game.voice.say("S24x");
                this.progressIndex = Progress.hopeStarListening;
            }
        } else if (this.progressIndex == Progress.hopeStarListening) {
            game.camera.target = game.stars[0];
            game.camera.mode = TrackingMode.playerAndTarget;
            if (game.voice.isSaying == false && game.voice.queue.length == 0) {
                this.progressIndex = Progress.hopeStarDone;
            }
        } else if (this.progressIndex == Progress.hopeStarDone) {
            if (game.player.position.distanceSquared(game.stars[0].position) > 10000 ** 2) {
                this.progressIndex = Progress.final;
                game.softClear();
                this.nightmare.startIntermission(new FinalIntermission());
            }
        }

        if (this.cruiser) {
            this.cruiserGun.rotation = Math.sin(game.time * 0.01) / 5;
            this.cruiserLogic.update(dt);
        }

        if (game.ghost) {
            if (this.wasGhostVisible && !game.ghost.isVisible && this.progressIndex == Progress.planB && this.storyTimer > 10) {
                if (this.hiddenLine == 0) {
                    game.voice.say("37m");
                } else {
                    game.voice.say("38m");
                }
                this.hiddenLine++;
            }
            this.wasGhostVisible = game.ghost.isVisible;

            if (this.wasGhostVisible && this.progressIndex == Progress.planB && this.storyTimer > 10) {
                this.targetingProgress += dt / 60;
            } else {
                this.targetingProgress -= (dt / 60) * 2;
            }
            this.targetingProgress = clamp(this.targetingProgress, 0, this.targetingProgressCap);
        }

        if (!this.isNightmare) {
            if (!game.ghost && !this.useAftermathLogic) {
                this.restrictedAreaCheck();
            }
            this.foodDelivery();
            this.customers(dt);
        }

        this.barcheck();
        this.tutorial();
    }

    licenseCheck() {
        if (!(game.player.license > 0)) {
            game.voice.say("3a");
            game.player.moneyTransfer(-10, "Fine - No License");
        }
    }

    restrictedAreaCheck() {
        if (game.stations.some((s) => s.shipInRestrictedArea) && game.player.restrictedAreaBypass <= 0) {
            if (game.player.license > 0) {
                game.voice.say("1a");
                game.player.license = 0;
            } else {
                game.voice.say("2a");
                game.player.moneyTransfer(-15, "Fine - Unauthorized Entry");
            }
            game.player.restrictedAreaBypass = 10;
        }
    }

    getProgress() {
        if (this.progressIndex == Progress.planB && this.storyTimer > 10) {
            return {
                text: "Targeting Ghost",
                color: this.wasGhostVisible ? 0x559955 : 0xff5555,
                ratio: this.targetingProgress / this.targetingProgressCap,
            };
        } else {
            return false;
        }
    }

    foodDeliveryStatus = 0;
    foodCustomer: { position: Vector } | null = null;
    foodName: string | null = null;
    foodDeliveryIndex = 0;
    foodDelivery() {
        if (this.foodDeliveryStatus == 0) {
            if (!this.allowFoodDelivery) return;
            const targetOptions = [
                { name: "Gate", target: this.gate },
                { name: "Star Satelite", target: this.starsat },
                { name: "IVA", target: this.iva },
            ];

            const selected = targetOptions[this.foodDeliveryIndex % targetOptions.length];
            this.foodCustomer = selected.target;
            this.foodName = selected.name;

            this.blob.services.push({
                name: "Food Delivery",
                description: "Customer - repeatable\n" + selected.name,
                image: null,
                action: () => {
                    game.story.blob.services = game.story.blob.services.filter((s) => s.name != "Food Delivery");
                    game.ui.stationUi(game.story.blob);
                    this.foodDeliveryStatus = 2;
                },
            });

            this.foodDeliveryStatus = 1;
        }

        if (this.foodDeliveryStatus == 2) {
            if (this.foodCustomer.position.distanceSquared(game.player.position) < 1000 ** 2) {
                this.foodDeliveryStatus = 0;
                game.player.moneyTransfer(10, "Fare - Food Delivery");
                this.foodDeliveryIndex++;
            }
        }
    }

    customerStatus = 0;
    customerTimer = 0;
    customerIndex = 0;
    currentCustomerFrom: Station;
    currentCustomerTo: Station;
    customers(dt: number) {
        if (this.customerStatus == 0) {
            if (!this.allowCustomers) return;
            const options = [
                { from: this.gate, to: this.blob },
                { from: this.iva, to: this.gate },
                { from: this.blob, to: this.iva },
                { from: this.gate, to: this.iva },
                { from: this.blob, to: this.gate },
                { from: this.iva, to: this.blob },
            ];

            const selected = options[this.customerIndex % options.length];
            this.currentCustomerTo = selected.to;
            this.currentCustomerFrom = selected.from;

            game.voice.say("f" + this.currentCustomerFrom.name[0].toLocaleLowerCase() + "c");
            game.voice.say("t" + this.currentCustomerTo.name[0].toLocaleLowerCase() + "c");

            selected.from.services.push({
                name: "Regular Customer",
                description: "Customer - repeatable\n" + selected.to.name,
                image: "customer",
                action: () => {
                    selected.from.services = selected.from.services.filter((s) => s.name != "Regular Customer");
                    game.ui.stationUi(selected.from);
                    this.customerStatus = 2;
                    game.voice.say("t" + this.currentCustomerTo.name[0].toLocaleLowerCase() + "c");
                    this.personOnBoard = "customer";
                },
                condition: () => !this.personOnBoard,
            });
            this.customerStatus = 1;
        }

        if (this.customerStatus == 2) {
            if (this.currentCustomerTo.position.distanceSquared(game.player.position) < 1000 ** 2) {
                this.customerStatus = 3;
                this.customerTimer = 60;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Customer");
                this.personOnBoard = false;
                this.customerIndex++;
            }
        }

        if (this.customerStatus == 3) {
            this.customerTimer -= dt / 60;
            if (this.customerTimer <= 0) {
                this.customerStatus = 0;
            }
        }
    }

    nightmareIndex = 0;
    awaitingBar = false;
    bartend() {
        this.nightmareIndex++;
        this.gate.services = this.gate.services.filter((s) => s.name != "Get a drink");

        this.gate.services.push({
            name: "Get a drink",
            description: "Bar - side content",
            image: "bartender",
            value: "cost: 3c",
            action: () => {
                this.gate.services = this.gate.services.filter((s) => s.name != "Get a drink");
                game.ui.stationUi(this.gate);
                game.voice.say(this.nightmareIndex + "b");
                this.awaitingBar = true;
                game.player.moneyTransfer(-3, "Bar");
            },
            condition: () => game.player.money >= 3,
        });
    }

    barcheck() {
        if (game.voice.queue.length == 0 && this.awaitingBar && game.voice.isSaying == false) {
            this.awaitingBar = false;
            if (this.nightmareIndex == 1) {
                this.nightmare.selectedNightmare = new LightsNightmare();
                this.nightmare.start();
            }

            if (this.nightmareIndex == 2) {
                this.nightmare.selectedNightmare = new MissilesNightmare();
                this.nightmare.start();
            }
        }
    }

    getHint() {
        const primary = missionHints[this.progressIndex];
        let secondary = "";
        if (this.customerStatus == 1) {
            secondary += "\ncustomer waiting at " + this.currentCustomerFrom.name;
        }
        if (this.customerStatus == 2) {
            secondary += "\ndrop off customer at " + this.currentCustomerTo.name;
        }
        if (this.foodDeliveryStatus == 2) {
            secondary += "\ndeliver food to " + this.foodName;
        }
        return primary + secondary;
    }

    tutorialIndex = 0;
    maxTutorialIndex = 2;
    isTutorial = false;
    tutorial() {
        if (!this.isTutorial && this.tutorialIndex < this.maxTutorialIndex && game.ui.tutorialCompletedFadeout <= 0) {
            this.isTutorial = true;
            game.ui.setTutorialText(tutorials[this.tutorialIndex].text);
        }

        if (this.isTutorial) {
            if (tutorials[this.tutorialIndex].checker()) {
                this.tutorialIndex++;
                this.isTutorial = false;
                game.ui.completeTutorial();
            }
        }
    }
}

export function getLoanOptions(): Array<StationService> {
    const result = [];
    if (game.stash.items.some((i) => i.type == ItemType.loanForm)) {
        result.push({
            name: "Submit Form",
            description: `Return filled out for.\nYou currently owe ${game.story.loan * 100}c`,
            value: `cost: 1 form`,
            action: () => {
                const form = game.stash.items.find((i) => i.type == ItemType.loanForm);
                const result = form.evaluateLoan();

                if (result) {
                    if (result.loan != result.payoff) {
                        if (result.sign) {
                            if (result.loan) {
                                if (game.story.loan < 5) {
                                    game.story.loan++;
                                    game.player.moneyTransfer(100, "Loan - borrow");
                                    game.voice.say("4t");
                                } else {
                                    //too much
                                    game.voice.say("5t");
                                }
                            } else {
                                if (game.story.loan > 0) {
                                    if (game.player.money >= 100) {
                                        game.story.loan--;
                                        game.player.moneyTransfer(-100, "Loan - pay off");
                                        game.voice.say("4t");
                                    } else {
                                        //not enough
                                        game.voice.say("6t");
                                    }
                                } else {
                                    //no loan
                                    game.voice.say("7t");
                                }
                            }
                        } else {
                            //signature
                            game.voice.say("3t");
                            return;
                        }
                    } else if (result.loan) {
                        //both
                        game.voice.say("2t");
                    } else {
                        //none
                        game.voice.say("2t");
                        return;
                    }
                } else {
                    //don't scribble
                    game.voice.say("1t");
                }

                form.remove();

                game.story.iva.services = game.story.iva.services.filter((s) => s.name != "Submit Form");
                game.story.iva.services.push(...getLoanOptions());
                game.ui.stationUi(game.story.iva);
                game.ui.renderStash();
            },
        });
    } else {
        result.push({
            name: "Get Form",
            description: `Request a form that you can fill out and return for processing.`,
            value: `cost: free`,
            action: () => {
                game.stash.items.push(Item.fromType(ItemType.loanForm));
                game.ui.stashOpen = true;

                game.story.iva.services = game.story.iva.services.filter((s) => s.name != "Get Form");
                game.story.iva.services.push(...getLoanOptions());
                game.ui.stationUi(game.story.iva);
                game.ui.renderStash();
            },
        });
    }
    return result;
}

const missionHints: Partial<Record<Progress, string>> = {
    [Progress.nothing]: "Await instructions",
    [Progress.start]: "Go to the Sun Satellite (yellow marker)",
    [Progress.sunSatReached]: "Approach Blob (red marker)",
    [Progress.blobApproach]: "Reach Blob (red marker)",
    [Progress.blobReached]: "Pick up Robot from Blob",
    [Progress.robotFirstTripReady]: "Leave Blob",
    [Progress.robotFirstTripDeparted]: "Go to IVA (blue marker)",
    [Progress.robotFirstTripArrived]: "Leave IVA",
    [Progress.scientistCalling]: "Go to Blob (red marker)",
    [Progress.returnToBlob]: "Pick up Scientist from Blob",
    [Progress.departedFromBlob]: "Go to Gate (purple marker)",
    [Progress.scientistReachedGate]: "Leave Gate",
    [Progress.scientistDepartGate]: "Approach Star Satelite (yellow marker)",
    [Progress.scientistReachedStarSat]: "Look for opportunities",
    [Progress.psychologistDepartGate]: "Approach IVA (blue marker)",
    [Progress.psychologistArriveIva]: "Look for opportunities, wait for Psychologist",
    [Progress.psychologistCalling]: "Pick up Psychologist from IVA (blue marker)",
    [Progress.psychologistDepartedIva]: "Go to Gate (purple marker)",
    [Progress.psychologistArrivedGate]: "LeaveGate",
    [Progress.approachCruiser]: "Locate Cruiser (green marker), seen from IVA (blue marker)",
    [Progress.loadPersonellForGate]: "Pickup a lookout from Cruiser",
    [Progress.departCruiserToGate]: "Leave Cruiser",
    [Progress.deliverPersonellForGate]: "Deliver personell to Gate (purple marker)",
    [Progress.loadPersonellForBlob]: "Return to Cruiser (green marker), seen from Blob (red marker)",
    [Progress.deliverPersonellForBlob]: "Deliver personell to Blob (red marker)",
    [Progress.loadPersonellForIva]: "Return to Cruiser (green marker), seen from Gate (purple marker)",
    [Progress.departCruiserToIva]: "Leave Cruiser",
    [Progress.deliverPersonellForIva]: "Deliver personell to IVA (blue marker)",
    [Progress.allPersonellDelivered]: "Await instructions",
    [Progress.spotted]: "Panic?",
    [Progress.panic]: "Panic!",
    [Progress.planB]: "Stay near Ghost to keep it Visible",
    [Progress.targetingComplete]: "Get clear of Ghost",
    [Progress.ghostBusted]: "",
    [Progress.aftermath]: "Visit the Scientist at the Star Satelite",
    [Progress.starsatArrivedAftermath]: "Leave the Star Satelite",
    [Progress.starsatDepartedAftermath]: "Land at the Gate",
    [Progress.gateArrivedAftermath]: "Sign the General release of liability",
};

type Tutorial = { text: string; checker: () => boolean };

const tutorials: Tutorial[] = [
    {
        text: "WASD to move around",
        checker: () => game.player.velocity.x != 0 || game.player.velocity.y != 0,
    },
    {
        text: "Scroll to zoom",
        checker: () => game.camera.zoom < 0.25,
    },
    {
        text: "Mouse to rotate your ship",
        checker: () => game.player.totalRotation > 30,
    },
    {
        text: "SPACE to brake",
        checker: () => game.player.control.brake,
    },
    {
        text: "You may only have ONE passanger at a time\nCustomers can wait",
        checker: () => game.story.personOnBoard == false,
    },
    {
        text: "Cross off 'Get a job' from your TODO list\n(see your stash to the right)",
        checker: () => game.stash.items.find((i) => i.type == ItemType.stickyNote).points.length > 5,
    },
    {
        text: "Click to boost",
        checker: () => game.player.boostCooldown > 0,
    },
];
