import { _Entity } from 'app/game/_entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'

export class Player extends _Entity {
    constructor(engine: Engine, x: number, y: number, targeted: (Entity) => void, team:number) {
        super(engine, x, y, targeted);
        this.sprite = engine.createHuman(x, y, () => this.listener());
        this.teamId = team;
    }

    move(targetPosition:Phaser.Point){
        super.move(targetPosition);
    }

    static popPlayer(engine: Engine, x: number, y: number, targeted: (Entity) => void, teamId:number, team:Array<Player>):void{
        let newZombie = new Player(engine, x,y, targeted, teamId);
        team.push(newZombie);
    }
}