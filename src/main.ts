import { Game } from "./game";
import "./style.css";
import { Application, Assets } from "pixi.js";
import bundle from "./bundle.json";

async function start() {
    const app = new Application();
    await app.init({ resizeTo: window, antialias: true });
    for (const key in bundle) {
        Assets.add({ alias: key, src: bundle[key as keyof typeof bundle] });
    }
    await Assets.load(Object.keys(bundle));
    document.body.appendChild(app.canvas);
    await new Promise((resolve) => {
        window.addEventListener("click", resolve);
    });
    Game.create(app);
}

start();
