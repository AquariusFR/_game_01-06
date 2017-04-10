import * as _ from 'lodash';


export class LayerToSprites {


    public placeMapSprite(layer: Phaser.TilemapLayer, map: Phaser.Tilemap, tilemapJson: any, group: Phaser.Group, game: Phaser.Game) {

        let tilewidth = map.tileWidth,
            tileheight = map.tileHeight,
            layerJson = this.findLayerJson('sprites', tilemapJson),
            layerData: Array<any>,
            collectedSprites: collectedSpriteFromLayer;

        if (!layerJson) {
            return; // no data found
        }

        collectedSprites = this.collectSpriteFromLayer(layerJson.data, map, tilewidth, tileheight);

        this.updateTextureAtlasCache(collectedSprites, game);
        this.addSpritesToGroup(collectedSprites, map, game, group);

        layer.renderable = false;
    }

    private addSpritesToGroup(collectedSprites: collectedSpriteFromLayer, map: Phaser.Tilemap, game: Phaser.Game, group: Phaser.Group) {
        _(collectedSprites.tileSprites).each(tileSprite => {

            let width = map.tileWidth,
                height = map.tileHeight,
                spriteInfo = tileSprite[0],
                row = Math.floor(spriteInfo.index / 100),
                column = spriteInfo.index % 100,
                x = Math.min(column * width, 100 * width),
                y = Math.min(row * height, 100 * height),
                tileset = _(map.tilesets).find(t => t.containsTileIndex(spriteInfo.id));

            game.add.sprite(x, y, tileset.name, spriteInfo.id.toString(), group);
        });
    }

    private updateTextureAtlasCache(collectedSprites: collectedSpriteFromLayer, game: Phaser.Game) {
        collectedSprites.tileSpriteFramesData.forEach((spriteFrameData, key) => {
            game.cache.addTextureAtlas(key, '', spriteFrameData.image, spriteFrameData, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        });
    }

    private collectSpriteFromLayer(layerData: Array<any>, map: Phaser.Tilemap, tilewidth: number, tileheight: number): collectedSpriteFromLayer {
        let processedTiles = new Map<number, boolean>(),
            tileSprites = new Array<Array<tileInfo>>(),
            tileSpriteFramesData = new Map<string, tileAtlas>();

        _(layerData)
            .each((id, index) => {

                let spriteInfo: tileInfo,
                    currentSpriteInfo: tileInfo,
                    tileset: Phaser.Tileset,
                    collectedLayerSprite: collectedSprite;

                if (id == 0 || processedTiles.get(index)) {
                    return;
                }
                spriteInfo = {
                    index: index,
                    id: id
                };


                tileset = _(map.tilesets).find(t => t.containsTileIndex(spriteInfo.id));
                currentSpriteInfo = spriteInfo;

                collectedLayerSprite = this.collectSprite(currentSpriteInfo, layerData, tileset, processedTiles);

                this.addSpriteToLayerAtlas(collectedLayerSprite, tileSpriteFramesData, tileSprites, tileset, tilewidth, tileheight);

            });
        return {
            tileSpriteFramesData: tileSpriteFramesData,
            tileSprites: tileSprites
        }
    }

    private findLayerJson(name: string, json: any) {
        return _(json.layers).find((l) => l.name == 'sprites');
    }

    private rightTileIsSameGroup = (tileset: Phaser.Tileset, spriteInfo: tileInfo, layerData: any) => {
        return layerData[spriteInfo.index + 1] == spriteInfo.id + 1
    }
    private bottomTileIsSameGroup = (tileset: Phaser.Tileset, spriteInfo: tileInfo, layerData: any) => {
        return layerData[spriteInfo.index + 100] == spriteInfo.id + tileset.columns
    }
    private collectSprite(spriteInfo: tileInfo, layerData: any, tileset: Phaser.Tileset, processedTiles: Map<number, boolean>): collectedSprite {
        let currentSpriteInfo = spriteInfo,
            currentLayerSprite = new Array<{ index: number, id: number }>(),
            continueReadingRight = true,
            continueReadingBottom = true,
            spritewidth = 0,
            spriteheight = 0;

        while (continueReadingRight) {

            spritewidth++;

            let bottomSpriteInfo: tileInfo = {
                index: currentSpriteInfo.index,
                id: layerData[currentSpriteInfo.index]
            };
            continueReadingBottom = this.bottomTileIsSameGroup(tileset, bottomSpriteInfo, layerData);

            let currentspriteheight = 0

            while (continueReadingBottom) {

                currentspriteheight++;
                currentLayerSprite.push(bottomSpriteInfo);

                processedTiles.set(bottomSpriteInfo.index, true);

                continueReadingBottom = this.bottomTileIsSameGroup(tileset, bottomSpriteInfo, layerData);
                bottomSpriteInfo = {
                    index: bottomSpriteInfo.index + 100,
                    id: layerData[bottomSpriteInfo.index + 100]
                }
            }

            if (currentspriteheight > spriteheight) {
                spriteheight = currentspriteheight
            }

            continueReadingRight = this.rightTileIsSameGroup(tileset, currentSpriteInfo, layerData);

            currentSpriteInfo = {
                index: currentSpriteInfo.index + 1,
                id: layerData[currentSpriteInfo.index + 1]
            };
        }
        return {
            layerSprite: currentLayerSprite,
            spriteheight: spriteheight,
            spritewidth: spritewidth
        };
    }
    private addSpriteToLayerAtlas(collectedLayerSprite: collectedSprite, tileSpriteFramesData: Map<string, tileAtlas>, tileSprites: Array<Array<tileInfo>>, tileset: Phaser.Tileset, tilewidth: number, tileheight: number) {

        let currentLayerSprite = collectedLayerSprite.layerSprite;

        if (currentLayerSprite.length) {
            let tilesetRaw: any = tileset,

                currentgid = currentLayerSprite[0].id - tileset.firstgid,
                tilex = tilesetRaw.drawCoords[currentgid * 2],
                tiley = tilesetRaw.drawCoords[1 + (currentgid * 2)],
                spritewidthPixel = collectedLayerSprite.spritewidth * tilewidth,
                spriteHeightPixel = collectedLayerSprite.spriteheight * tileheight,
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
interface tileAtlas {
    frames: Array<frameAtlas>,
    image: any
}
interface collectedSprite {
    layerSprite: Array<tileInfo>,
    spritewidth: number,
    spriteheight: number
}
interface collectedSpriteFromLayer {
    tileSprites: Array<Array<tileInfo>>,
    tileSpriteFramesData: Map<string, tileAtlas>
}
