import { _Entity } from 'app/game/_entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'

export class Player extends _Entity {
    constructor(engine: Engine, position:Phaser.Point,  team:number) {
        super(engine, position);
        this.sprite = engine.createHuman(position);
        this.teamId = team;
        this.maxAction = 2;
    }

    move(targetPosition:Phaser.Point){
        super.move(targetPosition);
    }

    static popPlayer(engine: Engine, position:Phaser.Point, teamId:number, team:Array<Player>):Player{
        let newPlayer = new Player(engine, position, teamId);
        team.push(newPlayer);
        return newPlayer;
    }
}