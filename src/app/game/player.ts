import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { BitmapSprite } from 'app/game/bitmapSprite'
import { Weapon, WeaponPool, WEAPONS } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { Game } from 'app/game/game'
import * as _ from 'lodash'

const humanTypes = ['00', '01', '02', '03', '04', '05', '06', '07']
export class Player extends _Entity {

    sprite: BitmapSprite;

    constructor(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Player>, public game: Game) {
        super(engine, position);
        this.sprite = <BitmapSprite>engine.createHuman(position, humanTypes[_.random(0, humanTypes.length - 1)]);
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

        this.weapons[this.selectedWeaponIndex].fire(this, target);
        console.log('zombie attacks ' + target.id + target.teamId);
        return this;
    }

    public addWeapon(weaponType: WEAPONS): Player {
        this.weapons.push(WeaponPool.add(weaponType, this.game));

        return this
    }
    public selectWeapon(index: number): Player {
        this.selectedWeaponIndex = index;
        return this
    }
}