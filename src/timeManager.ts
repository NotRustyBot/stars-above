import { clamp } from "./utils";

export class TimeManager {
    realDt = 0;

    currentRate = 1;
    dangerLevel = 0;

    get isCheeze() {
        return this.currentRate < 0.5;
    }

    update(dt: number) {
        this.realDt = dt;

        this.currentRate = 1 - this.dangerLevel;
        this.currentRate = clamp(this.currentRate, 0.01, 1);

        this.dangerLevel = 0;
    }

    danger(level: number) {
        this.dangerLevel = Math.max(this.dangerLevel, level);
    }

    gameDt(): number {
        return this.realDt * this.currentRate;
    }

    playerDt(): number {
        return Math.max(this.gameDt(), 0.2);
    }
}
