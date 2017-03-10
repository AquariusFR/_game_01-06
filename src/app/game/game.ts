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

    constructor(gameService: GameService) {
        this.playerTeam = new Array<Player>();
        this.ennemyTeam = new Array<Ennemy>();
        this.zombieTeam = new Array<Zombie>();
        this.turn = 0;
        this.engine = new Engine(gameService);

        this.engine.observable.subscribe(
            next => this.setUpTeams(),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));
    }

    private setUpTeams() {
       let engine = this.engine;
       this.playerTeam = new Array<Player>();
       this.ennemyTeam = new Array<Ennemy>();
       this.zombieTeam = new Array<Zombie>();
        this.zombieTeam.push(new Zombie(engine, 132,82, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 172,82, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 212,82, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 282,84, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 322,82, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 135,85, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 175,62, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 215,66, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 285,72, (z)=>this.targeted(z)));
        this.zombieTeam.push(new Zombie(engine, 325,77, (z)=>this.targeted(z)));

        this.playerTeam.push(new Player(engine,32,32, (p)=>this.targeted(p)));
        this.playerTeam.push(new Player(engine,42,52, (p)=>this.targeted(p)));


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