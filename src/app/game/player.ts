import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { Weapon, WeaponPool, WEAPONS } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { Game } from 'app/game/game'

export class Player extends _Entity {
    constructor(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Player>, public game: Game) {
        super(engine, position);
        this.sprite = engine.createHuman(position);
        this.teamId = teamId;
        this.maxAction = 2;
        this.mouvementRange = 10;
        this.visionRange = 4;
        this.coverDetection = 10;
        this.pv = 10;
        this.maxPv = 10;
        this.updateAccessibleTiles = true;
        team.push(this);
    }

    public move(targetPosition: Phaser.Point, callback: () => void): Player {
        super.move(targetPosition, callback);
        return this;
    }

    static popPlayer(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Player>, game: Game): Player {
        let newPlayer = new Player(engine, position, teamId, team, game);
        newPlayer.addWeapon(WEAPONS.NINEMM);
        return newPlayer;
    }
    public attack(target: Entity): Player {
        super.attack(target);
        this.engine.playSound('gun');
        this.engine.shake();

        this.weapons[this.selectedWeaponIndex].fire(this, target);
        console.log('zombie attacks ' + target.id + target.teamId);
        return this;
    }

    public addWeapon(weaponType: WEAPONS): Player {
        this.weapons.push(WeaponPool.add(weaponType, this.game));

        return this
    }
    public selectWeapon(index:number):Player{
        this.selectedWeaponIndex = index;
        return this
    }
}