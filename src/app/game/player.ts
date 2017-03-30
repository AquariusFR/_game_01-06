import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { Weapon, WeaponPool, WEAPONS } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { GameMap } from 'app/game/map'

export class Player extends _Entity {
    constructor(engine: Engine, position: Phaser.Point, team: number, public map: GameMap) {
        super(engine, position);
        this.sprite = engine.createHuman(position);
        this.teamId = team;
        this.maxAction = 2;
        this.mouvementRange = 10;
        this.visionRange = 4;
        this.coverDetection = 10;
        this.updateAccessibleTiles = true;
    }

    public move(targetPosition: Phaser.Point, callback: () => void): Player {
        super.move(targetPosition, callback);
        return this;
    }

    static popPlayer(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Player>, map: GameMap): Player {
        let newPlayer = new Player(engine, position, teamId, map);
        team.push(newPlayer);
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
        this.weapons.push(WeaponPool.add(weaponType, this.map));

        return this
    }
    public selectWeapon(index:number):Player{
        this.selectedWeaponIndex = index;
        return this
    }
}