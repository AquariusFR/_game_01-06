import { Entity, EntityType } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { Square } from 'app/game/map'
import { GameMap } from 'app/game/map'


export class _Entity implements Entity {

    map: GameMap
    angle: number = 90

    static idcount: number = 0
    visionRange: number
    pathMap: Map<string, any[]>
    id: number
    engine: Engine
    teamId: number
    sprite: Phaser.Sprite
    attackRange: number
    type = EntityType.human
    position: Phaser.Point
    maxAction: number
    currentAction: number
    weapons: Array<Weapon> = []
    selectedWeaponIndex: number = 0
    armor: number
    pv: number
    maxArmor: number
    maxPv: number
    mouvementRange: number
    square: Square
    targetSquare: Square
    coverDetection: number
    visibleSquares: Array<Square>
    updateAccessibleTiles: boolean
    mapLastUpdate: number
    isMasked: boolean


    constructor(engine: Engine, position: Phaser.Point) {
        this.engine = engine;
        this.position = position;
        this.id = _Entity.idcount++;
    }

    public maskEntity(): _Entity {
        this.isMasked = true;
        this.setAnimation();
        return this;
    }
    public unmaskEntity(): _Entity {
        this.isMasked = false;
        this.setAnimation();
        return this;
    }

    listener() {
        //this.targeted(this);
    }

    private setAnimation() {
        let prefix = this.isMasked ? 'masked-' : '',
            angle = this.angle,
            animation = '';
        if (angle > 0) {
            if (angle < 45) {
                animation = prefix + 'right'
            } else if (angle < 135) {
                animation = prefix + 'down'
            } else {
                animation = prefix + 'left';
            }
        } else {
            angle = Math.abs(angle);
            if (angle < 45) {
                animation = prefix + 'right'
            } else if (angle < 135) {
                animation = prefix + 'up'
            } else {
                animation = prefix + 'left';
            }
        }

        console.log('direction', animation);
        this.engine.lookTo(this.sprite, animation);
    }

    private updateDirection(sourcePosition: Phaser.Point, targetPosition: Phaser.Point) {
        let angle = Math.atan2(targetPosition.y - sourcePosition.y, targetPosition.x - sourcePosition.x) * (180 / Math.PI);

        this.angle = angle;

        this.isMasked = this.square.mask;

        this.setAnimation();
    }

    public finishMoving(): _Entity {
        this.sprite.play('stand-down');
        return this;
    }

    public touched(sourceEntity: Entity, damage: number): _Entity {
        return this;
    }

    public attack(target: Entity): _Entity {

        this.updateDirection(this.position, target.position);

        return this;
    }
    public move(targetPosition: Phaser.Point, callback: () => void): _Entity {

        this.updateDirection(this.position, targetPosition);

        this.position = targetPosition;
        this.engine.moveTo(this.sprite, this.position.x, this.position.y, callback);
        return this;
    }
}