import * as _ from 'lodash';


export class LayerToSprites {


    public placeMapSprite(layer: Phaser.TilemapLayer, map: Phaser.Tilemap, tilemapJson: any, group: Phaser.Group, game: Phaser.Game) {
        let spriteData: any = _(tilemapJson.layers).find((l) => l.name == 'sprites'),
            spritesInfo = _(spriteData.data)
                .map((x, index) =>
                    x > 0 ? <tileInfo>{ index: index, id: x } : null
                )
                .filter(x => x).value();

        let tilewidth = map.tileWidth,
            tileheight = map.tileHeight,
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

            let tileset = _(map.tilesets).find(t => t.containsTileIndex(spriteInfo.id));
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

                if (currentspriteheight > spriteheight) {
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
                tileset = _(map.tilesets).find(t => t.containsTileIndex(spriteInfo.id));

            game.add.sprite(x, y, tileset.name, spriteInfo.id.toString(), group);
        });

        layer.renderable = false;
    }
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