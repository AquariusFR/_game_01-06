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

        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(6, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(7, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(8, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(9, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(10, 9), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(5, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(6, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(7, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(8, 10), this.zombieTeamId, this.zombieTeam));
        map.putEntityAtPoint(Zombie.popZombie(engine, map.getPointAtSquare(9, 10), this.zombieTeamId, this.zombieTeam));


        this.currentIndex = -1;
        this.currentTeamId = this.playerTeamId;
        this.currentTeam = this.playerTeam;
        this.nextCharacter();
        this.map.showAccessibleTilesByEntity(this.currentEntity);
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
        this.map.showAccessibleTilesByEntity(this.currentEntity, () => {
            if (this.currentTeamId === this.zombieTeamId) {
                this.zombieTeam[this.currentIndex].play(this.map, this);
            }
        });

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
            this.targeted(square.entity);
            this.ticking = true;
            this.nextAction();
        }
        else {
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
        this.ticking = false;
        this.currentEntity.currentAction++;
        if (this.currentEntity.currentAction >= this.currentEntity.maxAction) {
            this.nextCharacter();
        }
        else {
            this.map.showAccessibleTilesByEntity(this.currentEntity, () => {
            if (this.currentTeamId === this.zombieTeamId) {
                this.zombieTeam[this.currentIndex].play(this.map, this);
            }
        });
        }
    }
}