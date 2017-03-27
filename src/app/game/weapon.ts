import { Entity } from 'app/game/entity'
import { GameMap } from 'app/game/map'
import { Engine } from 'app/phaser/engine'
import { Square } from 'app/game/map'
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
    // pour les armes à explosion
    damageRange: number
    damageRangeReduction?: number
    isRanged: boolean
}

export interface Weapon {
    data: WeaponData

    fire(sourceEntity: Entity, targetEntity: Entity): void
    reload(): void
}

class WeaponImpl implements Weapon {

    private rnd: Phaser.RandomDataGenerator;
    private isJammed: boolean = false;

    constructor(public data: WeaponData, public map: GameMap) {
        this.rnd = map.rnd;
    }

    public fire(sourceEntity: Entity, targetEntity: Entity): void {

        if (this.isJammed) {
            return;
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
            this.shootSingleBullet(sourceEntity, targetEntity);
        } else {

            this.shootMultyBullet(sourceEntity, targetEntity);
        }
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
    }

    private shootMultyBullet(sourceEntity: Entity, targetEntity: Entity) {

        // check les trajectoires des balles
        // angle par rapport à la cible
        // l'angle est à placer sur la ligne des x2. Puis on divise l'angle pour chacune des balles
        // on calcul des lignes de BresenhamLine pour checker le coup sur la première entité rencontrée (plus tard on verra pour celles derrière)
        let sourceSquare = sourceEntity.square,
            // les y sont inversés, il faut donc inverser l'angle.
            baseAngle = -Math.atan2(targetEntity.square.y - sourceSquare.y, targetEntity.square.x - sourceSquare.x) * (180 / Math.PI),
            startAngle = baseAngle + (this.data.spreadAngle / 2),
            angleStep = this.data.spreadAngle / this.data.projectileByShot;


        _.times(this.data.projectileByShot, index => {
            this.processSingleBullet(sourceEntity ,sourceSquare, startAngle - (index * angleStep));
        });
    }

    static RADIANS_FACTOR = (Math.PI / 180);

    private toRadians(angle) {
        return angle * WeaponImpl.RADIANS_FACTOR;
    }


        //todo enregistrer tous les dommages d'une action et résoudre ça à la fin.
    private processSingleBullet(sourceEntity: Entity,sourceSquare, currentAngle: number) {
        let targetX = Math.round(Math.cos(this.toRadians(currentAngle)) * this.data.maxRange) + sourceSquare.x,
            targetY = -Math.round(Math.sin(this.toRadians(currentAngle)) * this.data.maxRange) + sourceSquare.y,
            targetSquare = this.map.getSquare(targetX, targetY),
            lineOfSight = this.map.BresenhamLine(sourceSquare, targetSquare),
            entitiesOnLineOfSight = _(lineOfSight)
                .tail()
                .filter((square) => square.entity).map(square => square.entity)
                .value(),
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
        });
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

    static add(weapons: WEAPONS, map: GameMap): Weapon {
        switch (weapons) {
            case WEAPONS.NINEMM:
                return new WeaponImpl({
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
                    projectileByShot: 1,
                    isRanged: false
                }, map);
            case WEAPONS.SHOOTGUN:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.PIPE:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.AXE:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.PUNCH:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.BAT:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.NAILBAT:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.KNIFE:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);
            case WEAPONS.KATANA:

                return new WeaponImpl({
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
                    isRanged: false
                }, map);

            default:
                break;
        }
    }
}