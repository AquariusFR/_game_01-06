import { Entity } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { Square } from 'app/game/map'
import { GameMap } from 'app/game/map'

export interface Entity {
    map:GameMap
    maxAction: number
    currentAction:number
    weapons:Array<Weapon>
    selectedWeaponIndex:number
    armor:number
    pv:number
    maxArmor:number
    maxPv:number
    mouvementRange:number
    visionRange:number
    attackRange: number
    position:Phaser.Point
    type:EntityType
    sprite: Phaser.Sprite
    pathMap:Map<string, any[]>
    teamId:number
    engine:Engine
    id:number
    square:Square
    targetSquare:Square
    coverDetection:number
    visibleSquares:Array<Square>
    updateAccessibleTiles:boolean
    mapLastUpdate:number
    isMasked:boolean

    touched(sourceEntity: Entity, damage:number):Entity
    attack(target: Entity):Entity
    move(targetPosition:Phaser.Point, callback:()=> void):Entity
    finishMoving():Entity
    maskEntity():Entity
    unmaskEntity():Entity
}
export enum EntityType {
    human,
    zombie
}
