import { _Entity } from 'app/game/_entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'

export class Zombie extends _Entity {
    constructor(engine: Engine, x: number, y: number, targeted: (Entity) => void, team:number) {
        super(engine, x, y, targeted);
        this.sprite = engine.createZombie(x, y, () => this.listener());
        this.teamId = team;
    }

    static popZombie(engine: Engine, x: number, y: number, targeted: (Entity) => void, teamId:number, team:Array<Zombie>):void{
        let newZombie = new Zombie(engine, x,y, targeted, teamId);
        team.push(newZombie);
    }
}