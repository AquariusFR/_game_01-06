import { Entity, EntityType } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'

export class _Entity implements Entity {
    engine: Engine;
    teamId: number;
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

    constructor(engine: Engine, position: Phaser.Point) {
        this.engine = engine;
        this.position = position;
    }

    listener() {
        //this.targeted(this);
    }

    private getDirection(sourcePosition: Phaser.Point, targetPosition: Phaser.Point): string {
        let angle = Math.atan2(targetPosition.y - sourcePosition.y, targetPosition.x - sourcePosition.x) * (180 / Math.PI);


        if (angle > 0) {
            if (angle < 45) {
                return 'right'
            }
            if (angle < 135) {
                return 'down'
            }
            return 'left';
        } else {
            angle = Math.abs(angle);
            if (angle < 45) {
                return 'right'
            }
            if (angle < 135) {
                return 'up'
            }
            return 'left';
        }
    }

    public move(targetPosition: Phaser.Point) {

        let direction: string = this.getDirection(this.position, targetPosition);

        console.log('direction', direction);

        this.position = targetPosition;
        this.engine.moveTo(this.sprite, this.position.x, this.position.y, direction, 'stand-down');
    }
}