import { Player } from 'app/game/player'
import { Ennemy } from 'app/game/ennemy'
import { Zombie } from 'app/game/zombie'
import { GameMap } from 'app/game/map'
import { Entity, EntityType } from 'app/game/entity'
import { Engine } from 'app/phaser/engine'
import { GameService } from 'app/loader/game.service'


export class Game {
    private ticking: boolean;
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
        this.map = new GameMap('zombie');
        this.engine = new Engine(this.map.getName(), gameService);
        this.engine.observable.subscribe(
            next => this.setUpTeams(),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));
    }

    private setUpTeams() {
        let engine = this.engine,
            targetCallback = (z) => this.targeted(z),
            map = this.map;
        this.turn = 0;
        this.map.setEngine(engine);
        map.preparePathCalculator();
        this.playerTeam = new Array<Player>();
        this.ennemyTeam = new Array<Ennemy>();
        this.zombieTeam = new Array<Zombie>();

        this.addPlayer(5, 3);
        this.addPlayer(6, 3);

        this.addZombieAt(21, 9);
        this.addZombieAt(17, 9);
        this.addZombieAt(18, 9);
        this.addZombieAt(19, 9);
        this.addZombieAt(20, 9);
        this.addZombieAt(15, 10);
        this.addZombieAt(16, 10);
        this.addZombieAt(17, 10);
        this.addZombieAt(18, 10);
        this.addZombieAt(19, 10);

        this.currentIndex = -1;
        this.currentTeamId = this.playerTeamId;
        this.currentTeam = this.playerTeam;
        this.updateAllVisibilities();
        this.nextCharacter();
        this.showAccessibleTilesByPlayer();
        engine.bindClick(point => this.clickOn(point));
    }

    private addZombieAt(x, y) {
        this.map.putEntityAtPoint(Zombie.popZombie(this.engine, this.map.getPointAtSquare(x, y), this.zombieTeamId, this.zombieTeam));
    }
    private addPlayer(x, y) {
        let player = Player.popPlayer(this.engine, this.map.getPointAtSquare(x, y), this.playerTeamId, this.playerTeam);
        this.map.putEntityAtPoint(player);

        player.targetSquare = this.map.squares.get(x + ':' + y);
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

    private updateVisibleSquaresOfEntity(entity: Entity) {
        console.time('updateVisibleSquaresOfEntity');

        this.map.setVisibileSquares(entity);

        if (this.currentTeamId === this.zombieTeamId) {
            if (!entity.updateAccessibleTiles) {
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
        console.timeEnd("updateVisibleSquaresOfEntity");
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


    private clickOn(target: Phaser.Point) {
        if (this.ticking) {
            return
        }
        let square = this.map.getSquareAtPoint(target);

        // targeting something
        if (square.entity) {
            this.currentEntity.updateAccessibleTiles = false;
            this.targeted(square.entity);
            this.ticking = true;
            this.nextAction();
        }
        else {
            // moving to
            if (!this.map.canEntityGoToTarget(this.currentEntity, target)) {
                return;
            }

            this.currentEntity.updateAccessibleTiles = true;

            this.currentEntity.targetSquare = this.map.getSquareAtPoint(target);
            this.showAccessibleTilesByPlayer();

            this.map.moveEntityAtPoint(this.currentEntity, target,
                () => this.nextAction(),
                (error) => {
                    console.log('sorry', error);
                    this.ticking = false;
                });

            this.ticking = true;
        }
    }

    private doAction() {

        if (!this.currentEntity.targetSquare) {
            this.currentEntity.targetSquare = this.currentEntity.square;
        }

        if (this.currentTeamId === this.zombieTeamId) {
            this.map.setAccessibleTilesByEntity(this.currentEntity, () => {
                console.timeEnd("nextAction");
                this.zombieTeam[this.currentIndex].play(this.map, this);
            });
        } else {
            if (this.currentEntity.currentAction === 0) {
                this.showAccessibleTilesByPlayer();
            }
        }
    }

    private showAccessibleTilesByPlayer() {
        this.map.setAccessibleTilesByEntity(this.currentEntity, () => {
            this.currentEntity.updateAccessibleTiles = false;
            this.showAccessibleTiles(this.currentEntity);
        });
    }

    /**
     * show accessible tile for current entity
     */
    private showAccessibleTiles(entity: Entity) {
        let positions: Array<Phaser.Point> = new Array();
        entity.pathMap.forEach((path, key) => {
            let splittedKey = key.split('_'),
                squareX = Number(splittedKey[0]),
                squareY = Number(splittedKey[1]);
            positions.push(this.map.getPointAtSquare(squareX, squareY));
        });
        this.engine.addAccessibleTiles(positions);
    }
}