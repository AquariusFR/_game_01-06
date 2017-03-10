import { Entity } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'

export interface Entity {
    maxAction: number;
    currentAction:number;
    weapons:Array<Weapon>;
    armor:number;
    pv:number;
    maxArmor:number;
    maxPv:number;
    mouvementRange:number;
    attackRange: number;
    position:Phaser.Point;
    type:EntityType;
    sprite: Phaser.Sprite;
    move(targetPosition:Phaser.Point);
}
export enum EntityType {
    human,
    zombie
}
