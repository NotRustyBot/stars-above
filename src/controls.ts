import { game } from "./game";

export class PlayerControls {
    boost = false;
    init(){
        game.backgroundContainer.interactive = true;
        game.backgroundContainer.on("pointerdown", (e) => this.boost = game.stash.activeItem == undefined && !game.stash.items.some((i) => i.inHand));
        game.backgroundContainer.on("pointerup", (e) => this.boost = false);
    }

    get brake(){
        return game.keys.has(" ");
    }

    get up() {
        return game.keys.has("ArrowUp") || game.keys.has("w");
    }
    get down() {
        return game.keys.has("ArrowDown") || game.keys.has("s");
    }
    get left() {
        return game.keys.has("ArrowLeft") || game.keys.has("a");
    }
    get right() {
        return game.keys.has("ArrowRight") || game.keys.has("d");
    }
    get switchRadar() {
        if (this.radar && game.keys.has("r")) {
            this.radar = false;
            return true;
        }
    }

    private radar = false;

    get addPressed() {
        if (this.enter && game.keys.has("x")) {
            this.enter = false;
            return true;
        }
    }

    private enter = false;

    get removePressed() {
        if (this.remove && game.keys.has("c")) {
            this.remove = false;
            return true;
        }
    }

    private remove = false;

    update() {
        if(!game.keys.has("r") && !this.radar) {
            this.radar = true;
        }

        if(!game.keys.has("x") && !this.enter) {
            this.enter = true;
        }

        if(!game.keys.has("c") && !this.remove) {
            this.remove = true;
        }
    }
}
