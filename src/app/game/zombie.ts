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
        this.mouvementRange = 8;
        this.currentStatus = status.IDDLE;
        this.visionRange = 10;
        this.coverDetection = 0;
    }


    static popZombie(engine: Engine, position: Phaser.Point, teamId: number, team: Array<Zombie>): Zombie {
        let newZombie = new Zombie(engine, position, teamId);
        team.push(newZombie);
        return newZombie;
    }


    public play(map: GameMap, game:Game): void {

        let entities: Array<Entity> = map.getVisibleEntitiedByEntity(this);

        if (this.lookForHumaaaans(entities, map, game)) {
            console.log('fresh meat ...')
        } else {
            this.goForCloserZombie(entities, game);
        }

    }
    private goForCloserZombie(entities: Array<Entity>, game:Game): boolean {
            game.nextAction();
        return false;
    }
    private lookForHumaaaans(entities: Array<Entity>, map: GameMap, game:Game): boolean {

        let humans = entities.filter(e => e.teamId !== this.teamId);

        //plus tard, il ira de manière aléatoire en favorisant le plus proche

        let closerHuman = null,
            actualDistanceFromHuman = 999,
            pathToGo = null,
            actualSquare = this.square,
            pathes = this.pathes;

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

            function checkPath(x, y) {
                let path = pathes.get(x + '_' +y);
                if (path && path.length < actualDistanceFromHuman) {
                    closerHuman = h;
                    actualDistanceFromHuman = path.length;
                    pathToGo = path;
                }
                if(actualSquare.x === x && actualSquare.y ===y){
                    actualDistanceFromHuman = 0;
                    closerHuman = h;
                    pathToGo = [];
                }
            }
        });

        if (!closerHuman) {
            return false;
        }

        if (actualDistanceFromHuman === 0) {
            //attack
            game.attack(closerHuman);
            game.nextAction();
            console.log('attack');
        } else {
            map.moveEntityFollowingPath(this, pathToGo, () => game.nextAction(), () => console.error('oh ...'));
        }

        return true;
    }

}