import { Entity } from 'app/game/entity'
import { GameService, MapResponse, CreatedMap } from 'app/loader/game.service';
import { Observable } from 'rxjs/Observable';
import { Pool } from 'app/phaser/pool'
import { VisibilitySprite } from 'app/game/visibilitySprite'
import DelayedAnimation from 'app/phaser/delayedAnimation'

//http://rpgmaker.su-downloads/%D0%B4%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8F/238-pop-horror-city-character-pack-1-a
//https://forums.rpg-akerweb.com/index.php?threads/pop-freebies.45329/
// https://www.leshylabs.com/apps/sstool/


/*
<div class="frame ctooltip">
  
    <div style="background: #225378"></div>
  
    <div style="background: #1695A3"></div>
  
    <div style="background: #ACF0F2"></div>
  
    <div style="background: #F3FFE2"></div>
  
    <div style="background: #EB7F00"></div>
  
  
</div>
<div class="frame ctooltip">
  
    <div style="background: #DC3522"></div>
  
    <div style="background: #D9CB9E"></div>
  
    <div style="background: #374140"></div>
  
    <div style="background: #2A2C2B"></div>
  
    <div style="background: #1E1E20"></div>
  </div>
 */
export class Engine {
    visibleMarkerPool: Pool;
    rangegroup: Phaser.Group;
    visiongroup: Phaser.Group;
    gamegroup: Phaser.Group;
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
    public phaserGame: Phaser.Game;
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
    private click: (point: Phaser.Point) => void;
    private over: (point: Phaser.Point) => void;
    private overOff: (point: Phaser.Point) => void;
    debug: boolean = true;


    constructor(mapName: string, private gameService: GameService) {
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

    public bindClick(click: (point: Phaser.Point) => void) {
        this.click = click;
    }
    public bindOver(over: (point: Phaser.Point) => void, overOff: (point: Phaser.Point) => void) {
        this.over = over;
        this.overOff = overOff;
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
        this.phaserGame.load.atlas('Male-Zombies-Gore', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.phaserGame.load.atlas('markers', 'assets/tiles/POPHorrorCity_GFX/Graphics/System/markers.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/System/markers.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        this.gameService.LoadTileMap(mapResponse, this.phaserGame);
        this.phaserGame.load.audio('boden', ['assets/sounds/essai.mp3']);
        this.phaserGame.load.audio('MechDrone1', ['assets/sounds/MechDrone1.mp3']);
        this.phaserGame.load.audio('soundeffect', ['assets/sounds/soundeffect.ogg']);
        this.phaserGame.load.atlas('candle-glow', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Objects/Candle_Glow.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Objects/Candle_Glow.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);

    }

    create(mapResponse: MapResponse) {
        let game: Phaser.Game = this.phaserGame;
        let MechDrone1 = game.add.audio('MechDrone1', 1, true);
        let soundeffect = game.add.audio('soundeffect', 0.1, true);
        this.gamegroup = game.add.group();
        this.rangegroup = game.add.group();
        this.visiongroup = game.add.group();
        let gamegroup = this.gamegroup;

        MechDrone1.play();
        MechDrone1.volume = 0.5;
        soundeffect.volume = 0;

        //à enlever
        game.camera.setPosition(32, 32);

        soundeffect.allowMultiple = true;
        soundeffect.addMarker('shotgun', 10.15, 0.940);
        soundeffect.addMarker('gun', 109.775, 0.550, 0.5);
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

        this.visibleMarkerPool = new Pool(game, VisibilitySprite, 200, 'visibleMarker');
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
        lastLayer.events.onInputDown.add(this.clickListener, this);

        if (this.debug) {
            this.text = this.phaserGame.add.text(-100, -100, '', null);
        }

        this.o.next('ok');
        //this.gamegroup.scale.x = 2;
        //this.gamegroup.scale.y = 2;
    }
    public removeAllAccessibleTiles() {
        this.rangegroup.removeAll();
    }

    public addAccessibleTiles(tiles: Array<Phaser.Point>) {
        this.removeAllAccessibleTiles();
        tiles.forEach(tile => {
            let tileSprite = this.phaserGame.add.sprite(tile.x, tile.y, 'markers');
            this.rangegroup.add(tileSprite);
            tileSprite.animations.add("glow", ["marker/accessible_tile"], 5, true);
            tileSprite.play("glow");
        }
        );
    }


    mapVisibleTileCount: Map<string, number> = new Map();
    mapVisibleTile: Map<string, Phaser.Sprite> = new Map();

    public removeVisibleTiles(tilesKey: Array<string>) {
        tilesKey.forEach(tileKey => {
            if (this.mapVisibleTileCount.has(tileKey)) {
                let count = 0;
                this.mapVisibleTileCount.set(tileKey, count);
                this.mapVisibleTile.get(tileKey).alive = false;
                this.mapVisibleTile.get(tileKey).visible = false;
            }
        });
    }
    public removeAllVisibleTiles() {
        this.mapVisibleTileCount = new Map();
        this.mapVisibleTile = new Map();
        this.visibleMarkerPool.sprites.forEach(sprite => {
            sprite.alive = false;
            sprite.visible = false;
        });
    }
    public addVisibleTiles(oldTiles: Array<Phaser.Point>, tiles: Array<Phaser.Point>) {
        //console.time('addVisibleTiles');

        let oldKeysToDelete: Set<string> = new Set(),
            newKeys: Set<string> = new Set();

        tiles.forEach(tile => newKeys.add(tile.x + ':' + tile.y));
        oldTiles.forEach(tile => {
            if (!newKeys.has(tile.x + ':' + tile.y)) {
                oldKeysToDelete.add(tile.x + ':' + tile.y)
            }
        });

        this.removeVisibleTiles(Array.from(oldKeysToDelete));

        tiles.forEach(tile => {
            let tileKey = tile.x + ':' + tile.y;
            if (!this.mapVisibleTileCount.has(tileKey)) {
                this.mapVisibleTileCount.set(tileKey, 0);
            }

            let count = this.mapVisibleTileCount.get(tileKey);

            if (count < 1) {
                this.mapVisibleTile.set(tileKey, this.visibleMarkerPool.createNew(tile.x, tile.y));
            }


            if (!oldKeysToDelete.has(tileKey)) {
                this.mapVisibleTileCount.set(tileKey, count + 1);
            }
        }
        );
        //console.timeEnd("addVisibleTiles");
    }


    public createHuman(position: Phaser.Point): Phaser.Sprite {
        let human = this.phaserGame.add.sprite(position.x, position.y - 32, 'heroes-sprites');
        human.animations.add("down", ["sprite1", "sprite2", "sprite3"], 5, true);
        human.animations.add("left", ["sprite13", "sprite14", "sprite15"], 5, true);
        human.animations.add("right", ["sprite25", "sprite26", "sprite27"], 5, true);
        human.animations.add("up", ["sprite37", "sprite38", "sprite39"], 5, true);
        human.animations.add("stand-down", ["sprite2"], 5, true);
        human.play("stand-down");
        this.gamegroup.add(human);
        return human;
    }


    public createZombie(position: Phaser.Point, zombieType: string): Phaser.Sprite {
        let zombie = this.phaserGame.add.sprite(position.x, position.y - 32, 'Male-Zombies-Gore'),
            framerate = 3;
        zombie.smoothed = false;
        zombie.scale.setTo(1, this.phaserGame.rnd.realInRange(0.9, 1.2))
        let delay = this.phaserGame.rnd.integerInRange(0, 50);

        //zombie.animations.add("down", [zombieType + "-down-1", zombieType + "-down-2", zombieType + "-down-3", zombieType + "-down-2"], framerate, true);
        
        DelayedAnimation.addToAnimations(zombie.animations, delay, "down", [zombieType + "-down-1", zombieType + "-down-2", zombieType + "-down-3", zombieType + "-down-2"], framerate, true);

        zombie.animations.add("left", [zombieType + "-left-1", zombieType + "-left-2", zombieType + "-left-3"], framerate, true);
        zombie.animations.add("right", [zombieType + "-right-1", zombieType + "-right-2", zombieType + "-right-3"], framerate, true);
        zombie.animations.add("up", [zombieType + "-up-1", zombieType + "-up-2", zombieType + "-up-3"], framerate, true);
        zombie.animations.add("masked-down", ["00-down-1", "00-down-2", "00-down-3"], framerate, true);
        zombie.animations.add("masked-left", ["00-left-1", "00-left-2", "00-left-3"], framerate, true);
        zombie.animations.add("masked-right", ["00-right-1", "00-right-2", "00-right-3"], framerate, true);
        zombie.animations.add("masked-up", ["00-up-1", "00-up-2", "00-up-3"], framerate, true);


        zombie.play("down");
        
        let frameIndex = this.phaserGame.rnd.integerInRange(0,zombie.animations.currentAnim.frameTotal);



        zombie.animations.currentAnim.setFrame(frameIndex);

        this.gamegroup.add(zombie);
        return zombie;
    }

    public playSound(soundName: string) {
        this.soundeffect.volume = 0.5;

        this.soundeffect.play(soundName);
    }

    private clickListener() {
        let marker = this.marker,
            targetPoint: Phaser.Point = new Phaser.Point();

        targetPoint.x = marker.x;
        targetPoint.y = marker.y;

        this.click(targetPoint);
    }

    private overOffListener() {
        let marker = this.marker,
            targetPoint: Phaser.Point = new Phaser.Point();

        targetPoint.x = marker.x;
        targetPoint.y = marker.y;
        this.overOff(targetPoint);
    }
    private overListener() {
        let marker = this.marker,
            targetPoint: Phaser.Point = new Phaser.Point();

        targetPoint.x = marker.x;
        targetPoint.y = marker.y;

        this.over(targetPoint);
    }

    public setGlowPosition(position: Phaser.Point) {
        this.phaserGame.tweens.removeAll();
        this.glow.x = position.x;
        this.glow.y = position.y;

    }

    public moveGlowPosition(position: Phaser.Point) {
        let game = this.phaserGame;

        if (this.glowTween && this.glowTween.isRunning) {
            this.glowTween.stop();
        }

        this.glowTween = game.add.tween(this.glow).to({ x: position.x, y: position.y }, 100, Phaser.Easing.Linear.None, true);
        this.glowTween.onComplete.add(() => this.glowTween.stop(), this);
    }
    public moveTo(sprite: Phaser.Sprite, x: number, y: number, callback: () => void) {

        let game = this.phaserGame;

        if (this.tween && this.tween.isRunning) {
            this.tween.stop();
        }
        this.tween = game.add.tween(sprite).to({ x: x, y: y - 32 }, 100, Phaser.Easing.Linear.None, true);
        this.tween.onComplete.add(() => this.onComplete(sprite, callback), this);
    }

    public lookTo(sprite: Phaser.Sprite, animationLooking: string): void {
        sprite.play(animationLooking);
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

    public getPositionCover(position: Phaser.Point): number {
        let tile = this.getTileAtPosition(position);
        return tile && tile.properties.cover ? tile.properties.cover : 0;
    }
    public getPositionMask(position: Phaser.Point): boolean {
        let tile = this.getTileAtPosition(position);
        return tile && tile.properties.mask ? true : false;
    }

    private getTileAtPosition(position: Phaser.Point): Phaser.Tile {
        return this.map.getTileWorldXY(position.x, position.y, 16, 16, this.collisionLayer);
    }

    private overTimer: eventTimer = {
        key: '',
        time: -1,
        tick: false,
        wasOver: false
    }

    private setMarker() {
        let marker: Phaser.Sprite = this.marker,
            tilePointBelowPointer: Phaser.Point = this.pointToTilePosition(); // get tile coordinate below activePointer

        if (this.isPositionCollidable(tilePointBelowPointer)) {
            // do something if you want
        } else {
            marker.x = tilePointBelowPointer.x;
            marker.y = tilePointBelowPointer.y;
            let key = (marker.x / 32) + ':' + (marker.y / 32),
                timestamp = new Date().getTime();
            let duration = timestamp - this.overTimer.time;

            if (this.overTimer.key == key) {
                if (duration > 300) {
                    if (!this.overTimer.tick) {
                        this.overListener();
                        this.overTimer.tick = true;
                        this.overTimer.wasOver = true;
                        if (this.debug) {
                            this.text.destroy();
                            this.text = this.phaserGame.add.text(marker.x, marker.y, key, null);

                            this.text.font = 'Roboto';
                            this.text.fontSize = 12;
                        }
                    }
                } else {
                    this.text.destroy();
                    this.overTimer.tick = false;
                }
            } else {
                this.text.destroy();
                this.overTimer.key = key;
                this.overTimer.time = timestamp;
                this.overTimer.tick = false;
                if (this.overTimer.wasOver) {
                    this.overOffListener();
                    this.overTimer.wasOver = false;
                }
            }

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
    }

    update() {
        this.setMarker();
        this.updateCamera();
        this.handlerKeyBoard();


    }
}

interface eventTimer {
    key: string
    time: number
    tick: boolean
    wasOver: boolean
} 
