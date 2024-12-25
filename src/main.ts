import { Game } from "./game";
import "./style.css";
import { Application, Assets } from "pixi.js";
import bundle from "./bundle.json";

async function start() {
    const app = new Application();
    await app.init({ resizeTo: window, antialias: true });
    const loadingText = document.createElement("span")
    document.body.appendChild(loadingText);
    loadingText.innerHTML = "Loading - 0%";
    loadingText.classList.add("text");
    for (const key in bundle) {
        Assets.add({ alias: key, src: bundle[key as keyof typeof bundle] });
    }
    await Assets.load(Object.keys(bundle), (e) => {
        loadingText.innerHTML = `Loading - ${Math.floor(e * 100)}%`;
    });
    document.body.appendChild(app.canvas);
    loadingText.innerHTML = "Click to start";
    await new Promise((resolve) => {
        window.addEventListener("click", resolve);
    });
    loadingText.remove();
    Game.create(app);
}

start();
