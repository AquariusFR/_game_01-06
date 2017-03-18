import { Entity } from 'app/game/entity'
import { GameService, MapResponse, CreatedMap } from 'app/loader/game.service';
import { Observable } from 'rxjs/Observable';

//http://rpgmaker.su/downloads/%D0%B4%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8F/238-pop-horror-city-character-pack-1-a
//https://forums.rpgmakerweb.com/index.php?threads/pop-freebies.45329/
// https://www.leshylabs.com/apps/sstool/
export class Engine {
    gamegroup:  Phaser.Group;
    private soundeffect: Phaser.Sound;
    private glowTween: Phaser.Tween;
    private glowPosition: Phaser.Point;
    private tileMap: Map<number, any>;
    private text: Phaser.Text;
    private marker: Phaser.Sprite;
    private glow: Phaser.Sprite;
    private collisionLayer: Phaser.TilemapLayer;
    private horizontalScroll = true;
    private verticalScroll = true;
    private kineticMovement = true;
    private scroller;
    private phaserGame: Phaser.Game;
    private cursors: Phaser.CursorKeys;
    //private player: Phaser.Sprite;
    private wasd: any;
    private speed = 300;
    public map: Phaser.Tilemap;
    private tween: Phaser.Tween;
    private startX: number;
    private startY: number;
    public observable: Observable<string>;
    private status: (string) => void;
    private o;

    constructor(mapName: string, private gameService: GameService, private moveActiveSpriteTo: (point: Phaser.Point) => void) {
        this.observable = Observable.create(o => {
            this.o = o;
            this.status = o.next;
        });
        this.gameService.getMapJson(mapName).subscribe(
            next => this.init(next),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));
    }
    private init(mapResponse: MapResponse) {
        let self = this;

        this.phaserGame = new Phaser.Game(1600 * window.devicePixelRatio, (window.innerHeight - 100) * window.devicePixelRatio, Phaser.WEBGL, 'game', { preload: preload, create: create, update: update }, false, false);

        function preload() {
            self.preload(mapResponse);
        }
        function create() {
            self.create(mapResponse);
        }
        function update() {
            self.update();
        }
    }

    public shake() {
        this.phaserGame.camera.resetFX();
        this.phaserGame.camera.shake(0.004, 100, true, Phaser.Camera.SHAKE_BOTH, true);
        //this.phaserGame.camera.flash(0xffffff, 50, false, 0.7);
    }

    private preload(mapResponse: MapResponse) {

        Phaser.Canvas.setImageRenderingCrisp(this.phaserGame.canvas);
        //this.phaserGame.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        //this.phaserGame.scale.setUserScale(2, 2);
        this.phaserGame.load.atlas('sprites', 'assets/sprites/spriteatlas/sprites.png', 'assets/sprites/spriteatlas/sprites.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.phaserGame.load.atlas('heroes-sprites', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.phaserGame.load.atlas('zombie-sprites', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.phaserGame.load.atlas('markers', 'assets/tiles/POPHorrorCity_GFX/Graphics/System/markers.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/System/markers.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.gameService.LoadTileMap(mapResponse, this.phaserGame);
        this.phaserGame.load.audio('boden', ['assets/sounds/essai.mp3']);
        this.phaserGame.load.audio('soundeffect', ['assets/sounds/soundeffect.ogg']);
        this.phaserGame.load.atlas('candle-glow', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Objects/Candle_Glow.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Objects/Candle_Glow.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);

    }

    create(mapResponse: MapResponse) {
        let game: Phaser.Game = this.phaserGame;
        let music = game.add.audio('boden', 1, true);
        let soundeffect = game.add.audio('soundeffect', 1, true);
        this.gamegroup = game.add.group();
        let gamegroup = this.gamegroup;

        music.play();
        music.volume = 0.1;
        //à enlever
        this.phaserGame.camera.setPosition(32, 32);

        soundeffect.allowMultiple = true;
        soundeffect.addMarker('shotgun', 10.15, 0.940);
        soundeffect.addMarker('gun', 109.775, 0.550);
        soundeffect.addMarker('grunt', 197.618, 0.570);
        this.soundeffect = soundeffect;

        game.physics.startSystem(Phaser.Physics.ARCADE);

        let createdMap: CreatedMap = this.gameService.create(mapResponse, game, this.gamegroup);
        let collisionLayer = createdMap.layers.get('collisions');

        this.map = createdMap.map;
        this.tileMap = createdMap.tileMap;

        this.collisionLayer = collisionLayer;
        //this.map.setCollisionByExclusion([], true, this.collisionLayer);

        this.collisionLayer.resizeWorld();

        this.cursors = game.input.keyboard.createCursorKeys();
        this.wasd = {
            cameraDown: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_2),
            cameraUp: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_8),
            cameraLeft: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_4),
            cameraRight: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_6),
            topTown: game.input.keyboard.addKey(Phaser.Keyboard.END)
        };

        this.marker = game.add.sprite(0, 0, 'markers');
        gamegroup.add(this.marker);
        this.marker.animations.add("blink", ["marker/blink1", "marker/blink2"], 5, true);
        this.marker.play("blink");
        game.physics.enable(this.marker, Phaser.Physics.ARCADE);


        this.glow = game.add.sprite(-100, -100, 'markers');
        gamegroup.add(this.glow);
        this.glow.animations.add("glow", ["marker/active_entity"], 5, true);
        this.glow.play("glow");
        game.physics.enable(this.glow, Phaser.Physics.ARCADE);


        let lastLayer = createdMap.layers.get('example sprite');
        lastLayer.inputEnabled = true;
        lastLayer.events.onInputDown.add(this.listener, this);

        this.o.next('ok');
        //this.gamegroup.scale.x = 2;
        //this.gamegroup.scale.y = 2;
    }


    public setGlowPosition(position: Phaser.Point) {
        this.phaserGame.tweens.removeAll();
        this.glow.x = position.x;
        this.glow.y = position.y+32;

    }

    public createHuman(position: Phaser.Point): Phaser.Sprite {
        let human = this.phaserGame.add.sprite(position.x, position.y, 'heroes-sprites');
        human.animations.add("down", ["sprite1", "sprite2", "sprite3"], 5, true);
        human.animations.add("left", ["sprite13", "sprite14", "sprite15"], 5, true);
        human.animations.add("right", ["sprite25", "sprite26", "sprite27"], 5, true);
        human.animations.add("up", ["sprite37", "sprite38", "sprite39"], 5, true);
        human.animations.add("stand-down", ["sprite2"], 5, true);
        human.play("stand-down");
        this.phaserGame.physics.enable(human, Phaser.Physics.ARCADE);
        human.body.collideWorldBounds = true;
        this.gamegroup.add(human);
        return human;
    }


    public createZombie(position: Phaser.Point): Phaser.Sprite {
        let zombie = this.phaserGame.add.sprite(position.x, position.y, 'zombie-sprites');
        zombie.smoothed = false;
        zombie.scale.setTo(1, this.phaserGame.rnd.realInRange(0.9, 1.2))
        zombie.animations.add("z-down", ["sprite132", "sprite133", "sprite134"], 3, true);
        zombie.play("z-down");
        this.gamegroup.add(zombie);
        return zombie;
    }

    public playSound(soundName: string) {
        this.soundeffect.play(soundName);
    }

    private listener() {
        let marker = this.marker,
            targetPoint: Phaser.Point = new Phaser.Point();

        targetPoint.x = marker.x;
        targetPoint.y = marker.y;

        this.moveActiveSpriteTo(targetPoint);
    }

    public moveGlowPosition(position: Phaser.Point) {
        let game = this.phaserGame;

        if (this.glowTween && this.glowTween.isRunning) {
            this.glowTween.stop();
        }

        this.glowTween = game.add.tween(this.glow).to({ x: position.x, y: position.y }, 100, Phaser.Easing.Linear.None, true);
        this.glowTween.onComplete.add(() => this.glowTween.stop(), this);
    }
    public moveTo(sprite: Phaser.Sprite, x: number, y: number, animationMoving: string, callback: () => void) {

        let game = this.phaserGame;

        if (this.tween && this.tween.isRunning) {
            this.tween.stop();
        }
        if (sprite.animations.currentAnim.name != animationMoving) {
            sprite.play(animationMoving);
        }
        this.tween = game.add.tween(sprite).to({ x: x, y: y }, 100, Phaser.Easing.Linear.None, true);
        this.tween.onComplete.add(() => this.onComplete(sprite, callback), this);
    }

    private onComplete(sprite: Phaser.Sprite, callback: () => void) {
        callback();
    }

    private getTopDownCameraPositionY(): number {
        let game = this.phaserGame,
            camera = game.camera;
        return (camera.bounds.bottom) - (camera.height / 2)
    }

    private updateCamera() {
        let game = this.phaserGame,
            camera = game.camera,
            activePointer = game.input.activePointer,
            cameraPosition = camera.position,
            livezone = 32,
            cameraStep = 16;

        if (activePointer.x <= livezone) {
            this.phaserGame.camera.setPosition(cameraPosition.x - cameraStep, cameraPosition.y);
        }
        else if (activePointer.y <= livezone) {
            this.phaserGame.camera.setPosition(cameraPosition.x, cameraPosition.y - cameraStep);
        }
        else if (activePointer.x >= camera.width - livezone) {
            this.phaserGame.camera.setPosition(cameraPosition.x + cameraStep, cameraPosition.y);
        }
        else if (activePointer.y >= camera.height - livezone) {
            let max = Math.min(cameraPosition.y + cameraStep, this.getTopDownCameraPositionY());
            this.phaserGame.camera.setPosition(cameraPosition.x, max);
        }
    }

    public isPositionCollidable(position: Phaser.Point): boolean {
        let tile = this.getTileAtPosition(position);
        return (tile && tile.properties.cantGo);
    }

    private getTileAtPosition(position: Phaser.Point): Phaser.Tile {
        return this.map.getTileWorldXY(position.x, position.y, 16, 16, this.collisionLayer);
    }

    private setMarker() {
        let marker: Phaser.Sprite = this.marker,
            tilePointBelowPointer: Phaser.Point = this.pointToTilePosition(); // get tile coordinate below activePointer

        if (this.isPositionCollidable(tilePointBelowPointer)) {
            // do something if you want
        } else {
            marker.x = tilePointBelowPointer.x;
            marker.y = tilePointBelowPointer.y;
        }
    }

    private pointToTilePosition(): Phaser.Point {
        let game = this.phaserGame,
            camera = game.camera,
            activePointer = game.input.activePointer,
            cameraPosition = camera.position,
            tilesetSize = 32,
            point = new Phaser.Point();
        point.x = tilesetSize * Math.round((activePointer.x + cameraPosition.x - 16) / tilesetSize);
        point.y = tilesetSize * Math.round((activePointer.y + cameraPosition.y - 16) / tilesetSize);
        return point;
    }
    private handlerKeyBoard() {
        let camera = this.phaserGame.camera,
            cameraPosition = camera.position;
        let noDirectionPressedflag = true;
        if (this.wasd.cameraDown.isDown) {
            this.phaserGame.camera.setPosition(cameraPosition.x, cameraPosition.y + 5);
        }
        if (this.wasd.cameraLeft.isDown) {
            this.phaserGame.camera.setPosition(cameraPosition.x - 5, cameraPosition.y);
        }
        if (this.wasd.cameraRight.isDown) {
            this.phaserGame.camera.setPosition(cameraPosition.x + 5, cameraPosition.y);
        }
        if (this.wasd.cameraUp.isDown) {
            this.phaserGame.camera.setPosition(cameraPosition.x, cameraPosition.y - 5);
        }
        if (this.wasd.topTown.isDown) {
            this.phaserGame.camera.setPosition(cameraPosition.x, (camera.bounds.bottom) - (camera.height / 2));
        }

        if (noDirectionPressedflag) {
            //this.player.body.velocity.set(0);
        }
        /*if (this.phaserGame.physics.arcade.collide(this.player, this.collisionLayer)) {
            console.log('boom');
        }*/
        /*if (this.phaserGame.physics.arcade.collide(this.marker, this.collisionLayer)) {
            console.log('hey, cursor is over collide area !!');
        }*/
    }

    update() {
        this.setMarker();
        this.updateCamera();
        this.handlerKeyBoard();
    }
}