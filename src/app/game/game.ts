import { Player } from 'app/game/player';
import { Ennemy } from 'app/game/ennemy';
import { Zombie } from 'app/game/zombie';
import { Entity, EntityType } from 'app/game/entity';
import { Engine } from 'app/phaser/engine';
import { GameService } from 'app/loader/game.service';

export class Game {
    private engine: Engine;
    private playerTeam: Array<Player>;
    private ennemyTeam: Array<Ennemy>;
    private zombieTeam: Array<Zombie>;
    private turn: number;
    private currentEntity: Entity;
    private currentTeam: Array<Entity>;

    private zombieTeamId: number = 0;
    private playerTeamId: number = 1;
    private ennemyTeamId: number = 2;

    constructor(gameService: GameService) {
        this.playerTeam = new Array<Player>();
        this.ennemyTeam = new Array<Ennemy>();
        this.zombieTeam = new Array<Zombie>();
        this.turn = 0;
        this.engine = new Engine(gameService, (point:Phaser.Point)=> this.moveTo(point));

        this.engine.observable.subscribe(
            next => this.setUpTeams(),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));
    }

    private setUpTeams() {
        let engine = this.engine,
            targetCallback = (z) => this.targeted(z);
        this.playerTeam = new Array<Player>();
        this.ennemyTeam = new Array<Ennemy>();
        this.zombieTeam = new Array<Zombie>();



        Zombie.popZombie(engine, 132, 82, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 172, 82, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 212, 82, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 282, 84, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 322, 82, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 135, 85, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 175, 62, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 215, 66, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 285, 72, targetCallback, this.zombieTeamId, this.zombieTeam);
        Zombie.popZombie(engine, 325, 77, targetCallback, this.zombieTeamId, this.zombieTeam);

        Player.popPlayer(engine, 32, 32, (p) => this.targeted(p), this.playerTeamId, this.playerTeam);
        Player.popPlayer(engine, 42, 32, (p) => this.targeted(p), this.playerTeamId, this.playerTeam);


        this.currentTeam = this.playerTeam;
        this.currentEntity = this.playerTeam[0];
    }

    public nextTurn() {

    }

    public nextTeam() {

    }

    // une entité a été ciblé
    public targeted(target: Entity) {
        if (this.IsEntityInCurrentTeam(target)) {
            this.helpTeamMate(target);
        } else {
            this.attack(target);
        }
    }

    public IsEntityInCurrentTeam(target: Entity) {

    }

    public helpTeamMate(target: Entity) {
        console.log(this.currentEntity + ' helps ' + target);
    }

    public attack(target: Entity) {
        console.log(this.currentEntity + ' attacks ' + target);
    }

    public moveTo(target: Phaser.Point) {
        this.currentEntity.move(target);
    }
}