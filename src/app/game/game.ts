import { Player } from 'app/game/player'
import { Ennemy } from 'app/game/ennemy'
import { Zombie } from 'app/game/zombie'
import { GameMap } from 'app/game/map'
import { Entity, EntityType } from 'app/game/entity'
import { Engine } from 'app/phaser/engine'
import { GameService } from 'app/loader/game.service'

export class Game {
    ticking: any;
    private engine: Engine;
    private playerTeam: Array<Player>;
    private ennemyTeam: Array<Ennemy>;
    private zombieTeam: Array<Zombie>;
    private turn: number;
    private currentIndex: number;
    private currentEntity: Entity;
    private currentTeam: Array<Entity>;
    private currentTeamId: number;

    private zombieTeamId: number = 0;
    private playerTeamId: number = 1;
    private ennemyTeamId: number = 2;
    private map: GameMap;

    constructor(gameService: GameService) {
        this.playerTeam = new Array<Player>();
        this.ennemyTeam = new Array<Ennemy>();
        this.zombieTeam = new Array<Zombie>();
        this.turn = 0;
        this.map = new GameMap('zombie');
        this.engine = new Engine(this.map.getName(), gameService, (point: Phaser.Point) => this.clickOn(point));

        this.engine.observable.subscribe(
            next => this.setUpTeams(),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));
    }

    private setUpTeams() {
        let engine = this.engine,
            targetCallback = (z) => this.targeted(z),
            map = this.map;
        this.map.setEngine(engine);
        map.preparePathCalculator();
        this.playerTeam = new Array<Player>();
        this.ennemyTeam = new Array<Ennemy>();
        this.zombieTeam = new Array<Zombie>();

        map.putEntityAtPoint(Player.popPlayer(engine, map.getPointAtSquare(5, 3), this.playerTeamId, this.playerTeam));
        map.putEntityAtPoint(Player.popPlayer(engine, map.getPointAtSquare(6, 3), this.playerTeamId, this.playerTeam));

        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(21, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(17, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(18, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(19, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(20, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(15, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(16, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(17, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(18, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(19, 10), this.zombieTeamId, this.zombieTeam));

        


        this.currentIndex = -1;
        this.currentTeamId = this.playerTeamId;
        this.currentTeam = this.playerTeam;
        this.updateAllVisibilities();
        this.nextCharacter();
        this.doAction();
    }

    public nextCharacter() {
        if (this.currentIndex >= this.currentTeam.length - 1) {
            this.nextTeam();
            return;
        }
        this.currentIndex = this.currentIndex + 1;
        this.currentEntity = this.currentTeam[this.currentIndex];
        this.currentEntity.currentAction = 0;
        this.engine.setGlowPosition(this.currentEntity.position);
    }

    private updateVisibleSquaresOfEntity(entity: Entity) {
        //console.time('updateVisibleSquaresOfEntity');
        
        this.map.setVisibileSquares(entity);

        if (this.currentTeamId === this.zombieTeamId) {
            if(!entity.updateAccessibleTiles){
                return;
            }
            let pointMap: Map<string, Phaser.Point> = new Map();
            let points: Array<Phaser.Point> = new Array();
            this.engine.removeAllVisibleTiles();

            this.zombieTeam.forEach(z => {
                z.visibleSquares.forEach(s => pointMap.set(s.x + ':' + s.y, this.map.getPointAtSquare(s.x, s.y)))
            });

            pointMap.forEach(s => points.push(s));

            this.engine.addVisibleTiles(points);
        }
        //console.timeEnd("updateVisibleSquaresOfEntity");
    }

    // foreach entities, determine what it can see
    private updateAllVisibilities() {
        //console.time('updateAllVisibilities');
        this.playerTeam.forEach(p => {
            this.map.setVisibileSquares(p, true);
        })
        this.engine.removeAllVisibleTiles();
        this.zombieTeam.forEach(z => {
            this.map.setVisibileSquares(z, true);
            let visiblePoints: Array<Phaser.Point> = z.visibleSquares.map(s => this.map.getPointAtSquare(s.x, s.y))
            this.engine.addVisibleTiles(visiblePoints);
        })
        //console.timeEnd("updateAllVisibilities");
    }

    public nextTeam() {
        this.currentIndex = -1;

        if (this.currentTeamId === this.playerTeamId) {
            this.currentTeamId = this.zombieTeamId;
            this.currentTeam = this.zombieTeam;
        } else if (this.currentTeamId === this.zombieTeamId) {
            this.currentTeamId = this.playerTeamId;
            this.currentTeam = this.playerTeam;
        }
        this.nextCharacter();
    }

    // une entité a été ciblé
    public targeted(target: Entity) {
        if (this.currentEntity.id === target.id) {
            console.log('it\'s me');
            return;
        }

        if (this.IsEntityInCurrentTeam(target)) {
            this.helpTeamMate(target);
        } else {
            this.attack(target);
        }
    }

    public IsEntityInCurrentTeam(target: Entity) {
        return target.teamId === this.currentTeamId;
    }

    public helpTeamMate(target: Entity) {
        console.log(this.currentEntity + ' helps ' + target);
    }

    public attack(target: Entity) {

        if (this.currentTeamId === this.zombieTeamId) {
            this.engine.playSound('grunt');

        } else {
            this.engine.playSound('gun');
        }

        this.engine.shake();
        console.log(this.currentEntity + ' attacks ' + target);
    }

    public clickOn(target: Phaser.Point) {
        if (this.ticking) {
            return
        }
        let square = this.map.getSquareAtPoint(target);

        if (square.entity) {
            this.currentEntity.updateAccessibleTiles = false;
            this.targeted(square.entity);
            this.ticking = true;
            this.nextAction();
        }
        else {
            this.currentEntity.updateAccessibleTiles = true;
            this.map.moveEntityAtPoint(this.currentEntity, target,
                () => this.nextAction(),
                (error) => {
                    console.log('sorry', error);
                    this.ticking = false;
                });

            this.ticking = true;
        }
    }

    public nextAction() {
        console.time('nextAction');
        this.ticking = false;
        this.currentEntity.currentAction++;
        this.updateVisibleSquaresOfEntity(this.currentEntity);
        if (this.currentEntity.currentAction >= this.currentEntity.maxAction) {
            this.nextCharacter();
        }
        this.doAction();
    }
    private doAction() {
        this.map.setAccessibleTilesByEntity(this.currentEntity, () => {
            console.timeEnd("nextAction");
            if (this.currentTeamId === this.zombieTeamId) {
                this.zombieTeam[this.currentIndex].play(this.map, this);
            } else {
                this.showAccessibleTiles();
            }
        });
    }
    private showAccessibleTiles() {
        let positions: Array<Phaser.Point> = new Array();
        this.currentEntity.pathes.forEach((path, key) => {
            let splittedKey = key.split('_'),
                squareX = Number(splittedKey[0]),
                squareY = Number(splittedKey[1]);
            positions.push(this.map.getPointAtSquare(squareX, squareY));
        });
        this.engine.addAccessibleTiles(positions);
    }
}