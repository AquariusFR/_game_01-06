import { _Entity } from 'app/game/_entity'
import { Entity } from 'app/game/entity'
import { Weapon } from 'app/game/weapon'
import { Engine } from 'app/phaser/engine'
import { GameMap } from 'app/game/map'
import { Game } from 'app/game/game'

enum status {
    ALERT,
    IDDLE,
    SEARCHING
}

export class Zombie extends _Entity {

    currentStatus: status;

    constructor(engine: Engine, position: Phaser.Point, team: number) {
        super(engine, position);
        this.sprite = engine.createZombie(position);
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


    public play(map: GameMap, attack:(Entity)=>void, callback:()=>void): void {

        let entities: Array<Entity> = this.visibleSquares.filter(square=> square.entity).map(s=>s.entity);
        // map.getVisibleEntitiedByEntity(this);

        if (this.lookForHumaaaans(entities, map, attack, callback)) {
            console.log('fresh meat ...')
        } else {
            this.goForCloserZombie(entities, callback);
        }

    }
    private goForCloserZombie(entities: Array<Entity>, callback:()=>void): boolean {
            callback();
        return false;
    }
    private lookForHumaaaans(entities: Array<Entity>, map: GameMap, attack:(Entity)=>void, callback:()=>void): boolean {

        let humans = entities.filter(e => e.teamId !== this.teamId);

        //plus tard, il ira de manière aléatoire en favorisant le plus proche

        let closerHuman = null,
            actualDistanceFromHuman = 999,
            pathToGo = null,
            actualSquare = this.square,
            pathes = this.pathMap;

        humans.forEach(h => {
            let targetSquare = h.square;

            //check les 8 cases adjacentes à la cible
            //checkPath(targetSquare.x - 1, targetSquare.y - 1);
            checkPath(targetSquare.x, targetSquare.y - 1);
            //checkPath(targetSquare.x + 1, targetSquare.y - 1);
            checkPath(targetSquare.x - 1, targetSquare.y);
            checkPath(targetSquare.x + 1, targetSquare.y);
            //checkPath(targetSquare.x - 1, targetSquare.y + 1);
            checkPath(targetSquare.x, targetSquare.y + 1);
            //checkPath(targetSquare.x + 1, targetSquare.y + 1);

            function checkPath(x, y) {
                let path = pathes.get(x + '_' +y);
                if(actualSquare.x === x && actualSquare.y ===y){
                    actualDistanceFromHuman = 0;
                    closerHuman = h;
                    pathToGo = [];
                    return;
                }
                if (path && path.length < actualDistanceFromHuman) {
                    closerHuman = h;
                    actualDistanceFromHuman = path.length;
                    pathToGo = path;
                    return
                }

                // on récupère le chemin le amenant au plus pret
               // map.easyStar.findPath(x, y)
            }
        });

        if (!closerHuman) {
            return false;
        }

        if (actualDistanceFromHuman === 0) {
            //attack
            attack(closerHuman);
            callback();
            console.log('attack');
            this.updateAccessibleTiles = false;
        } else {
            map.moveEntityFollowingPath(this, pathToGo, () => callback(), () => console.error('oh ...'));
            this.updateAccessibleTiles = true;
        }

        return true;
    }

}