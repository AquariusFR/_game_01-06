import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { GameMap } from 'app/game/map'
import { Game } from 'app/game/game'
import { Square } from 'app/game/map'
import * as _ from 'lodash'
import { BitmapSprite } from 'app/game/bitmapSprite'
import DelayedAnimation from 'app/phaser/delayedAnimation'

enum status {
    ALERT,
    IDDLE,
    SEARCHING
}
const zombieTypes = ['01', '02', '03', '04', '05', '06', '07', '08']

export class Zombie extends _Entity {

    currentStatus: status;
    sprite: BitmapSprite;

    constructor(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Zombie>, public game: Game) {
        super(engine, position);
        this.sprite = this.createZombie(position, zombieTypes[_.random(0, zombieTypes.length - 1)]);

        this.teamId = teamId;
        this.team = team;
        this.maxAction = 2;
        this.mouvementRange = 6;
        this.pv = 6;
        this.maxPv = 6;
        this.currentStatus = status.IDDLE;
        this.visionRange = 12;
        this.coverDetection = 10;
        this.updateAccessibleTiles = true;
        team.push(this);
    }

    static popZombie(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Zombie>, game: Game): Zombie {
        let newZombie = new Zombie(engine, position, teamId, team, game);
        return newZombie;
    }
    public createZombie(position: Phaser.Point, zombieType: string) {
        let zombie = new BitmapSprite('Male-Zombies-Gore', position, this.engine.phaserGame),
            framerate = 3;
        zombie.smoothed = false;
        //zombie.scale.setTo(1, this.engine.phaserGame.rnd.realInRange(0.9, 1.2))
        let delay = this.engine.phaserGame.rnd.integerInRange(0, 50);


        DelayedAnimation.addToAnimations(zombie.animations, delay, "down", [zombieType + "-down-1", zombieType + "-down-2", zombieType + "-down-3", zombieType + "-down-2"], framerate, true);

        zombie.animations.add("down", [zombieType + "-down-1", zombieType + "-down-2", zombieType + "-down-3", zombieType + "-down-2"], framerate, true);
        zombie.animations.add("left", [zombieType + "-left-1", zombieType + "-left-2", zombieType + "-left-3"], framerate, true);
        zombie.animations.add("right", [zombieType + "-right-1", zombieType + "-right-2", zombieType + "-right-3"], framerate, true);
        zombie.animations.add("up", [zombieType + "-up-1", zombieType + "-up-2", zombieType + "-up-3"], framerate, true);
        zombie.animations.add("masked-down", ["00-down-1", "00-down-2", "00-down-3"], framerate, true);
        zombie.animations.add("masked-left", ["00-left-1", "00-left-2", "00-left-3"], framerate, true);
        zombie.animations.add("masked-right", ["00-right-1", "00-right-2", "00-right-3"], framerate, true);
        zombie.animations.add("masked-up", ["00-up-1", "00-up-2", "00-up-3"], framerate, true);

        zombie.play("down");

        let frameIndex = this.engine.phaserGame.rnd.integerInRange(0, zombie.animations.currentAnim.frameTotal);

        zombie.animations.currentAnim.setFrame(frameIndex);

        this.engine.gamegroup.add(zombie);
        return zombie;
    }


    public play(callback: () => void): void {

        let visibleEntities: Array<Entity> = this.visibleSquares.filter(square => square.entity).map(s => s.entity);

        if (this.lookForHumaaaans(visibleEntities, callback)) {
            console.log('fresh meat ...')
        } else {
            this.goForCloserZombie(visibleEntities, callback);
        }
    }

    private pathToClosestEntity(entitiesGroup: Array<Entity>): closestEntityReturn {
        let closerHuman = null,
            actualDistanceFromHuman = 999,
            mouvementRange = this.mouvementRange,
            pathToGo: Array<any> = null,
            actualSquare = this.square,
            pathes = this.pathMap,
            moveTargetSquare: Square,
            self = this,
            game = this.game;
        entitiesGroup.forEach(h => {
            let targetSquare = h.square;

            //check les 8 cases adjacentes à la cible
            checkPath(targetSquare.x - 1, targetSquare.y - 1);
            checkPath(targetSquare.x, targetSquare.y - 1);
            checkPath(targetSquare.x + 1, targetSquare.y - 1);
            checkPath(targetSquare.x - 1, targetSquare.y);
            checkPath(targetSquare.x + 1, targetSquare.y);
            checkPath(targetSquare.x - 1, targetSquare.y + 1);
            checkPath(targetSquare.x, targetSquare.y + 1);
            checkPath(targetSquare.x + 1, targetSquare.y + 1);
            if (!pathToGo) {
                let path = this.game.getPathTo(actualSquare, targetSquare, mouvementRange),
                    lastStep = _.last(path),
                    lastSquare = lastStep ? this.game.getSquare(lastStep.x, lastStep.y) : null;
                console.log('path to humaaaans', pathToGo);
                if (path) {
                    setClosestPath(path, lastSquare);
                    return
                }
            }

            function checkPath(x: number, y: number) {
                if (actualSquare.x === x && actualSquare.y === y) {
                    setClosestPath([], actualSquare);
                    return;
                }

                let square: Square = game.getSquare(x, y);
                if (square.entity) {
                    return
                }
                let path = game.getPathTo(actualSquare, square, mouvementRange),
                    lastStep = _.last(path),
                    lastSquare = lastStep ? game.getSquare(lastStep.x, lastStep.y) : null;

                if (path && path.length > 0 && path.length < actualDistanceFromHuman && lastSquare === square) {
                    setClosestPath(path, lastSquare);
                    return
                }
            }
            function pathStepEqualsToSquare(pathStep: any, square: Square) {
                return pathStep.x === square.x && pathStep.y === square.y;
            }

            function setClosestPath(path: Array<any>, square: Square) {
                closerHuman = h;
                actualDistanceFromHuman = path.length;
                pathToGo = path;
                moveTargetSquare = square;
            }
        })

        return {
            distance: actualDistanceFromHuman,
            entity: closerHuman,
            path: pathToGo,
            target: moveTargetSquare
        }
    }


    private goForCloserZombie(entities: Array<Entity>, callback: () => void): boolean {
        let zombie = entities.filter(e => e.teamId === this.teamId && e.id != this.id);
        let pathToClosest = this.pathToClosestEntity(zombie);

        if (!pathToClosest.entity) {
            callback();
            return false;
        }

        if (pathToClosest.distance === 0) {
            //this.attack(closerHuman);
            //attack
            this.updateAccessibleTiles = false;
            callback();
        } else {
            this.targetSquare = pathToClosest.target;
            this.updateAccessibleTiles = true;

            this.game.map.moveEntityFollowingPath(this, pathToClosest.path, () => callback(), () => console.error('oh ...'));
        }

        return false;
    }
    private lookForHumaaaans(entities: Array<Entity>, callback: () => void): boolean {

        let humans = entities.filter(e => e.teamId !== this.teamId);

        let pathToClosest = this.pathToClosestEntity(humans);
        //plus tard, il ira de manière aléatoire en favorisant le plus proche


        if (!pathToClosest.entity) {
            return false;
        }

        if (pathToClosest.distance === 0) {
            this.attack(pathToClosest.entity);
            //attack
            this.updateAccessibleTiles = false;
            callback();
        } else {
            this.targetSquare = pathToClosest.target;
            this.updateAccessibleTiles = true;

            this.game.map.moveEntityFollowingPath(this, pathToClosest.path, () => callback(), () => console.error('oh ...'));
        }

        return true;
    }


    public attack(target: Entity): Zombie {
        super.attack(target);
        this.engine.playSound('grunt');
        this.engine.shake();
        console.log('zombie attacks ' + target.id + target.teamId);
        return this;
    }

    public touched(sourceEntity: Entity, damage: number): Zombie {
        console.log('aaaargh', sourceEntity, 'hit me for', damage);
        this.engine.playSound('grunt');

        this.pv = this.pv - damage;

        if (this.pv <= 0) {
            console.log('aaaargh, i am really dead');

            this.die(sourceEntity);

        }

        return this;
    }
    public die(sourceEntity: Entity): Entity {

        this.sprite.alive = false
        setTimeout(() => {
            //this.sprite.visible = false
            /*this.sprite.changeColor();
            this.setAnimation();*/
            this.sprite.animations.stop()
            let index = _(this.team).remove(['id', this.id]).value();
            this.game.setDead(this, sourceEntity)
        }, 10);
        return this;
    }
}


interface closestEntityReturn {
    entity: Entity,
    path: Array<any>,
    distance: number,
    target: Square
}