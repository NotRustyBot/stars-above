import { Color, ColorSource, Sprite } from "pixi.js";

export function crush(value: number, resolution: number, range = 1) {
    value = (Math.floor((value / range) * resolution) / resolution) * range;
    return value;
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export function fitImage(sprite: Sprite, width: number, height: number) {
    const scale = Math.min(width / sprite.width, height / sprite.height);
    sprite.scale.set(scale);
}

export function interpolateColors(a: ColorSource, b: ColorSource, ratio: number) {
    a = new Color(a);
    b = new Color(b);
    const out = new Color([a.red + (b.red - a.red) * ratio, a.green + (b.green - a.green) * ratio, a.blue + (b.blue - a.blue) * ratio]);
    return out;
}