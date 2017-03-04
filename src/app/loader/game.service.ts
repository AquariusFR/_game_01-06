import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class GameService {

    constructor(private http: Http) { }


    getMapJson(mapKey: string): Observable<MapResponse> {
        //assets/tiles/map00.json
        return this.http.get('assets/tiles/' + mapKey + '.json').map(response => this.buildMapResponse(mapKey, response));
    }

    private buildMapResponse(mapKey: string, response: Response): MapResponse {


        let json = response.json(),
            tilesets: Array<any> = json.tilesets,
            layers: Array<any> = json.layers;

        return {
            name: mapKey,
            data: response.json(),
            layers: layers,
            tilesetImages: tilesets.map(s => <Tileset>{
                url: 'assets/tiles/' + s.image,
                key: s.name
            })
        };
    }

    public LoadTileMap(mapResponse: MapResponse, game: Phaser.Game): void {
        game.load.tilemap(mapResponse.name, null, mapResponse.data, Phaser.Tilemap.TILED_JSON);

        mapResponse.tilesetImages.forEach(t => {
            game.load.image(t.key, t.url);
        });
    }

    public create(mapResponse: MapResponse, game: Phaser.Game): CreatedMap {
        let map: Phaser.Tilemap = game.add.tilemap(mapResponse.name);
        mapResponse.tilesetImages.forEach(t => {
            game.load.image(t.key, t.url);
            map.addTilesetImage(t.key, t.key);
        });

        let layers = new Map<string, Phaser.TilemapLayer>();
        mapResponse.layers.forEach(l => {
            let layer: Phaser.TilemapLayer = map.createLayer(l.name);
            layer.visible = l.opacity === 1;
            layers.set(l.name, layer);
        })
        return {
            map: map,
            layers: layers
        };
    }
}

export interface CreatedMap {
    map: Phaser.Tilemap,
    layers: Map<string, Phaser.TilemapLayer>
}

export interface MapResponse {
    name: string,
    data: JSON,
    layers: Array<Layer>
    tilesetImages: Array<Tileset>
}
interface Layer {
    name, string,
    opacity: number
}
interface Tileset {
    url: string,
    key: string
}