import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { GameMap } from 'app/game/map'
import { Game } from 'app/game/game'
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

        map.setAccessibleTilesByEntity(this);
        let entities: Array<Entity> = this.visibleSquares.filter(square => square.entity).map(s => s.entity);
        // map.getVisibleEntitiedByEntity(this);

        if (this.lookForHumaaaans(entities, map, callback)) {
            console.log('fresh meat ...')
        } else {
            this.goForCloserZombie(entities, callback);
        }

    }
    private goForCloserZombie(entities: Array<Entity>, callback: () => void): boolean {
        callback();
        return false;
    }
    private lookForHumaaaans(entities: Array<Entity>, map: GameMap, callback: () => void): boolean {

        let humans = entities.filter(e => e.teamId !== this.teamId);

        //plus tard, il ira de manière aléatoire en favorisant le plus proche

        let closerHuman = null,
            actualDistanceFromHuman = 999,
            pathToGo = null,
            actualSquare = this.square,
            pathes = this.pathMap,
            moveTargetSquare,
            self = this;

        humans.forEach(h => {
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
                let path = map.getPathTo(actualSquare, targetSquare, this.mouvementRange);
                console.log('path to humaaaans', pathToGo);
                if (path && path.length < actualDistanceFromHuman) {
                    closerHuman = h;
                    actualDistanceFromHuman = path.length;
                    pathToGo = path;
                    moveTargetSquare = _.last(pathToGo);
                    return
                }
            }

            function checkPath(x, y) {
                let path = pathes.get(x + '_' + y);

                if (actualSquare.x === x && actualSquare.y === y) {
                    actualDistanceFromHuman = 0;
                    closerHuman = h;
                    pathToGo = [];
                    moveTargetSquare = self.square;
                    return;
                }
                if (path && path.length < actualDistanceFromHuman) {
                    closerHuman = h;
                    actualDistanceFromHuman = path.length;
                    pathToGo = path;
                    moveTargetSquare = targetSquare;
                    return
                }

                // on récupère le chemin le amenant au plus pret
            }
        });

        if (!closerHuman) {
            return false;
        }

        if (actualDistanceFromHuman === 0) {
            this.attack(closerHuman);
            //attack
            this.updateAccessibleTiles = false;
            callback();
        } else {
            this.targetSquare = moveTargetSquare;
            this.updateAccessibleTiles = true;

            map.moveEntityFollowingPath(this, pathToGo, () => callback(), () => console.error('oh ...'));
        }

        return true;
    }


    public attack(target: Entity) {
        super.attack(target);
        this.engine.playSound('grunt');
        this.engine.shake();
        console.log('zombie attacks ' + target.id + target.teamId);
    }

    public touched() {
        this.engine.playSound('grunt');
    }
}