import { _Entity } from 'app/game/_entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'

export class Player extends _Entity {
    constructor(engine: Engine, x: number, y: number, targeted: (Entity) => void) {
        super(engine, x, y, targeted);
        engine.createHuman(x, y, () => this.listener());
    }
}