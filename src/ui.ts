import { Assets, Container, Graphics, NineSliceSprite, Sprite, Text } from "pixi.js";
import { game } from "./game";
import { clamp, fitImage } from "./utils";
import { Station } from "./station";

export class Ui {
    subtitlesName: Text;
    subtitles: Text;
    pfp: Sprite;
    pfpBg: Sprite;
    screenEdge: NineSliceSprite;
    starMask: Graphics;

    customerContainer = new Container();
    customerTitle: Text;
    customerPfp: Sprite;

    topBarContainer: Container;
    topBarBg: Graphics;
    hint: Text;
    money: Text;
    moneyChange: Text;
    moneyChangeReason: Text;
    license: Text;
    licenseHeader: Text;

    stationContainer = new Container();

    stashContainer = new Container();
    stashItemContainer = new Container();
    stashBg: Graphics;
    stashTab: Graphics;
    stashTitle: Text;

    boostGraphic: Graphics;

    stashOpen = false;

    constructor() {
        this.starMask = new Graphics();
        game.realUiContainer.addChild(this.starMask);
        this.screenEdge = new NineSliceSprite({
            texture: Assets.get("screenEdge"),
            topHeight: 15,
            bottomHeight: 15,
            leftWidth: 15,
            rightWidth: 15,
        });

        this.screenEdge.mask = this.starMask;
        this.screenEdge.alpha = 0.5;
        game.uiContainer.addChild(this.screenEdge);

        this.subtitlesName = new Text({ style: { fontSize: 30, align: "center" } });
        this.subtitlesName.anchor.set(0.5, 0);
        game.uiContainer.addChild(this.subtitlesName);

        this.subtitles = new Text({ style: { fontSize: 24, wordWrap: true, align: "center", fill: 0xffffff } });
        this.subtitles.anchor.set(0.5, 0);
        game.uiContainer.addChild(this.subtitles);

        this.pfpBg = new Sprite();
        this.pfpBg.anchor.set(0.5, 0.5);
        game.uiContainer.addChild(this.pfpBg);

        this.pfp = new Sprite();
        this.pfp.anchor.set(0.5, 0.5);
        game.uiContainer.addChild(this.pfp);

        this.topBarContainer = new Container();
        game.uiContainer.addChild(this.topBarContainer);

        this.boostGraphic = new Graphics();
        game.uiContainer.addChild(this.boostGraphic);

        game.uiContainer.addChild(this.stationContainer);

        this.topBarBg = new Graphics();

        this.money = new Text({ text: "0c", style: { fontSize: 30 } });
        this.money.anchor.set(0, 0.5);

        this.hint = new Text({ text: "", style: { fontSize: 30, align: "center", fill: 0xaaaaaa } });
        this.hint.anchor.set(0.5, 0.5);

        this.moneyChange = new Text({ style: { fontSize: 30 } });
        this.moneyChange.anchor.set(0, 0.5);

        this.moneyChangeReason = new Text({ text: "", style: { fontSize: 30, fill: 0xaaaaaa } });
        this.moneyChangeReason.anchor.set(0, 0.5);

        this.license = new Text({ style: { fontSize: 30 } });
        this.license.anchor.set(0, 0.5);

        this.licenseHeader = new Text({ text: "License", style: { fontSize: 30, fill: 0xaaaaaa } });
        this.licenseHeader.anchor.set(0, 0.5);

        this.topBarContainer.addChild(this.topBarBg);
        this.topBarContainer.addChild(this.money);
        this.topBarContainer.addChild(this.hint);
        this.topBarContainer.addChild(this.moneyChange);
        this.topBarContainer.addChild(this.moneyChangeReason);
        this.topBarContainer.addChild(this.license);
        this.topBarContainer.addChild(this.licenseHeader);

        game.uiContainer.addChild(this.stashContainer);
        this.stashBg = new Graphics();
        this.stashBg.rect(0, 0, 250, 600).fill({ color: 0x000000, alpha: 0.5 });
        this.stashTab = new Graphics();
        this.stashTab.interactive = true;
        this.stashTab.on("click", () => (this.stashOpen = !this.stashOpen));
        this.stashTab.rect(0, 0, 50, 600).fill({ color: 0x000000, alpha: 0.5 });
        this.stashTitle = new Text({ text: "STASH", style: { fontSize: 30, fill: 0x999999, align: "center", letterSpacing: 10 } });
        this.stashTitle.rotation = Math.PI / 2;
        this.stashTitle.y = 300;
        this.stashTitle.anchor.set(0.5, 1);
        this.stashContainer.addChild(this.stashBg);
        this.stashContainer.addChild(this.stashTab);
        this.stashContainer.addChild(this.stashTitle);
        this.stashContainer.addChild(this.stashItemContainer);

        this.topBarContainer.addChild(this.customerContainer);

        this.customerTitle = new Text({ text: "Passenger", style: { fontSize: 30, fill: 0x999999, align: "center" } });
        this.customerPfp = new Sprite();
        this.customerPfp.x = 150;
        this.customerContainer.addChild(this.customerTitle);
        this.customerContainer.addChild(this.customerPfp);

        window.addEventListener("resize", () => {
            this.resize();
        });
        this.resize();

        this.showMoney = game.player.money;
    }

    say(line: string, name: string, color: number) {
        this.subtitles.text = line;
        this.subtitlesName.text = name;
        this.subtitlesName.style.fill = color;
        this.pfp.texture = Assets.get(name.toLowerCase());
        this.pfpBg.texture = Assets.get(name.toLowerCase() + "_bg");
    }

    clearSubtitles() {
        this.subtitles.text = "";
        this.subtitlesName.text = "";
        this.pfp.texture = null;
        this.pfpBg.texture = null;
    }

    resize() {
        this.screenEdge.width = window.innerWidth;
        this.screenEdge.height = window.innerHeight;
        this.subtitles.style.wordWrapWidth = clamp(window.innerWidth / 2, 400, 1000);

        this.pfp.position.set(window.innerWidth / 2 - this.subtitles.style.wordWrapWidth / 2 - 70, window.innerHeight - 100);
        this.pfpBg.position.set(window.innerWidth / 2 - this.subtitles.style.wordWrapWidth / 2 - 70, window.innerHeight - 100);

        this.subtitles.position.set(window.innerWidth / 2, window.innerHeight - 100);
        this.subtitlesName.position.set(window.innerWidth / 2, window.innerHeight - 140);

        this.topBarBg.clear();
        this.topBarBg.rect(0, 0, window.innerWidth, 50);
        this.topBarBg.fill({ color: 0x000000, alpha: 0.5 });
        this.hint.position.set(window.innerWidth / 2, 25);
        this.money.position.set(50, 25);
        this.moneyChange.position.set(50, 50);
        this.moneyChangeReason.position.set(150, 50);
        this.licenseHeader.position.set(window.innerWidth - 220, 25);
        this.license.position.set(window.innerWidth - 100, 25);

        this.stationContainer.position.set(50, window.innerHeight / 2 - 300);

        this.customerContainer.position.set(200, 10);

        this.boostGraphic.position.set(0, window.innerHeight - 2);
    }

    pfpJumpDirection: number = 1;

    showMoney = 0;

    transationQueue = new Array<{ amount: number; reason: string }>();

    lastHint: string = "";
    hintCooldown = 0;
    update(dt: number) {
        this.starMask.clear();

        this.pfp.position.set(window.innerWidth / 2 - this.subtitles.style.wordWrapWidth / 2 - 70, window.innerHeight - 100);

        if (game.music.isGoodBeat && game.music.isBeat) this.pfpJumpDirection *= -1;
        if (game.music.isGoodBeat) this.pfp.x -= 5 * (1 - game.music.sinceBeat) * this.pfpJumpDirection;
        if (game.music.isGoodBeat) this.pfp.y -= 5 * (1 - game.music.sinceBeat);

        if (game.player.license > 0) {
            this.license.text = `${game.player.license.toFixed(0)}s`;
            this.license.style.fill = 0xffaa99;
        } else {
            this.license.text = `NONE`;
            this.license.style.fill = 0xff5555;
        }

        this.money.text = `${this.showMoney.toFixed(0)}c`;
        if (this.showMoney >= 0) {
            this.money.style.fill = 0xffffff;
        } else {
            this.money.style.fill = 0xff5555;
        }

        this.hint.text = game.story.getHint();
        const hint = game.story.getHint();
        if (hint != this.lastHint) {
            this.lastHint = hint;
            this.hintCooldown = 60;
            this.hint.text = hint;
            this.hint.visible = false;
        }

        if (this.hintCooldown > 0) {
            this.hint.visible = false;
            this.hintCooldown -= dt;
        } else {
            this.hint.visible = true;
        }

        if (game.story.personOnBoard) {
            if (!this.customerContainer.visible) {
                this.customerContainer.visible = true;
                this.customerPfp.scale.set(1);
                this.customerPfp.texture = Assets.get(game.story.personOnBoard.toLowerCase());
                fitImage(this.customerPfp, 50, 50);
            }
        } else {
            this.customerContainer.visible = false;
        }

        this.topBarContainer.alpha = clamp(1 - game.player.velocity.length() / 10, 0.25, 1);

        this.pfp.scale.x = this.pfpJumpDirection;

        this.processTransations(dt);

        this.stashContainer.position.set(window.innerWidth - (this.stashOpen ? 250 : 50), window.innerHeight / 2 - 300);

        this.boostGraphic.clear();
        if (game.player.boostUnlocked) {
            let boostLine = 0;
            let boostColor = 0xffffaa;
            if (game.player.boostEffect) {
                boostLine = game.player.boostEffect / game.player.stats.boostLength;
                boostColor = 0xffaa00;
            } else if (game.player.boostCooldown > 0) {
                boostLine = 1 - game.player.boostCooldown / game.player.stats.boostCooldown;
                boostColor = 0xaaaaaa;
            } else {
                boostLine = 1;
            }
            this.boostGraphic.rect(0, 0, window.innerWidth * boostLine, 2).fill({ color: boostColor, alpha: 0.5 });
        }
    }

    transactionTiming = 0;
    moneyPerDt = 0;
    finalMoney = 0;
    prevAmountShown = 0;
    processTransations(dt: number) {
        if (this.transationQueue.length == 0) return;

        if (this.transactionTiming == 0) {
            this.moneyChangeReason.text = this.transationQueue[0].reason;
            this.moneyChange.text = this.transationQueue[0].amount.toFixed(0) + "c";
            this.moneyChange.style.fill = 0xff5555;
            this.moneyPerDt = this.transationQueue[0].amount / 62;
            this.finalMoney = this.showMoney + this.transationQueue[0].amount;
            if (this.transationQueue[0].amount > 0) {
                this.moneyChange.text = "+" + this.transationQueue[0].amount.toFixed(0) + "c";
                this.moneyChange.style.fill = 0x55ff55;
            }
        }
        const useDt = dt * 0.5;
        this.transactionTiming += useDt;

        let alpha = 0;

        if (this.transactionTiming <= 20) {
            alpha = this.transactionTiming / 20;
            this.prevAmountShown = this.showMoney;
        } else if (this.transactionTiming >= 80) {
            alpha = (100 - this.transactionTiming) / 20;
            this.showMoney = this.finalMoney;
            this.moneyChange.text = "0c";
        } else {
            alpha = 1;
            this.showMoney += this.moneyPerDt * useDt;
            this.transationQueue[0].amount -= this.moneyPerDt * useDt;

            if (Math.floor(this.showMoney) != Math.floor(this.prevAmountShown)) {
                this.prevAmountShown = this.showMoney;
                game.music.sounds.money.play();
            }

            this.moneyChange.text = this.transationQueue[0].amount.toFixed(0) + "c";
            if (this.transationQueue[0].amount > 0) {
                this.moneyChange.text = "+" + this.transationQueue[0].amount.toFixed(0) + "c";
            }
        }

        game.music.sounds.money.rate(clamp(this.showMoney / game.player.money, 0.1, 10));

        this.moneyChange.alpha = alpha;
        this.moneyChangeReason.alpha = alpha;
        if (this.transactionTiming > 100) {
            this.moneyChange.alpha = 0;
            this.moneyChangeReason.alpha = 0;
            this.transactionTiming = 0;
            this.transationQueue.shift();
        }
    }

    queueTransation(amount: number, reason: string) {
        this.transationQueue.push({ amount: amount, reason: reason });
    }

    hideStationUi() {
        this.stationContainer.removeChildren();
    }

    stationUi(station: Station) {
        this.stationContainer.removeChildren();
        const background = new Graphics();
        background.rect(0, 0, 400, 600).fill({ color: 0x000000, alpha: 0.5 });
        this.stationContainer.addChild(background);

        const name = new Text({ text: station.name, style: { fontSize: 30, fill: station.color } });
        name.anchor.set(0, 0);
        name.x = 20;
        name.y = 20;
        this.stationContainer.addChild(name);
        const description = new Text({ text: station.description, style: { fontSize: 18, wordWrap: true, wordWrapWidth: 360, fill: 0xaaaaaa } });
        description.anchor.set(0, 0);
        description.x = 20;
        description.y = 50;
        this.stationContainer.addChild(description);

        const services = new Text({ text: "Avilable:", style: { fontSize: 30, fill: 0xffffff } });
        services.anchor.set(0, 0);
        services.x = 20;
        services.y = 100;
        this.stationContainer.addChild(services);

        let index = 0;
        for (const service of station.services) {
            const container = new Container();
            container.x = 10;
            container.y = 140 + index * 100;
            this.stationContainer.addChild(container);

            container.interactive = true;

            const hasImage = service.image != null;

            if (hasImage) {
                const image = new Sprite(Assets.get(service.image));
                fitImage(image, 60, 60);
                image.anchor.set(1, 0);
                image.x = 370;
                image.y = 5;
                container.addChild(image);
            }

            const serviceBackground = new Graphics();
            serviceBackground.rect(0, 0, 370, 95).fill({ color: 0x000000, alpha: 0.5 });
            serviceBackground.x = 5;
            container.addChild(serviceBackground);

            container.on("mouseover", () => {
                serviceBackground.clear();
                if (service.condition && !service.condition()) {
                    serviceBackground.rect(0, 0, 370, 95).fill({ color: 0x440000, alpha: 0.5 });
                } else {
                    serviceBackground.rect(0, 0, 370, 95).fill({ color: 0x333333, alpha: 0.5 });
                }
            });

            container.on("mouseleave", () => {
                serviceBackground.clear();
                serviceBackground.rect(0, 0, 370, 95).fill({ color: 0x000000, alpha: 0.5 });
            });

            container.on("click", () => {
                if (service.condition && !service.condition()) return;
                service.action();
            });

            const serviceName = new Text({ text: service.name, style: { fontSize: 18, fill: 0xffffff } });
            serviceName.anchor.set(0, 0);
            serviceName.x = 10;
            serviceName.y = 5;
            container.addChild(serviceName);
            const serviceDescription = new Text({ text: service.description, style: { fontSize: 18, fill: 0xaaaaaa, wordWrap: true, wordWrapWidth: hasImage ? 300 : 360 } });
            serviceDescription.anchor.set(0, 0);
            serviceDescription.x = 10;
            serviceDescription.y = 25;
            container.addChild(serviceDescription);

            if (service.value) {
                const value = new Text({ text: service.value, style: { fontSize: 18, fill: 0xffffff } });
                value.anchor.set(1, 0);
                value.x = 370;
                value.y = 75;
                container.addChild(value);
            }

            index++;
        }
    }

    renderStash() {
        this.stashItemContainer.removeChildren();
        let index = 0;
        for (const item of game.stash.items) {
            const x = (index % 2) * 100 + 50;
            const y = Math.floor(index / 2) * 100;
            const background = new Graphics();
            let color = 0;
            if (!item.stashed) color = 0x333333;
            if (game.stash.activeItem == item) color = 0x335533;
            background.rect(x + 5, y + 5, 90, 90).fill({ color: color, alpha: 0.5 });
            const icon = new Sprite(Assets.get(item.icon));
            fitImage(icon, 80, 80);
            this.stashItemContainer.addChild(background);
            this.stashItemContainer.addChild(icon);
            icon.x = x + 10;
            icon.y = y + 10;
            background.interactive = true;
            background.on("click", () => {
                console.log(item);

                item.click();
            });

            index++;
        }
    }
}
