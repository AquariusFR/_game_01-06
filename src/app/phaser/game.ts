import { ScrollableArea } from 'app/phaser/phaser.scrollable';
import { GameService, MapResponse, CreatedMap } from 'app/loader/game.service';
export class Game {
    tileMap: Map<number, any>;
    text: Phaser.Text;
    marker: Phaser.Sprite;
    collisionLayer: Phaser.TilemapLayer;

    private horizontalScroll = true;
    private verticalScroll = true;
    private kineticMovement = true;
    private scroller;
    private phaserGame: Phaser.Game;
    private cursors: Phaser.CursorKeys;
    private player: Phaser.Sprite;
    private wasd: any;
    private speed = 300;


    constructor(private gameService: GameService) {


        this.gameService.getMapJson('map00').subscribe(
            next => this.init(next),
            error => console.error('error loading map'),
            () => console.log('c\'est fini'));

    }
    public init(mapResponse: MapResponse) {
        let self = this;

        this.phaserGame = new Phaser.Game(600 * window.devicePixelRatio, window.innerHeight / 2 * window.devicePixelRatio, Phaser.WEBGL, 'game', { preload: preload, create: create, update: update }, false, false);

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



        this.phaserGame.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        this.phaserGame.scale.setUserScale(2, 2);
        //this.phaserGame.renderer.renderSession.roundPixels = true;
        Phaser.Canvas.setImageRenderingCrisp(this.phaserGame.canvas);


        this.gameService.LoadTileMap(mapResponse, this.phaserGame);

        //this.phaserGame.load.image('map', 'assets/bigtile.png');
        this.phaserGame.load.image('placeholder', 'assets/placeholder_sprite.png');
        this.phaserGame.load.image('background', 'assets/lightworld_large.gif');
        this.phaserGame.load.atlas('sprites', 'assets/sprites/spriteatlas/sprites.png', 'assets/sprites/spriteatlas/sprites.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);

    }

    private map: Phaser.Tilemap;

    create(mapResponse: MapResponse) {
        let game: Phaser.Game = this.phaserGame;
        //game.camera.scale.x = 2;
        //game.camera.scale.y = 2;


        //à enlever
        this.phaserGame.camera.setPosition(32, 32);

        game.physics.startSystem(Phaser.Physics.ARCADE);

        let image = game.make.image(0, 0, "background");
        //  The 'tavern' key here is the Loader key given in game.load.tilemap
        let createdMap: CreatedMap = this.gameService.create(mapResponse, game);
        this.map = createdMap.map;
        this.tileMap = createdMap.tileMap;

        let collisionLayer = createdMap.layers.get('collisions');

        //collisionsLayer.setScale(2);

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


        this.player = game.add.sprite(32, 32, 'sprites');
        this.player.animations.add("down", ["hero/hero-down-0", "hero/hero-down-1"], 5, true);
        this.player.play("down");
        game.physics.enable(this.player, Phaser.Physics.ARCADE);
        game.input.mouse.capture = true;
        this.marker = game.add.sprite(0, 0, 'sprites');
        this.marker.animations.add("blink", ["marker/blink1", "marker/blink2"], 5, true);
        this.marker.play("blink");
        this.marker.inputEnabled = true;
        this.marker.events.onInputDown.add(this.listener, this);
        ///game.camera.follow(this.marker);


        this.text = game.add.text(250, 16, '', { fill: '#ffffff' });
    }

    private counter: number = 0;

    listener() {
        let x = this.phaserGame.input.activePointer.x,
            y = this.phaserGame.input.activePointer.y;
        this.counter++;
        this.text.x = x;
        this.text.y = y;

        this.map.objects;

        //var _x = this.collisionLayer.getTileX(this.phaserGame.input.activePointer.worldX);
        //var _y = this.collisionLayer.getTileY(this.phaserGame.input.activePointer.worldY);

        //var tile = this.map.getTile(_x, _y, this.collisionLayer);

        let tile: Phaser.Tile = this.map.getTileWorldXY(x, y, 16, 16, this.collisionLayer);
        if (tile && this.tileMap.has(tile.index)) {
            console.log(this.tileMap.get(tile.index));
        }
        this.text.text = ("You clicked " + tile + this.counter + " times!");
    }



    moveTo(x, y) {/*
        let game = new Phaser.Game(tilesetSize00, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create });
        function preload() { game.load.image('arrow', 'assets/sprites/arrow.png'); }
        let sprite; let tween; function create() {
            sprite = game.add.sprite(32, 32, 'arrow'); sprite.anchor.setTo(0.5, 0.5);
            game.input.onDown.add(moveSprite, this);
        }
        function moveSprite(pointer) {
            if (tween && tween.isRunning) {
                tween.stop();
            } sprite.rotation = game.physics.angleToPointer(sprite, pointer);
            //  300 = 300 pixels per second = the speed the sprite will move at, regardless of the distance it has to travel   
            let duration = (game.physics.distanceToPointer(sprite, pointer) / 300) * 1000;
            tween = game.add.tween(sprite).to({ x: pointer.x, y: pointer.y }, duration, Phaser.Easing.Linear.None, true);
        }*/
    }

    private now: number;
    private timestamp: number;
    private startX: number;
    private startY: number;


    hitSprite() {
        console.log('collision !!!');
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
        let game = this.phaserGame,
            camera = game.camera,
            activePointer = game.input.activePointer,
            tilesetSize = 16,
            cameraPosition = camera.position,
            marker = this.marker;

        marker.x = tilesetSize * Math.round((activePointer.x + cameraPosition.x - 8) / tilesetSize);
        marker.y = tilesetSize * Math.round((activePointer.y + cameraPosition.y - 8) / tilesetSize);
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
        };
    }

    update() {
        let game = this.phaserGame,
            camera = game.camera,
            cameraPosition = game.camera.position;

        this.setMarker();
        this.updateCamera();

        this.now = Date.now();
        let elapsed = this.now - this.timestamp;
        this.timestamp = this.now;

        if (false && this.player.body.velocity.x || this.player.body.velocity.y) {

            let coeffX = this.startX ? (this.timestamp - this.startX) * 150 / 1000 : 0;
            let coeffY = this.startY ? (this.timestamp - this.startY) * 150 / 1000 : 0;

            let velocityx = Math.abs(this.player.body.velocity.x) - coeffX;
            let velocityy = Math.abs(this.player.body.velocity.y) - coeffY;

            velocityx = velocityx < 10 ? 0 : velocityx;
            velocityy = velocityy < 10 ? 0 : velocityy;

            velocityx = this.player.body.velocity.x > 0 ? velocityx : -velocityx;
            velocityy = this.player.body.velocity.y > 0 ? velocityy : -velocityy;

            this.player.body.velocity.x = velocityx;
            this.player.body.velocity.y = velocityy;

            if (this.player.body.velocity.x = 0) {
                this.startX = 0;
            }
            if (this.player.body.velocity.y = 0) {
                this.startY = 0;
            }
        }

        this.handlerKeyBoard();

        //game.debug.bodyInfo(this.player, 32, 32);
        //game.debug.body(this.player);
    }
}