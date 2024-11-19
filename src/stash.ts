import { Assets, Container, Graphics, Rectangle, Sprite, Text } from "pixi.js";
import { game } from "./game";
import { Vector, Vectorlike } from "./types";

export class ItemStash {
    activeItem?: Item;
    items: Item[] = [];

    constructor() {
        this.items.push(Item.fromType(ItemType.stickyNote));
        this.items.push(Item.fromType(ItemType.pen));
        this.items.push(Item.fromType(ItemType.finReport));
    }

    update(dt: number) {
        for (const item of this.items) {
            item.update(dt);
        }
    }
}

export enum ItemType {
    stickyNote,
    pen,
    redSharpie,
    greenSharpie,
    finReport,
    blankPaper,
    transparency,
    loanForm,
}

const ItemDefintions: Record<ItemType, ItemTemplate> = {
    [ItemType.stickyNote]: {
        sprite: "sticky",
        icon: "sticky",
        tags: {
            paper: true,
            placable: true,
        },
    },
    [ItemType.pen]: {
        icon: "pen",
        tags: {
            active: true,
            pencilStats: { width: 3, color: 0, alpha: 1 },
        },
    },
    [ItemType.redSharpie]: {
        icon: "red_marker",
        tags: {
            active: true,
            pencilStats: { width: 20, color: 0xff3333, alpha: 0.5 },
        },
    },
    [ItemType.greenSharpie]: {
        icon: "green_marker",
        tags: {
            active: true,
            pencilStats: { width: 20, color: 0x33cc33, alpha: 0.5 },
        },
    },
    [ItemType.finReport]: {
        icon: "fin_report",
        sprite: "blank_paper",
        tags: {
            paper: true,
            placable: true,
        },
    },
    [ItemType.blankPaper]: {
        icon: "blank_paper",
        sprite: "blank_paper",
        tags: {
            paper: true,
            placable: true,
        },
    },
    [ItemType.transparency]: {
        icon: "blank_paper",
        sprite: "blank_paper",
        tags: {
            paper: true,
            placable: true,
        },
    },
    [ItemType.loanForm]: {
        icon: "loan_form",
        sprite: "loan_form",
        tags: {
            paper: true,
            placable: true,
            form: true,
        },
    },
};

const loanFormRects = {
    loan: new Rectangle(50, 150, 25, 25),
    payoff: new Rectangle(50, 250, 25, 25),
    sign: new Rectangle(60, 410, 300, 40),
};

export class Item {
    type: ItemType;
    tags = {
        paper: false,
        placable: false,
        active: false,
        form: false,
        pencilStats: undefined as undefined | { width: number; color: number; alpha: number },
    };

    stashed = true;
    inHand = false;

    sprite: Sprite;
    icon: string;
    mask: Sprite;
    container = new Container();
    canvas = new Graphics();

    fTitle?: Text;
    fDesc?: Text;
    fGreen?: Text;
    fRed?: Text;

    points?: Vectorlike[];

    init() {
        this.container.visible = false;
        if (this.tags.placable) {
            this.container.interactive = true;
            this.container.addChild(this.sprite);
            game.itemContainer.addChild(this.container);

            let lastPos = new Vector();
            this.container.on("mousemove", (e) => {
                this.inHand = false;
                if (!this.stashed) {
                    if (this.tags.paper && game.stash.activeItem && game.stash.activeItem.tags.pencilStats !== undefined) {
                        const local = this.container.toLocal(e.global);
                        const pen = game.stash.activeItem.tags.pencilStats;
                        if (e.buttons === 1) {
                            this.canvas.moveTo(lastPos.x, lastPos.y);
                            this.canvas.lineTo(local.x, local.y);
                            this.canvas.stroke({ width: pen.width, color: pen.color, alpha: pen.alpha, cap: "round" });
                            if (this.tags.form) {
                                this.points?.push({ x: local.x, y: local.y });
                            }
                        }
                        lastPos.set(local.x, local.y);
                    } else {
                        if (e.buttons === 1) {
                            this.container.position.set(e.global.x - this.container.width / 2, e.global.y - this.container.height / 2);
                            this.inHand = true;
                            game.itemContainer.swapChildren(this.container, game.itemContainer.children[game.itemContainer.children.length - 1]);
                        }
                    }
                }
            });

            if (this.tags.paper) {
                this.mask = new Sprite(this.sprite.texture);
                this.container.addChild(this.canvas);
                this.container.addChild(this.mask);
                this.canvas.mask = this.mask;

                if (this.type == ItemType.transparency) {
                    this.sprite.alpha = 0.1;
                }
            }

            if (this.type == ItemType.finReport) {
                this.fTitle = new Text({ text: "IVA BANK - account staement", style: { fontSize: 24, fill: 0x999999, align: "left" } });
                this.fTitle.anchor.set(0, -1);
                this.fTitle.rotation = Math.PI / 2;
                this.container.addChild(this.fTitle);
                this.fDesc = new Text({ style: { fontSize: 14, fill: 0x0, align: "left" } });
                this.fDesc.anchor.set(0, 0);
                this.container.addChild(this.fDesc);
                this.fGreen = new Text({ style: { fontSize: 14, fill: 0x005500, align: "right" } });
                this.fGreen.anchor.set(1, 0);
                this.container.addChild(this.fGreen);
                this.fRed = new Text({ style: { fontSize: 14, fill: 0xff3333, align: "right" } });
                this.fRed.anchor.set(1, 0);
                this.container.addChild(this.fRed);

                this.fTitle.x = 400;
                this.fTitle.y = 50;
                this.fDesc.x = 110;
                this.fDesc.y = 15;
                this.fRed.y = 15;
                this.fGreen.y = 15;
                this.fGreen.x = 100;
                this.fRed.x = 100;

                this.updateReport();
            }

            if (this.tags.form) {
                this.points = [];
            }

            if (this.type == ItemType.loanForm) {
                const style = { color: 0x333333, alpha: 1, width: 5 };
                this.canvas.rect(loanFormRects.loan.x, loanFormRects.loan.y, loanFormRects.loan.width, loanFormRects.loan.height).stroke(style);
                this.canvas.rect(loanFormRects.payoff.x, loanFormRects.payoff.y, loanFormRects.payoff.width, loanFormRects.payoff.height).stroke(style);
                this.canvas.rect(loanFormRects.sign.x, loanFormRects.sign.y, loanFormRects.sign.width, loanFormRects.sign.height).stroke(style);
            }
        }
    }

    static fromType(type: ItemType) {
        const def = ItemDefintions[type];
        const item = new Item();
        item.type = type;
        item.tags = { ...item.tags, ...def.tags };
        if (item.tags.placable) item.sprite = new Sprite(Assets.get(def.sprite));
        item.icon = def.icon;
        item.init();
        return item;
    }

    click() {
        if (this.tags.placable) {
            this.stashed = !this.stashed;
        }
        if (this.tags.active) {
            if (game.stash.activeItem != this) {
                game.stash.activeItem = this;
            } else {
                game.stash.activeItem = undefined;
            }
        }
        game.ui.renderStash();
    }

    updateReport() {
        if (this.type == ItemType.finReport) {
            this.fDesc.text = "";
            this.fGreen.text = "";
            this.fRed.text = "";

            for (const transaction of game.player.transactions) {
                this.fDesc.text += `${transaction.reason}\n`;

                if (transaction.amount >= 0) this.fGreen.text += `+${transaction.amount.toFixed(2)}`;
                if (transaction.amount < 0) this.fRed.text += `${transaction.amount.toFixed(2)}`;

                this.fGreen.text += "\n";
                this.fRed.text += "\n";
            }
        }
    }

    evaluateLoan() {
        return this.evaluateForm(loanFormRects) as { loan: boolean; payoff: boolean; sign: boolean } | false;
    }

    remove(){
        this.container.destroy();
        game.stash.items = game.stash.items.filter((i) => i != this);
        if(game.stash.activeItem == this) game.stash.activeItem = undefined;
        game.ui.renderStash();
    }

    evaluateForm(areas: Record<string, Rectangle>) {
        const result: { [K: keyof typeof areas]: boolean } = {};
        const counter: { [K: keyof typeof areas]: number } = {};
        let misses = this.points.length;

        for (let index = 0; index < this.points.length; index++) {
            const point = this.points[index];
            let hit = false;
            for (const key in areas) {
                if (areas[key].clone().pad(10).contains(point.x, point.y)) {
                    counter[key] = (counter[key] || 0) + 1;
                    hit = true;
                    break;
                }
            }

            if (hit) {
                misses--;
            }
        }

        if (misses > this.points.length / 2) {
            return false;
        } else {
            for (const key in areas) {
                result[key] = counter[key] > 10;
            }
            return result;
        }
    }

    update(dt: number) {
        if (this.tags.placable && !this.stashed) {
            this.container.visible = true;
        } else {
            this.container.visible = false;
        }
    }
}

type ItemTemplate = {
    icon: string;
    sprite?: string;
    tags: Partial<Item["tags"]>;
    customUpdate?: (item: Item, dt: number) => void;
};
