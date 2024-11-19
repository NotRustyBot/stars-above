import { game } from "./game";
import { SpaceObject } from "./spaceObject";
import { Station, StationService } from "./station";
import { Vector } from "./types";
import cruiserPolygon from "./cruiser.json";
import { Beacon } from "./beacon";
import { Assets, Sprite } from "pixi.js";
import { Item, ItemType } from "./stash";

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
    loadPersonellForGate,
    deliverPersonellForGate,
    loadPersonellForIva,
    deliverPersonellForIva,
    loadPersonellForBlob,
    deliverPersonellForBlob,
    allPersonellDelivered,
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
    cruiserGun: Sprite;
    update(dt: number) {
        const s = dt / 60;
        this.untilLoan -= s;
        this.storyTimer += s;
        if (this.untilLoan < 0) {
            this.untilLoan += 60;
            game.player.moneyTransfer(-this.loan, "Loan - Interest");
        }

        if (this.progressIndex == Progress.nothing) {
            this.progressIndex = Progress.start;
            game.voice.say("1i");
            this.personOnBoard = "instructor";
        } else if (this.progressIndex == Progress.start) {
            if (game.player.position.distanceSquared(this.starsat.position) < 500 ** 2) {
                this.progressIndex = Progress.sunSatReached;
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
                this.progressIndex = Progress.loadPersonellForGate;

                this.cruiser = new SpaceObject("cruiser", new Vector(-10000, 50000), cruiserPolygon, 1);
                this.cruiserGun = new Sprite(Assets.get("cruiser_gun"));
                this.cruiserGun.anchor.set(0.7, 0.5);
                this.cruiserGun.x = -1000;
                this.cruiser.container.addChild(this.cruiserGun);
                const beacon = new Beacon(0x55ff55);
                beacon.range = 30000;
                beacon.position.set(this.cruiser.position.x, this.cruiser.position.y);
            }
        } else if (this.progressIndex == Progress.loadPersonellForGate) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 1000 ** 2) {
                this.progressIndex = Progress.deliverPersonellForGate;
            }
        } else if (this.progressIndex == Progress.deliverPersonellForGate) {
            if (game.player.position.distanceSquared(this.gate.position) < 1000 ** 2) {
                this.progressIndex = Progress.loadPersonellForBlob;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Military personell");
            }
        } else if (this.progressIndex == Progress.loadPersonellForBlob) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 1000 ** 2) {
                this.progressIndex = Progress.deliverPersonellForBlob;
            }
        } else if (this.progressIndex == Progress.deliverPersonellForBlob) {
            if (game.player.position.distanceSquared(this.blob.position) < 1000 ** 2) {
                this.progressIndex = Progress.loadPersonellForIva;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Military personell");
            }
        } else if (this.progressIndex == Progress.loadPersonellForIva) {
            if (game.player.position.distanceSquared(this.cruiser.position) < 1000 ** 2) {
                this.progressIndex = Progress.deliverPersonellForIva;
            }
        } else if (this.progressIndex == Progress.deliverPersonellForIva) {
            if (game.player.position.distanceSquared(this.iva.position) < 1000 ** 2) {
                this.progressIndex = Progress.allPersonellDelivered;
                this.licenseCheck();
                game.player.moneyTransfer(15, "Fare - Military personell");
            }
        }

        if (this.cruiserGun) {
            this.cruiserGun.rotation = Math.sin(game.time * 0.01) / 5;
        }

        if (this.cruiser) {
            this.cruiser.container.rotation = -Math.sin(game.time * 0.01) / 5 + 0.2;
        }

        this.restrictedAreaCheck();
        this.foodDelivery();
        this.customers(dt);
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

    foodDeliveryStatus = 0;
    foodCustomer: { position: Vector } | null = null;
    foodName: string | null = null;
    foodDeliveryIndex = 0;
    foodDelivery() {
        if (this.allowFoodDelivery) {
            if (this.foodDeliveryStatus == 0) {
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
    }

    customerStatus = 0;
    customerTimer = 0;
    customerIndex = 0;
    currentCustomerFrom: Station;
    currentCustomerTo: Station;
    customers(dt: number) {
        if (!this.allowCustomers) return;
        if (this.customerStatus == 0) {
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

    getHint() {
        const primary = missionHints[this.progressIndex];
        let secondary = "";
        if (this.customerStatus == 1) {
            secondary = " | customer waiting at " + this.currentCustomerFrom.name;
        }
        if (this.customerStatus == 2) {
            secondary = " | drop off customer at " + this.currentCustomerTo.name;
        }
        if (this.foodDeliveryStatus == 2) {
            secondary = " | deliver food to " + this.foodName;
        }
        return primary + secondary;
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

const missionHints: Record<Progress, string> = {
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
    [Progress.scientistReachedStarSat]: "Look for oppriorities",
    [Progress.psychologistDepartGate]: "Approach IVA (blue marker)",
    [Progress.psychologistArriveIva]: "Look for oppriorities, wait for Psychologist",
    [Progress.psychologistCalling]: "Pick up Psychologist from IVA (blue marker)",
    [Progress.psychologistDepartedIva]: "Listen to Psychologist",
    [Progress.psychologistArrivedGate]: "Go to Gate (purple marker)",
    [Progress.loadPersonellForGate]: "Locate Cruiser (green marker), seen from IVA (blue marker)",
    [Progress.deliverPersonellForGate]: "Deliver personell to Gate (purple marker)",
    [Progress.loadPersonellForIva]: "Return to Cruiser (green marker), seen from IVA (blue marker)",
    [Progress.deliverPersonellForIva]: "Deliver personell to IVA (blue marker)",
    [Progress.loadPersonellForBlob]: "Return to Cruiser (green marker), seen from Blob (red marker)",
    [Progress.deliverPersonellForBlob]: "Deliver personell to Blob (red marker)",
    [Progress.allPersonellDelivered]: "?",
};
