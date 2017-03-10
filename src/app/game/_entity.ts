import { Entity, EntityType } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'

export class _Entity implements Entity {

    sprite: Phaser.Sprite;

    attackRange: number;

    type = EntityType.human;
    position: Phaser.Point;

    maxAction: number;
    currentAction: number;
    weapons: Weapon[];
    armor: number;
    pv: number;
    maxArmor: number;
    maxPv: number;
    mouvementRange: number;
    constructor(engine: Engine, x:number, y:number, public targeted:(Entity)=>void) {
    }

    listener(){
        this.targeted(this);
        console.log('LOG');
    }

    public move(targetPosition: Phaser.Point) {
        this.position = targetPosition;
    }
}