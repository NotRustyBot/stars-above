import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import { game } from "./game";
import { Player } from "./player";
import { Vector } from "./types";
import { TrackingMode } from "./camera";

export class Nightmare {
    savedCoordinate: Vector = new Vector(0, 0);

    start() {
        game.story.isNightmare = true;
        this.savedCoordinate.set(game.player.position.x, game.player.position.y);
        this.fadeInTimer = 1;
        this.ready = false;
        this.savedStats = { ...game.player.stats };
    }

    startIntermission(nightmare: NightmareInstance) {
        game.realContainer.visible = false;
        game.ui.topBarContainer.visible = false;
        game.ui.stashContainer.visible = false;
        game.itemContainer.visible = false;
        game.ui.stationContainer.visible = false;
        game.starMaskContainer.visible = false;
        game.story.isNightmare = true;
        game.uiUnderContainer.alpha = this.fadeInTimer;
        game.background.currentColor = 0x000000;
        this.selectedNightmare = nightmare;
        nightmare.setup();
        this.ready = true;
    }

    endIntermission() {
        game.realContainer.visible = true;
        game.story.isNightmare = false;
        game.starMaskContainer.visible = true;
        game.background.currentColor = game.background.color;
        game.intermissionContainer.removeChildren();
    }

    fadeInTimer = 0;
    ready = false;
    selectedNightmare?: NightmareInstance;
    savedStats: Player["stats"];
    fadeIn(dt: number) {
        this.fadeInTimer -= dt / 60;
        game.uiContainer.alpha = this.fadeInTimer;
        game.objectContainer.alpha = this.fadeInTimer;
        game.glowContainer.alpha = this.fadeInTimer;
        game.trailContainer.alpha = this.fadeInTimer;
        game.realUiContainer.alpha = this.fadeInTimer;
        game.uiUnderContainer.alpha = this.fadeInTimer;
        game.camera.targetZoom = 1 - this.fadeInTimer;
        game.background.fateToNightmare(this.fadeInTimer);

        if (this.fadeInTimer <= 0) {
            this.fadeInTimer = 0;
            this.ready = true;
            game.player.teleport(0, 0);
            game.player.velocity.set(0, 0);
            this.selectedNightmare.setup();
            game.player.hitbox.group = 0;
        }
    }

    update(dt: number) {
        if (!this.ready) {
            this.fadeIn(dt);
        } else {
            this.selectedNightmare.update(dt);
        }
    }

    end() {
        game.player.hitbox.group = 0x7fffffff;
        game.nightmareContainer.removeChildren();
        game.background.currentColor = game.background.color;
        game.uiContainer.alpha = 1;
        game.objectContainer.alpha = 1;
        game.glowContainer.alpha = 1;
        game.trailContainer.alpha = 1;
        game.realUiContainer.alpha = 1;
        game.uiUnderContainer.alpha = 1;
        game.story.isNightmare = false;
        game.player.teleport(this.savedCoordinate.x, this.savedCoordinate.y);
        game.camera.position.set(0, 0);
        game.player.stats = this.savedStats;
    }
}

abstract class NightmareInstance {
    setup() {}
    abstract update(dt: number);
}

const rates = {
    C4: 1.0,
    "C#4": 1.0595,
    D4: 1.1225,
    "D#4": 1.1892,
    E4: 1.2599,
    F4: 1.3348,
    "F#4": 1.4142,
    G4: 1.4983,
    "G#4": 1.5874,
    A4: 1.6818,
    "A#4": 1.7818,
    B4: 1.8877,
    C5: 2.0,
};

export class LightsNightmare extends NightmareInstance {
    timer = 0;
    lightFound = false;
    notes = ["C4", "E4", "G4", "D4", "C5"] as Array<keyof typeof rates>;

    index = 0;
    light: Sprite;
    setup(): void {
        game.player.stats.baseThrust = 0.1;
        this.light = new Sprite(Assets.get("light"));
        this.light.alpha = 0;
        this.light.anchor.set(0.5, 0.5);
        this.light.position.x = 1000;
        game.nightmareContainer.addChild(this.light);
        const minilight = new Sprite(Assets.get("light"));
        minilight.alpha = 0.1;
        minilight.anchor.set(0.5, 0.5);
        minilight.scale.set(10);
        this.light.addChild(minilight);
    }

    update(dt: number) {
        this.timer += dt / 60;
        game.camera.targetZoom = Math.max(0.5, game.camera.targetZoom);
        if (game.player.position.distanceSquared(this.light.position) < 300 ** 2 && !this.lightFound) {
            game.music.sounds.key.rate(rates[this.notes[this.index++]]);
            game.music.sounds.key.play();
            this.lightFound = true;
        }

        if (this.lightFound) {
            if (this.index == this.notes.length) {
                this.light.scale.set(this.light.scale.x + dt);
                this.light.alpha += dt / 60;
                if (this.light.scale.x >= 100) {
                    game.camera.mode = TrackingMode.playerSoft;
                    game.story.nightmare.end();
                }
            } else {
                this.light.alpha -= dt / 60;
                this.light.scale.set(this.light.scale.x + 1 - this.light.alpha);
            }
            if (this.light.alpha <= 0) {
                const pos = game.player.position.result().add(Vector.fromAngle(Math.random() * Math.PI * 2).mult(2000));

                this.light.position.set(pos.x, pos.y);
                this.lightFound = false;
            }
        } else {
            if (this.light.alpha < 0.5) {
                this.light.alpha += dt / 60;
            }

            this.light.scale.set(Math.sin(this.timer * 2) / 5 + Math.sin(this.timer * 10) / 10 + 2);
        }

        game.camera.target = this.light;
        game.camera.mode = TrackingMode.playerAndTarget;
    }
}

export class LightsNightmareBad extends NightmareInstance {
    timer = 0;
    lightFound = false;
    notes = ["G4", "G#4", "D4", "D#4", "C5"] as Array<keyof typeof rates>;

    index = 0;
    light: Sprite;
    setup(): void {
        game.player.stats.baseThrust = 0.1;
        game.player.stats.drag = 0.99;
        this.light = new Sprite(Assets.get("light"));
        this.light.alpha = 0;
        this.light.anchor.set(0.5, 0.5);
        this.light.position.x = 1000;
        game.nightmareContainer.addChild(this.light);

        const minilight = new Sprite(Assets.get("light"));
        minilight.alpha = 0.1;
        minilight.anchor.set(0.5, 0.5);
        minilight.scale.set(10);
        this.light.addChild(minilight);
    }

    update(dt: number) {
        this.timer += dt / 60;
        game.camera.targetZoom = Math.max(0.5, game.camera.targetZoom);
        if (game.player.position.distanceSquared(this.light.position) < 300 ** 2 && !this.lightFound) {
            if (this.index == 1) {
                this.light.tint = 0xff0000;
            } else if (this.index == 2) {
                this.light.tint = 0xffffff;
            } else if (this.index == 3) {
                this.light.tint = 0xff0000;
            } else if (this.index == 4) {
                this.light.tint = 0xffffff;
            }
            game.music.sounds.key.rate(rates[this.notes[this.index++]]);
            game.music.sounds.key.play();
            this.lightFound = true;
        }

        if (this.lightFound) {
            if (this.index == this.notes.length) {
                this.light.scale.set(this.light.scale.x + dt);
                this.light.alpha += dt / 60;
                if (this.light.scale.x >= 100) {
                    game.camera.mode = TrackingMode.playerSoft;
                    game.story.nightmare.end();
                }
            } else {
                this.light.alpha -= dt / 60;
                this.light.scale.set(this.light.scale.x + 1 - this.light.alpha);
            }
            if (this.light.alpha <= 0) {
                const pos = game.player.position.result().add(Vector.fromAngle(Math.random() * Math.PI * 2).mult(2000));
                this.light.tint = 0xffffff;

                this.light.position.set(pos.x, pos.y);
                this.lightFound = false;
            }
        } else {
            if (this.light.alpha < 0.5) {
                this.light.alpha += dt / 60;
            }

            this.light.scale.set(Math.sin(this.timer * 2) / 5 + Math.sin(this.timer * 10) / 10 + 2);
        }

        game.camera.target = this.light;
        game.camera.mode = TrackingMode.playerAndTarget;
    }
}

export class MissilesNightmare extends NightmareInstance {
    timer = 0;
    light: Sprite;
    lightFound: boolean;
    distance = 3000;
    setup(): void {
        game.player.stats.baseThrust = 0.1;
        this.light = new Sprite(Assets.get("light"));
        this.light.alpha = 0;
        this.light.anchor.set(0.5, 0.5);
        this.light.position.x = 4000;
        game.nightmareContainer.addChild(this.light);
    }

    update(dt: number) {
        this.timer += dt / 60;
        game.camera.targetZoom = Math.max(0.5, game.camera.targetZoom);
        if (game.player.position.distanceSquared(this.light.position) < 3000 ** 2 && !this.lightFound) {
            this.lightFound = true;
            this.light.tint = 0xff0000;
        }

        if (this.lightFound) {
            const newPos = game.player.position.diff(this.light.position).normalize().mult(-this.distance).add(game.player.position);
            this.light.position.set(newPos.x, newPos.y);
            this.distance -= dt * 10;
            this.light.scale.set(Math.sin(this.timer * 20) / 5 + 1);
        }

        if (game.player.position.distanceSquared(this.light.position) < 100 ** 2) {
            game.music.sounds.inhale.play();
            game.camera.mode = TrackingMode.playerSoft;
            game.story.nightmare.end();
        }

        if (this.light.alpha < 0.5) {
            this.light.alpha += dt / 60;
        }

        game.camera.target = this.light;
        game.camera.mode = TrackingMode.playerAndTarget;
    }
}

export class CrowIntroIntermission extends NightmareInstance {
    setup() {
        game.voice.say("S1n");
        game.voice.say("S2n");
    }

    update(dt: number) {
        if (!game.voice.isSaying && game.voice.queue.length == 0) {
            game.story.nightmare.endIntermission();
        }
    }
}

export class GoldenRecordIntermission extends NightmareInstance {
    timer = 0;
    pic1: Sprite;
    background: Sprite;

    setup() {
        game.voice.say("I1n");
        game.background.color = 0x000000;
        this.pic1 = new Sprite(Assets.get("record1"));
        this.pic1.anchor.set(0.5, 0.5);
        this.pic1.position.set(window.innerWidth / 2, window.innerHeight / 2);
        this.pic1.visible = false;
        this.background = new Sprite(Assets.get("light"));
        this.background.anchor.set(0.5, 0.5);
        this.background.scale.set(5);
        this.background.position.set(window.innerWidth / 2, window.innerHeight / 2);
        this.background.visible = false;
        this.background.alpha = 0.1;

        game.intermissionContainer.addChild(this.background);
        game.intermissionContainer.addChild(this.pic1);
    }

    update(dt: number) {
        this.timer += dt / 60;
        this.background.scale.set(5 + Math.sin(this.timer * 100) / 2);
        if (this.timer % 12 > 2 && this.timer % 12 < 11 && this.pic1.visible == false) {
            this.pic1.visible = true;
            this.background.visible = true;
            game.music.sounds.click.play();
        }

        if (this.timer % 12 > 11 && this.pic1.visible == true) {
            this.pic1.visible = false;
            this.background.visible = false;
            game.music.sounds.click.play();
        }

        if (this.timer > 12) {
            this.pic1.texture = Assets.get("record2");
        }
        if (this.timer > 24) {
            this.pic1.texture = Assets.get("record3");
        }

        if (this.timer > 36) {
            game.story.nightmare.endIntermission();
        }
    }
}

export class EmptyIntermission extends NightmareInstance {
    timer = 0;
    text: Text;
    static first = true;
    setup() {
        this.text = new Text({ style: { fontFamily: "Arial", fontSize: 20, fill: 0xffffff, align: "center" } });
        this.text.text = "";
        if (EmptyIntermission.first) {
            this.text.text = "[This page is purposefully left blank]";
            EmptyIntermission.first = false;
        }
        this.text.anchor.set(0.5, 0.5);
        this.text.x = window.innerWidth / 2;
        this.text.y = window.innerHeight / 2;
        game.intermissionContainer.addChild(this.text);
    }

    update(dt: number) {
        this.timer += dt / 60;
        if (this.timer > 3) {
            game.story.nightmare.endIntermission();
        }
    }
}

export class FinalIntermission extends NightmareInstance {
    timer = 0;
    text: Text;
    spawnButton(data: string) {
        const container = new Container();
        const bg = new Graphics();
        bg.rect(0, 0, 200, 50).fill(0xffffff);
        bg.tint = 0x111111;
        container.interactive = true;
        container.on("mouseenter", () => (bg.tint = 0x333333));
        container.on("mouseleave", () => (bg.tint = 0x111111));

        const text = new Text({ style: { fontFamily: "Arial", fontSize: 20, fill: 0xffffff, align: "center" } });
        text.text = data;
        text.anchor.set(0.5, 0.5);
        text.x = 100;
        text.y = 25;
        container.addChild(bg, text);
        container.on("click", () => {
            this.anyButtonPressed();
            post(data);
        });
        game.intermissionContainer.addChild(container);
        return container;
    }

    anyButtonPressed() {
        game.intermissionContainer.removeChildren();
        this.credits = true;

        this.text = new Text({ style: { fontFamily: "Arial", fontSize: 20, fill: 0xffffff, align: "center" } });
        this.text.visible = false;
        this.text.text = "";
        this.text.anchor.set(0.5, 0.5);
        this.text.x = window.innerWidth / 2;
        this.text.y = window.innerHeight / 2;
        game.intermissionContainer.addChild(this.text);
    }

    setup() {
        game.voice.say("S25n");
        game.voice.say("S26n");
    }

    notReady = true;
    credits = false;

    creditTexts = [
        "STARDRAWN",
        "game by NotRustyBot",
        "(the whole thing)",
        "(code, music, sounds, graphics, voiceacting ...)",
        "(apart from the NASA images)",
        "story revised by claude.ai",
        "* story of The Crow Who Listened to Stars",
        "For F.U.N. Jam 2",
        "I hope you had fun",
    ];
    creditIndex = 0;

    update(dt: number) {
        this.timer += dt / 60;
        if (!game.voice.isSaying && game.voice.queue.length == 0 && this.notReady) {
            this.notReady = false;
            this.spawnButton("Joy").position.set(window.innerWidth / 3 - 100, window.innerHeight / 3);
            this.spawnButton("Loneliness").position.set((window.innerWidth / 3) * 2 - 100, window.innerHeight / 3);
            this.spawnButton("Regret").position.set(window.innerWidth / 3 - 100, (window.innerHeight / 3) * 2);
            this.spawnButton("Hope").position.set((window.innerWidth / 3) * 2 - 100, (window.innerHeight / 3) * 2);
        }

        const length = 7;

        if (this.credits) {
            if (this.creditIndex == this.creditTexts.length) return;
            this.text.x = window.innerWidth / 2;
            this.text.y = window.innerHeight / 2;
            this.timer += dt / 60;
            if (this.timer % length > 1 && this.timer % length < length - 1 && this.text.visible == false) {
                this.text.visible = true;
                game.music.sounds.click.play();
                this.text.text = this.creditTexts[this.creditIndex++];
            }

            if (this.timer % length > length - 1 && this.text.visible == true) {
                game.music.sounds.click.play();
                this.text.visible = false;
            }
        }
    }
}

function post(data: string) {
    fetch("https://discord.com/api/webhooks/1310214148558426202/3rJs8mL8bbbd9e33NGcX1kgB7GpC7oPsm2y8VzqoACA_uPnfss8Ct2xNubNIsnqNFnfb", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: data,
        }),
    });
}
