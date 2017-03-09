import { ScrollableArea } from 'app/phaser/phaser.scrollable';
import { GameService, MapResponse, CreatedMap } from 'app/loader/game.service';

// https://www.leshylabs.com/apps/sstool/
export class Game {
    private tileMap: Map<number, any>;
    private text: Phaser.Text;
    private marker: Phaser.Sprite;
    private collisionLayer: Phaser.TilemapLayer;
    private horizontalScroll = true;
    private verticalScroll = true;
    private kineticMovement = true;
    private scroller;
    private phaserGame: Phaser.Game;
    private cursors: Phaser.CursorKeys;
    private player: Phaser.Sprite;
    private wasd: any;
    private speed = 300;
    private map: Phaser.Tilemap;
    private tween: Phaser.Tween;
    private startX: number;
    private startY: number;

    constructor(private gameService: GameService) {


        this.gameService.getMapJson('zombie').subscribe(
            next => this.init(next),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));

    }
    private init(mapResponse: MapResponse) {
        let self = this;

        this.phaserGame = new Phaser.Game((window.innerWidth - 100) * window.devicePixelRatio, (window.innerHeight - 100) * window.devicePixelRatio, Phaser.WEBGL, 'game', { preload: preload, create: create, update: update }, false, false);

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
        this.phaserGame.camera.flash(0xff0000, 50, false, 0.7);
    }

    private preload(mapResponse: MapResponse) {

        Phaser.Canvas.setImageRenderingCrisp(this.phaserGame.canvas);
        //this.phaserGame.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        //this.phaserGame.scale.setUserScale(2, 2);
        this.phaserGame.load.atlas('sprites', 'assets/sprites/spriteatlas/sprites.png', 'assets/sprites/spriteatlas/sprites.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.phaserGame.load.atlas('heroes-sprites', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.phaserGame.load.atlas('zombie-sprites', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.gameService.LoadTileMap(mapResponse, this.phaserGame);
    }



    create(mapResponse: MapResponse) {
        let game: Phaser.Game = this.phaserGame;

        //à enlever
        this.phaserGame.camera.setPosition(32, 32);

        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  The 'tavern' key here is the Loader key given in game.load.tilemap
        let createdMap: CreatedMap = this.gameService.create(mapResponse, game);
        this.map = createdMap.map;
        this.tileMap = createdMap.tileMap;

        let collisionLayer = createdMap.layers.get('collisions');
        this.collisionLayer = collisionLayer;
        this.map.setCollisionByExclusion([], true, this.collisionLayer);

        this.collisionLayer.resizeWorld();


        this.cursors = game.input.keyboard.createCursorKeys();
        this.wasd = {
            up: game.input.keyboard.addKey(Phaser.Keyboard.Z),
            down: game.input.keyboard.addKey(Phaser.Keyboard.S),
            left: game.input.keyboard.addKey(Phaser.Keyboard.Q),
            right: game.input.keyboard.addKey(Phaser.Keyboard.D),
            cameraDown: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_2),
            cameraUp: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_8),
            cameraLeft: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_4),
            cameraRight: game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_6),
            topTown: game.input.keyboard.addKey(Phaser.Keyboard.END)
        };


        this.player = game.add.sprite(32, 32, 'heroes-sprites');
        let player = this.player;
        player.animations.add("down", ["sprite1", "sprite2", "sprite3"], 5, true);
        player.animations.add("stand-down", ["sprite2"], 5, true);
        player.play("stand-down");
        this.marker = game.add.sprite(0, 0, 'sprites');
        this.marker.animations.add("blink", ["marker/blink1", "marker/blink2"], 5, true);
        this.marker.play("blink");
        this.marker.inputEnabled = true;
        this.marker.events.onInputDown.add(this.listener, this);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        game.physics.enable(this.marker, Phaser.Physics.ARCADE);
        player.body.collideWorldBounds = true;


        
        let zombie = game.add.sprite(132, 32, 'zombie-sprites');
        zombie.animations.add("z-down", ["sprite132", "sprite133", "sprite134"], 3, true);
        zombie.play("z-down");


        game.input.mouse.capture = true;
        ///game.camera.follow(this.marker);


        this.text = game.add.text(250, 8, '', {
            fontSize: '8px',
            fill: '#ffffff'
        });
        this.text.alpha = 0.8;
    }


    private listener() {
        let marker = this.marker;

        this.text.x = this.marker.x;
        this.text.y = this.marker.y;

        let tile: Phaser.Tile = this.map.getTileWorldXY(marker.x, marker.y, 16, 16, this.collisionLayer);
        if (tile && this.tileMap.has(tile.index)) {
            console.log(this.tileMap.get(tile.index));
            this.text.text = ("on ne peux pas bouger ici !");
        } else {
            this.moveTo(this.player, marker.x, marker.y-36);
            this.text.text = ("Let's go !");
        }
    }

    public moveTo(sprite: Phaser.Sprite, x: number, y: number) {
        let game = this.phaserGame,
            duration = (game.physics.arcade.distanceToPointer(sprite, this.phaserGame.input.activePointer) / 300) * 1000;
        if (this.tween && this.tween.isRunning) {
            this.tween.stop();
        }

        this.player.play("down");
        this.tween = game.add.tween(sprite).to({ x: x, y: y }, duration, Phaser.Easing.Linear.None, true);
        this.tween.onComplete.add(this.onComplete, this);
    }

    private onComplete() {
        this.player.play("stand-down");
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

    private setMarker() {
        let marker: Phaser.Sprite = this.marker,
            tilePointBelowPointer: Phaser.Point = this.pointToTilePosition(); // get tile coordinate below activePointer
        let tileBelowPointer: Phaser.Tile = this.map.getTileWorldXY(tilePointBelowPointer.x, tilePointBelowPointer.y, 16, 16, this.collisionLayer);

        if (tileBelowPointer && tileBelowPointer.canCollide) {
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
            tilesetSize = 16,
            point = new Phaser.Point();
        point.x = tilesetSize * Math.round((activePointer.x + cameraPosition.x - 8) / tilesetSize);
        point.y = tilesetSize * Math.round((activePointer.y + cameraPosition.y - 8) / tilesetSize);
        return point;
    }
    private handlerKeyBoard() {
        let camera = this.phaserGame.camera,
            cameraPosition = camera.position;
        let noDirectionPressedflag = true;

        if (this.wasd.left.isDown) {
            this.player.body.velocity.x = -this.speed;
            this.startX = Date.now();
            noDirectionPressedflag = false;
        }
        else if (this.wasd.right.isDown) {
            this.player.body.velocity.x = this.player.body.velocity.x < this.speed ? this.speed : this.player.body.velocity.x * 1.05;
            this.startX = Date.now();
            noDirectionPressedflag = false;
        }
        if (this.wasd.up.isDown) {
            this.player.body.velocity.y = -this.speed;
            this.startY = Date.now();
            noDirectionPressedflag = false;
        }
        else if (this.wasd.down.isDown) {
            this.player.body.velocity.y = this.speed;
            this.startY = Date.now();
            noDirectionPressedflag = false;
        }
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
            this.player.body.velocity.set(0);
        }
        if (this.phaserGame.physics.arcade.collide(this.player, this.collisionLayer)) {
            console.log('boom');
        }
        if (this.phaserGame.physics.arcade.collide(this.marker, this.collisionLayer)) {
            console.log('hey, cursor is over collide area !!');
        }
    }

    update() {
        this.setMarker();
        this.updateCamera();
        this.handlerKeyBoard();

        //game.debug.bodyInfo(this.player, 32, 32);
        //game.debug.body(this.player);
    }
}