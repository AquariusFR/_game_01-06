import { Entity } from 'app/game/entity'
import { GameMap } from 'app/game/map'
import { Game } from 'app/game/game'
import { Engine } from 'app/phaser/engine'
import { Square } from 'app/game/map'
import { Bullet } from 'app/game/bullet'
import * as _ from 'lodash';

// prevoir une compétence pour utiliser les machines guns debout

export enum WEAPONS {
    NINEMM,
    SHOOTGUN,
    AR15,
    //Ruger No. 1 Varminter K1-V-BBZ
    RUGER_K1,
    BLASER_R8,
    PIPE,
    AXE,
    PUNCH,
    BAT,
    NAILBAT,
    KNIFE,
    KATANA,
    HAND_GRENADE
}

export interface fireReturn {
}

export interface WeaponData {
    name: string
    sound: string
    minRange: number
    maxRange: number
    minDamage: number
    maxDamage: number
    precision: number
    criticalChance: number
    maxAmmo: number
    currentAmmo: number
    jammedChance: number
    maxEntityByBullet: number
    // si setté, la balle perdra en dommage par case parcouru
    damageReduction?: number
    // si supérieur à 0, on calcul un arbre de dispersion et on applique la précision sur chaqune des cibles.
    spreadAngle: number
    projectileByShot: number
    fireRate: number
    // pour les armes à explosion
    damageRange: number
    damageRangeReduction?: number
    isRanged: boolean
    // shake
    intensity: number,
    duration: number
}

export interface Weapon {
    data: WeaponData

    fire(sourceEntity: Entity, targetEntity: Entity): void
    reload(): void
}

class WeaponImpl implements Weapon {
    bulletSpeed: number;

    private rnd: Phaser.RandomDataGenerator;
    private isJammed: boolean = false;
    private bulletGroup: Phaser.Group;

    constructor(public data: WeaponData, public game: Game, key) {
        this.rnd = this.game.engine.phaserGame.rnd;
        this.bulletGroup = this.game.engine.addGroup(data.name);

        for (var i = 0; i < 64; i++) {
            this.bulletGroup.add(new Bullet(this.game.engine.phaserGame, 'bullet6'), true);
        }
    }

    public fire(sourceEntity: Entity, targetEntity: Entity): void {

        this.bulletSpeed = 700;
        if (this.isJammed) {
            console.log('weapon jammed !!!!');
            this.isJammed = false;
        }

        if (this.data.isRanged) {
            if (this.data.currentAmmo > 0) {
                this.data.currentAmmo--
            }
            else {
                //you should reload
                return;
            }
        }

        if (this.checkJam()) {
            return;
        }

        if (this.data.spreadAngle == 0) {
            this.shootStraight(sourceEntity, targetEntity)
        } else {
            this.shootSpread(sourceEntity, targetEntity);
        }
    }


    private shootStraight(sourceEntity: Entity, targetEntity: Entity) {

        let projectilShot = 0,
            shot = () => {
                projectilShot++;
                let touchedEntity = this.shootSingleBullet(sourceEntity, targetEntity);
                var x = sourceEntity.position.x + 10;
                var y = sourceEntity.position.y + 10;
                let currentDistance = 0;

                this.game.engine.playSound(this.data.sound);
                this.game.engine.shake(this.data.intensity, this.data.duration);

                if (!touchedEntity) {
                    currentDistance = this.data.maxRange * 32;
                } else {
                    let dx = Math.abs(x - touchedEntity.position.x);
                    let dy = Math.abs(y - touchedEntity.position.y);
                    currentDistance = (dx + dy);
                }
                let baseAngle = -Math.atan2(targetEntity.square.y - sourceEntity.square.y, targetEntity.square.x - sourceEntity.square.x) * (180 / Math.PI);
                console.log('fire bullet ', baseAngle);
                this.bulletGroup.getFirstExists(false).fire(x, y, -baseAngle, this.bulletSpeed, 0, 0, currentDistance);

                if (projectilShot < this.data.projectileByShot) {
                    setTimeout(shot, this.data.fireRate);
                }
            };

        shot();


    }

    private shootSingleBullet(sourceEntity: Entity, targetEntity: Entity) {
        let damageModifier = 1//plus tard on aura les modifieurs source et cible
        if (!this.checkHitSuccess()) {
            return;
        }

        if (this.checkCriticalSuccess()) {
            damageModifier = 2;
        }
        let damage = damageModifier * this.getDamage();
        targetEntity.touched(sourceEntity, damage);
        return targetEntity;
    }

    private shootSpread(sourceEntity: Entity, targetEntity: Entity) {

        // check les trajectoires des balles
        // angle par rapport à la cible
        // l'angle est à placer sur la ligne des x2. Puis on divise l'angle pour chacune des balles
        // on calcul des lignes de BresenhamLine pour checker le coup sur la première entité rencontrée (plus tard on verra pour celles derrière)
        let sourceSquare = sourceEntity.square,
            // les y sont inversés, il faut donc inverser l'angle.
            baseAngle = -Math.atan2(targetEntity.square.y - sourceSquare.y, targetEntity.square.x - sourceSquare.x) * (180 / Math.PI),
            startAngle = baseAngle + (this.data.spreadAngle / 2),
            angleStep = this.data.spreadAngle / this.data.projectileByShot;
        this.game.engine.playSound(this.data.sound);
        this.game.engine.shake(this.data.intensity, this.data.duration);


        _.times(this.data.projectileByShot, index => {
            this.processSingleBullet(sourceEntity, sourceSquare, startAngle - (index * angleStep));
        });
    }

    static RADIANS_FACTOR = (Math.PI / 180);

    private toRadians(angle) {
        return angle * WeaponImpl.RADIANS_FACTOR;
    }


    //todo enregistrer tous les dommages d'une action et résoudre ça à la fin.
    private processSingleBullet(sourceEntity: Entity, sourceSquare, currentAngle: number) {
        let targetX = Math.round(Math.cos(this.toRadians(currentAngle)) * this.data.maxRange) + sourceSquare.x,
            targetY = -Math.round(Math.sin(this.toRadians(currentAngle)) * this.data.maxRange) + sourceSquare.y,
            targetSquare = this.game.map.getSquare(targetX, targetY),
            lineOfSight = this.game.map.BresenhamLine(sourceSquare, targetSquare),
            entitiesOnLineOfSight = _(lineOfSight)
                .tail()
                .filter((square) => square.entity).map(square => square.entity)
                .value(),
            lastPositionTouched: Phaser.Point = null,
            entityTouched = 0;

        console.log('bullet', currentAngle, targetX, targetY);

        entitiesOnLineOfSight.forEach(entity => {
            let damageModifier = 1//plus tard on aura les modifieurs source et cible
            if (entityTouched >= this.data.maxEntityByBullet) {
                return
            }

            if (!this.checkHitSuccess()) {
                return;
            } else {
                entityTouched++;
            }
            if (this.checkCriticalSuccess()) {
                damageModifier = 2;
            }
            let damage = damageModifier * this.getDamage();
            entity.touched(sourceEntity, damage);
            lastPositionTouched = entity.position
        });


        console.log('fire bullet ', currentAngle);
        var x = sourceEntity.position.x + 10;
        var y = sourceEntity.position.y + 10;
        let currentDistance = 0;


        if (!lastPositionTouched) {
            currentDistance = this.data.maxRange * 32;
        } else {
            let dx = Math.abs(x - lastPositionTouched.x);
            let dy = Math.abs(y - lastPositionTouched.y);
            currentDistance = (dx + dy);
        }

        this.bulletGroup.getFirstExists(false).fire(x, y, -currentAngle, this.bulletSpeed, 0, 0, currentDistance);
    }

    public reload(): void {
        this.data.currentAmmo = this.data.maxAmmo;
    }

    private checkJam(): boolean {
        if (this.checkRollSuccess(this.data.jammedChance)) {
            this.isJammed = true;
        }
        return this.isJammed;
    }

    private getDamage(): number {
        return this.rnd.integerInRange(this.data.minDamage, this.data.maxDamage);
    }

    private checkCriticalSuccess(): boolean {
        return this.checkRollSuccess(this.data.criticalChance);
    }

    private checkHitSuccess(): boolean {
        return this.checkRollSuccess(this.data.precision);
    }

    private checkRollSuccess(chance): boolean {
        let roll = this.rnd.realInRange(0, 100);
        return roll <= chance;
    }
}

export class WeaponPool {

    static add(weapons: WEAPONS, game: Game): Weapon {
        switch (weapons) {
            case WEAPONS.NINEMM:

                return new WeaponImpl({
                    name: 'NINEMM',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 9,
                    minDamage: 1,
                    maxDamage: 3,
                    precision: 65,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 3,
                    fireRate: 150,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 80
                }, game, 'bullet6');
            case WEAPONS.SHOOTGUN:

                return new WeaponImpl({
                    name: 'SHOTGUN',
                    sound: 'shotgun',
                    minRange: 0,
                    maxRange: 5,
                    minDamage: 1,
                    maxDamage: 2,
                    precision: 80,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 4,
                    currentAmmo: 4,
                    spreadAngle: 30,
                    damageRange: 0,
                    projectileByShot: 6,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.020,
                    duration: 120
                }, game, 'bullet8');
            case WEAPONS.PIPE:

                return new WeaponImpl({
                    name: 'PIPE',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');
            case WEAPONS.AXE:

                return new WeaponImpl({
                    name: 'AXE',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');
            case WEAPONS.PUNCH:

                return new WeaponImpl({
                    name: 'PUNCH',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');
            case WEAPONS.BAT:

                return new WeaponImpl({
                    name: 'BAT',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');
            case WEAPONS.NAILBAT:

                return new WeaponImpl({
                    name: 'NAILBAT',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');
            case WEAPONS.KNIFE:

                return new WeaponImpl({
                    name: 'KNIFE',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');
            case WEAPONS.KATANA:

                return new WeaponImpl({
                    name: 'KATANA',
                    sound: 'gun',
                    minRange: 0,
                    maxRange: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    precision: 0,
                    criticalChance: 10,
                    jammedChance: 5,
                    maxEntityByBullet: 1,
                    maxAmmo: 6,
                    currentAmmo: 6,
                    spreadAngle: 0,
                    damageRange: 0,
                    projectileByShot: 1,
                    fireRate: 0,
                    isRanged: false,
                    intensity: 0.004,
                    duration: 100
                }, game, 'bullet6');

            default:
                break;
        }
    }
}