import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { GameMap } from 'app/game/map'
import { Game } from 'app/game/game'
import { Square } from 'app/game/map'
import * as _ from 'lodash'

enum status {
    ALERT,
    IDDLE,
    SEARCHING
}
const zombieTypes = ['01', '02', '03', '04', '05', '06', '07', '08']

export class Zombie extends _Entity {

    currentStatus: status;

    constructor(engine: Engine, position: Phaser.Point, team: number) {
        super(engine, position);
        this.sprite = engine.createZombie(position, zombieTypes[_.random(0, zombieTypes.length - 1)]);
        this.teamId = team;
        this.maxAction = 2;
        this.mouvementRange = 6;
        this.currentStatus = status.IDDLE;
        this.visionRange = 12;
        this.coverDetection = 10;
        this.updateAccessibleTiles = true;
    }


    static popZombie(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Zombie>): Zombie {
        let newZombie = new Zombie(engine, position, teamId);
        team.push(newZombie);
        return newZombie;
    }


    public play(map: GameMap, callback: () => void): void {

        let entities: Array<Entity> = this.visibleSquares.filter(square => square.entity).map(s => s.entity);

        if (this.lookForHumaaaans(entities, map, callback)) {
            console.log('fresh meat ...')
        } else {
            this.goForCloserZombie(entities, map, callback);
        }

    }

    private pathToClosestEntity(entitiesGroup: Array<Entity>, map: GameMap): closestEntityReturn {
        let closerHuman = null,
            actualDistanceFromHuman = 999,
            mouvementRange = this.mouvementRange,
            pathToGo: Array<any> = null,
            actualSquare = this.square,
            pathes = this.pathMap,
            moveTargetSquare,
            self = this;
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
                let path = map.getPathTo(actualSquare, targetSquare, mouvementRange);
                console.log('path to humaaaans', pathToGo);
                if (path) {
                    closerHuman = h;
                    actualDistanceFromHuman = path.length;
                    pathToGo = path;
                    moveTargetSquare = _.last(pathToGo);
                    return
                }
            }


            function checkPath(x:number, y:number) {
                if (actualSquare.x === x && actualSquare.y === y) {
                    actualDistanceFromHuman = 0;
                    closerHuman = h;
                    pathToGo = [];
                    moveTargetSquare = actualSquare;
                    return;
                }

                let square: Square = map.getSquare(x, y);
                let path = map.getPathTo(actualSquare, square, mouvementRange);

                if (path && path.length > 0 && path.length < actualDistanceFromHuman && pathStepEqualsToSquare(_.last(path), square) ) {
                    closerHuman = h;
                    actualDistanceFromHuman = path.length;
                    pathToGo = path;
                    moveTargetSquare = square;
                    return
                }
            }
            function pathStepEqualsToSquare(pathStep:any, square:Square){
                return pathStep.x === square.x && pathStep.y === square.y;
            }
        })

        return {
            distance: actualDistanceFromHuman,
            entity: closerHuman,
            path: pathToGo,
            target: moveTargetSquare
        }
    }


    private goForCloserZombie(entities: Array<Entity>, map: GameMap, callback: () => void): boolean {
        let zombie = entities.filter(e => e.teamId === this.teamId && e.id != this.id);

        let pathToClosest = this.pathToClosestEntity(zombie, map);


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

            map.moveEntityFollowingPath(this, pathToClosest.path, () => callback(), () => console.error('oh ...'));
        }

        return false;
    }
    private lookForHumaaaans(entities: Array<Entity>, map: GameMap, callback: () => void): boolean {

        let humans = entities.filter(e => e.teamId !== this.teamId);

        let pathToClosest = this.pathToClosestEntity(humans, map);
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

            map.moveEntityFollowingPath(this, pathToClosest.path, () => callback(), () => console.error('oh ...'));
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

    public touched(): Zombie {
        this.engine.playSound('grunt');
        return this;
    }
}


interface closestEntityReturn {
    entity: Entity,
    path: Array<any>,
    distance: number,
    target: Square
}