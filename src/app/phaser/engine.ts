import { Entity } from 'app/game/entity'
import { GameService, MapResponse, CreatedMap } from 'app/loader/game.service';
import { Observable } from 'rxjs/Observable';
import { Pool } from 'app/phaser/pool'
import { VisibilitySprite } from 'app/game/visibilitySprite'
import DelayedAnimation from 'app/phaser/delayedAnimation'
import { BitmapSprite } from 'app/game/bitmapSprite'
import { LayerToSprites} from 'app/phaser/layerToSprites'
import * as _ from 'lodash';

declare let SlickUI: any;

// http://rpgmaker.su-downloads/%D0%B4%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8F/238-pop-horror-city-character-pack-1-a
// https://forums.rpg-akerweb.com/index.php?threads/pop-freebies.45329/
// https://www.leshylabs.com/apps/sstool/

/*
#225378
#1695A3
#ACF0F2
#F3FFE2
#EB7F00
#DC3522
#D9CB9E
#374140
#2A2C2B
#1E1E20
 */
export class Engine {
    panelIsvisible: boolean;
    private currentPlayerName: any;
    private slickUI: any;
    private statushics: Phaser.Graphics;
    private namesJson: Array<any>;
    private visibleMarkerPool: Pool;
    private mapVisibleTileCount: Map<string, number> = new Map();
    private mapVisibleTile: Map<string, Phaser.Sprite> = new Map();
    private tileGroup: Phaser.Group;
    private ihmGroup: Phaser.Group;
    private rangegroup: Phaser.Group;
    private visiongroup: Phaser.Group;
    public gamegroup: Phaser.Group;
    private soundeffect: Phaser.Sound;
    private glowTween: Phaser.Tween;
    private glowPosition: Phaser.Point;
    private tileMap: Map<number, any>;
    private text: Phaser.Text;
    private xptext: Phaser.Text;
    private marker: Phaser.Sprite;
    private energyTank: Phaser.Sprite;
    private glow: Phaser.Sprite;
    private collisionLayer: Phaser.TilemapLayer;
    private horizontalScroll = true;
    private verticalScroll = true;
    private kineticMovement = true;
    private scroller;
    public phaserGame: Phaser.Game;
    private cursors: Phaser.CursorKeys;
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
    private debug: boolean = true;
    private layerToSprites:LayerToSprites = new LayerToSprites();

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

        this.phaserGame = new Phaser.Game((window.innerWidth / 2) * window.devicePixelRatio, (window.innerHeight / 2) * window.devicePixelRatio, Phaser.WEBGL, 'game', { preload: preload, create: create, update: update }, false, false);

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
        let game = this.phaserGame;
        Phaser.Canvas.setImageRenderingCrisp(this.phaserGame.canvas);
        //this.phaserGame.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        //this.phaserGame.scale.setUserScale(2, 2);
        game.load.atlas('sprites', 'assets/sprites/spriteatlas/sprites.png', 'assets/sprites/spriteatlas/sprites.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        game.load.atlas('heroes-sprites', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        game.load.json('heroes-sprites-atlas', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Heroes.json');
        game.load.json('Male-Zombies-Gore-atlas', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.json');
        game.load.atlas('Male-Zombies-Gore', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Male_Zombies_Gore.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        game.load.atlas('markers', 'assets/tiles/POPHorrorCity_GFX/Graphics/System/markers.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/System/markers.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        game.load.audio('boden', ['assets/sounds/essai.mp3']);
        game.load.audio('MechDrone1', ['assets/sounds/MechDrone1.mp3']);
        game.load.audio('soundeffect', ['assets/sounds/soundeffect_game.ogg']);
        game.load.atlas('candle-glow', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Objects/Candle_Glow.png', 'assets/tiles/POPHorrorCity_GFX/Graphics/Characters/Objects/Candle_Glow.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        game.load.image('bullet8', 'assets/sprites/bullet8.png');
        game.load.image('bullet6', 'assets/sprites/bullet6.png');
        game.load.image('menu-button', 'assets/ui/menu.png');
        game.load.atlas('energy-tank', 'assets/energy-tank_spritesheet.png', 'assets/energy-tank_spritesheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);
        game.load.json('names', 'assets/names.json');

        game.load.json('tileset', 'assets/tiles/' + mapResponse.name + '.json');
        //game.load.spritesheet("tilesetname", "tileset_path", tilewidth, tileheight, frameMax)


        this.gameService.LoadTileMap(mapResponse, this.phaserGame);
        let javascriptedPlugins: any = Phaser.Plugin;

        // You can use your own methods of making the plugin publicly available. Setting it as a global variable is the easiest solution.
        this.slickUI = this.phaserGame.plugins.add(javascriptedPlugins.SlickUI);
        this.slickUI.load('assets/ui/kenney/kenney.json'); // Use the path to your kenney.json. This is the file that defines your theme.

        // test
    }


    create(mapResponse: MapResponse) {
        let game: Phaser.Game = this.phaserGame;
        let MechDrone1 = game.add.audio('MechDrone1', 1, true);
        let soundeffect = game.add.audio('soundeffect', 0.1, true);
        this.namesJson = this.phaserGame.cache.getJSON('names');

        // il faut ordonnancer les groups par ordre d'apparition
        this.tileGroup = game.add.group();
        this.rangegroup = game.add.group();
        this.visiongroup = game.add.group();
        this.gamegroup = game.add.group();
        this.ihmGroup = game.add.group();

        MechDrone1.play();
        MechDrone1.volume = 0.5;
        soundeffect.volume = 0;

        //à enlever
        game.camera.setPosition(32, 32);

        soundeffect.allowMultiple = true;
        soundeffect.addMarker('shotgun', 1.130, 0.985);
        soundeffect.addMarker('gun', 0.575, 0.550);
        soundeffect.addMarker('grunt', 0, 0.570);
        this.soundeffect = soundeffect;

        game.physics.startSystem(Phaser.Physics.ARCADE);


        let map: CreatedMap = this.gameService.createFromJson(game, this.tileGroup);


        let collisionLayer = map.layers.get('collisions');
        this.map = map.map;
        this.tileMap = map.tileMap;

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
        this.marker.animations.add("blink", ["marker/blink1", "marker/blink2"], 5, true);
        this.marker.play("blink");
        game.physics.enable(this.marker, Phaser.Physics.ARCADE);


        this.glow = game.add.sprite(-100, -100, 'markers');
        this.glow.animations.add("glow", ["marker/active_entity"], 5, true);
        this.glow.play("glow");
        game.physics.enable(this.glow, Phaser.Physics.ARCADE);


        let lastLayer = map.layers.get('example sprite');
        lastLayer.inputEnabled = true;
        lastLayer.events.onInputDown.add(this.clickListener, this);

        if (this.debug) {
            this.text = this.phaserGame.add.text(-100, -100, '', null);
        }

        this.energyTank = new Phaser.Sprite(game, -100, -100, 'energy-tank');

        this.energyTank.visible = false;

        this.visiongroup.add(this.glow);
        this.ihmGroup.add(this.marker);
        this.ihmGroup.add(this.energyTank);
        //this.gamegroup.scale.x = 2;
        //this.gamegroup.scale.y = 2;
        this.placeMapSprite(map);
        this.createMenu();
        this.o.next('ok');

        game.input.addMoveCallback(this.setMarker, this);
    }

    placeMapSprite(map: CreatedMap) {

        let game = this.phaserGame,
            layer: any = map.layers.get('sprites');

        this.layerToSprites.placeMapSprite(layer, map.map, map.json, this.gamegroup, game);
/*
        let game = this.phaserGame,
            layer: any = map.layers.get('sprites'),
            spriteData: any = _(map.json.layers).find((l) => l.name == 'sprites'),
            spritesInfo = _(spriteData.data)
                .map((x, index) =>
                    x > 0 ? <tileInfo>{ index: index, id: x } : null
                )
                .filter(x => x).value();

        this.layerToSprites.placeMapSprite(layer, map.map, this.gamegroup, game);
        let tilewidth = map.map.tileWidth,
            tileheight = map.map.tileHeight,
            w = layer.width,
            h = layer.height,
            tileSprites = new Array<Array<tileInfo>>();
        let rightTileIsSameGroup = (tileset: Phaser.Tileset, spriteInfo: {
            index: any;
            id: any;
        }) => {
            return spriteData.data[spriteInfo.index + 1] == spriteInfo.id + 1
        }
        let bottomTileIsSameGroup = (tileset: Phaser.Tileset, spriteInfo: {
            index: any;
            id: any;
        }) => {
            return spriteData.data[spriteInfo.index + 100] == spriteInfo.id + tileset.columns
        }

        let processedTiles = {},
            tileSpriteFramesData = new Map<string, {
                'frames': Array<frameAtlas>,
                'image': any
            }>();

        for (var index = 0; index < spriteData.data.length; index++) {

            let id = spriteData.data[index];

            if (id == 0 || processedTiles[index]) {
                continue;
            }
            let spriteInfo = {
                index: index,
                id: id
            }

            // layerSprites
            let row = Math.floor(spriteInfo.index / 100),
                column = spriteInfo.index % 100;

            let currentLayerSprite = new Array<{ index: number, id: number }>();

            //currentLayerSprite.push(spriteInfo);

            //checkIfTilesAround
            let tilesRightId = spriteInfo.index,
                tilesBottomId = spriteInfo.index;

            let tileset = _(map.map.tilesets).find(t => t.containsTileIndex(spriteInfo.id));
            let currentSpriteInfo = spriteInfo;

            //currentLayerSprite.push(currentSpriteInfo);

            let continueReadingRight = true,
                continueReadingBottom = true,
                spritewidth = 0,
                spriteheight = 0;

            while (continueReadingRight) {

                spritewidth++;

                let bottomSpriteInfo = {
                    index: currentSpriteInfo.index,
                    id: spriteData.data[currentSpriteInfo.index]
                };
                continueReadingBottom = bottomTileIsSameGroup(tileset, bottomSpriteInfo);

                let currentspriteheight = 0

                while (continueReadingBottom) {

                    currentspriteheight++;
                    currentLayerSprite.push(bottomSpriteInfo);

                    processedTiles[bottomSpriteInfo.index] = true;

                    continueReadingBottom = bottomTileIsSameGroup(tileset, bottomSpriteInfo);
                    bottomSpriteInfo = {
                        index: bottomSpriteInfo.index + 100,
                        id: spriteData.data[bottomSpriteInfo.index + 100]
                    }
                }

                if(currentspriteheight>spriteheight){
                    spriteheight = currentspriteheight
                }

                continueReadingRight = rightTileIsSameGroup(tileset, currentSpriteInfo);

                currentSpriteInfo = {
                    index: currentSpriteInfo.index + 1,
                    id: spriteData.data[currentSpriteInfo.index + 1]
                };
            }


            if (currentLayerSprite.length) {
                let tilesetRaw: any = tileset,
                
                    currentgid = currentLayerSprite[0].id - tileset.firstgid,
                    tilex = tilesetRaw.drawCoords[currentgid * 2],
                    tiley = tilesetRaw.drawCoords[1 + (currentgid * 2)],
                    spritewidthPixel = spritewidth * tilewidth,
                    spriteHeightPixel = spriteheight * tileheight,
                    spriteFrameAtlas: frameAtlas = {

                        filename: currentLayerSprite[0].id.toString(),
                        frame: {
                            x: tilex,
                            y: tiley,
                            w: spritewidthPixel,
                            h: spriteHeightPixel
                        },
                        rotated: false,
                        trimmed: false,
                        spriteSourceSize: {
                            x: tilex,
                            y: tiley,
                            w: spritewidthPixel,
                            h: spriteHeightPixel
                        },
                        sourceSize: {
                            w: spritewidthPixel,
                            h: spriteHeightPixel
                        }
                    }

                if (!tileSpriteFramesData.has(tileset.name)) {

                    let newFrameAtlas = {
                        frames: new Array<frameAtlas>(),
                        image: tileset.image
                    };

                    tileSpriteFramesData.set(tileset.name, newFrameAtlas);
                }


                tileSpriteFramesData
                    .get(tileset.name)
                    .frames.push(spriteFrameAtlas);

                tileSprites.push(currentLayerSprite);
            }
        }

        tileSpriteFramesData.forEach((spriteFrameData, key) => {
            game.cache.addTextureAtlas(key, '', spriteFrameData.image, spriteFrameData, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        });

        _(tileSprites).each(tileSprite => {

            let width = tilewidth,
                height = tileheight, spriteInfo = tileSprite[0],
                row = Math.floor(spriteInfo.index / 100),
                column = spriteInfo.index % 100,
                x = Math.min(column * width, 100 * width),
                y = Math.min(row * height, 100 * height),
                tileset = _(map.map.tilesets).find(t => t.containsTileIndex(spriteInfo.id));
            
            game.add.sprite(x, y, tileset.name, spriteInfo.id.toString(), this.gamegroup);
        });

        layer.renderable = false;
        */
    }

    setActivePlayer(entity: Entity) {
        this.currentPlayerName.value = entity.name;
    }

    createMenu(): Engine {
        let game = this.phaserGame,
            slickUI = this.slickUI,
            panelVisiblePosition = 8,
            panelWidth = game.width - 8,
            openButtonWidth = 50,
            panelHiddenPosition = openButtonWidth - game.width,
            panel = new SlickUI.Element.Panel(panelHiddenPosition, game.height - 72, panelWidth, 64),
            closeButton = new SlickUI.Element.Button(panelWidth - openButtonWidth, 0, openButtonWidth, 80),
            openButton = new SlickUI.Element.Button(panelWidth - openButtonWidth, 0, openButtonWidth, 80),
            currentPlayerName = new SlickUI.Element.Text(10, 0, "BoyGeorge"),
            button = new SlickUI.Element.Button(390, 0, 140, 80);

        this.panelIsvisible = false;

        slickUI.add(panel);
        panel.add(openButton);
        panel.add(closeButton);
        panel.add(button);
        panel.add(currentPlayerName).centerVertically().text.alpha = 0.5;

        this.currentPlayerName = currentPlayerName;

        closeButton.add(new SlickUI.Element.Text(0, 0, "<<")).center();
        closeButton.visible = false;
        openButton.add(new SlickUI.Element.Text(0, 0, ">>")).center();

        closeButton.events.onInputUp.add(() => { console.log('Clicked button'); });
        button.events.onInputUp.add(() => { console.log('Clicked button'); });

        button.add(new SlickUI.Element.Text(0, 0, "My button")).center();
        openButton.events.onInputDown.add(() => {
            if (this.panelIsvisible) {
                return;
            }
            this.panelIsvisible = true;
            panel.x = panelHiddenPosition;
            openButton.visible = false;
            closeButton.visible = true;
            game.add.tween(panel).to({ x: panelVisiblePosition }, 500, Phaser.Easing.Exponential.Out, true).onComplete.add(() => {
            });
            slickUI.container.displayGroup.bringToTop(panel.container.displayGroup);
        }, this);
        closeButton.events.onInputUp.add(() => {
            game.add.tween(panel).to({ x: panelHiddenPosition + 20 }, 500, Phaser.Easing.Exponential.Out, true).onComplete.add(() => {
                panel.x = panelHiddenPosition;
            });
            this.panelIsvisible = false;
            openButton.visible = true;
            closeButton.visible = false;
        });

        return this;
    }

    pickName(): string {
        let rndIndex = this.phaserGame.rnd.integerInRange(0, this.namesJson.length - 1);
        return this.namesJson[rndIndex].name;
    }

    public hideEntityStatus() {
        this.energyTank.visible = false;
    }

    public drawEntityStatus(entity: Entity, lifeStart?: number, lifeTarget?: number) {
        /*        this.statushics = this.phaserGame.add.Graphics(0, 0);
                this.statushics.beginFill(0xFFFF00, 1);
                this.statushics.lineStyle(10, 0xe91010, 1);
                //this.statushics.bounds = new PIXI.Rectangle(0, 0, 200, 200);
                this.statushics.drawRect(0, 0, 200, 200);
        */

        this.energyTank.x = entity.position.x + 10;
        this.energyTank.y = entity.position.y + 30;

        if (lifeStart && lifeTarget) {

            this.energyTank.animations.add('now');

            this.energyTank.animations.add("demo", [
                "energy0",
                "energy1",
                "energy2",
                "energy3",
                "energy4",
                "energy5",
                "energy6",
                "energy7",
                "energy8",
                "energy9",
                "energy10",
                "energy11",
                "energy12",
                "energy13",
                "energy14",
                "energy15",
                "energy16",
                "energy17",
                "energy18"
            ], 5, true);
            this.energyTank.play("demo");
        }
        else {

            // on cherche a afficher la frame correspondant au niveau de vie
            let maxPV = entity.maxPv,
                currentPV = entity.pv,
                pvPercentage = (100 * currentPV) / maxPV,
                frame = Math.floor((this.energyTank.animations.frameTotal - 1) * pvPercentage / 100);
            this.energyTank.frame = frame;
        }

        this.energyTank.visible = true;
    }
    public focusOnEntity(entity: Entity): Engine {
        this.phaserGame.camera.focusOn(entity.sprite);
        return this;
    }
    public followEntity(entity: Entity): Engine {
        this.phaserGame.camera.follow(entity.sprite, 0.1, 0.1);
        return this;
    }
    public unfollowEntity(): Engine {
        this.phaserGame.camera.unfollow();
        return this;
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
        });
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
        DelayedAnimation.addToAnimations(zombie.animations, delay, "left", [zombieType + "-left-1", zombieType + "-left-2", zombieType + "-left-3"], framerate, true);
        DelayedAnimation.addToAnimations(zombie.animations, delay, "right", [zombieType + "-right-1", zombieType + "-right-2", zombieType + "-right-3"], framerate, true);
        DelayedAnimation.addToAnimations(zombie.animations, delay, "up", [zombieType + "-up-1", zombieType + "-up-2", zombieType + "-up-3"], framerate, true);
        DelayedAnimation.addToAnimations(zombie.animations, delay, "masked-down", ["00-down-1", "00-down-2", "00-down-3"], framerate, true);
        DelayedAnimation.addToAnimations(zombie.animations, delay, "masked-left", ["00-left-1", "00-left-2", "00-left-3"], framerate, true);
        DelayedAnimation.addToAnimations(zombie.animations, delay, "masked-right", ["00-right-1", "00-right-2", "00-right-3"], framerate, true);
        DelayedAnimation.addToAnimations(zombie.animations, delay, "masked-up", ["00-up-1", "00-up-2", "00-up-3"], framerate, true);

        zombie.play("down");

        let frameIndex = this.phaserGame.rnd.integerInRange(0, zombie.animations.currentAnim.frameTotal);

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

    public addGroup(groupName) {
        return this.phaserGame.add.group(this.phaserGame.world, groupName, false, true, Phaser.Physics.ARCADE);
    }


    private isOverMenu(activePointer: Phaser.Pointer): boolean {

        let game = this.phaserGame;

        if (this.panelIsvisible) {
            return activePointer.y > game.height - 72;
        }

        return activePointer.y > game.height - 72 && activePointer.x < 50;

    }

    private updateCamera() {
        let game = this.phaserGame,
            camera = game.camera,
            activePointer = game.input.activePointer,
            cameraPosition = camera.position,
            livezone = 32,
            cameraStep = 16;


        if (this.isOverMenu(activePointer)) {
            return;
        }

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

        if (this.isOverMenu(this.phaserGame.input.activePointer)) {
            return;
        }

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

    public showText(x: number, y: number, text: string) {
        if (this.xptext) {
            this.xptext.destroy();
        }
        this.xptext = this.phaserGame.add.text(x, y, text, null);
        this.xptext.font = 'Roboto';
        this.xptext.fontSize = 12;
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
        this.updateCamera();
        this.handlerKeyBoard();
        this.gamegroup.sort('y', Phaser.Group.SORT_ASCENDING);
        //this.gamegroup.children.forEach(sprite => this.phaserGame.debug.spriteBounds(sprite))
    }
}

interface eventTimer {
    key: string
    time: number
    tick: boolean
    wasOver: boolean
}
interface tileInfo {
    index: number,
    id: number
}
interface frameAtlas {
    filename: string,
    frame: {
        x: number,
        y: number,
        w: number,
        h: number
    },
    rotated: false,
    trimmed: false,
    spriteSourceSize: {
        x: number,
        y: number,
        w: number,
        h: number
    },
    sourceSize: {
        w: number,
        h: number
    }
}