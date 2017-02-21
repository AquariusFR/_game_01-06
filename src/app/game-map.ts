import * as _ from 'lodash';
import GameTile from 'app/game-tile';

export default class GameMap {
    canvas: CanvasRenderingContext2D;
    constructor(private tiles: Array<GameTile>) {
        _(tiles).each(printTile);
    }

    setCanvas(mapCanvas: CanvasRenderingContext2D) {
        this.canvas = mapCanvas;
    }

    draw() {
        console.log('drawing ..');
    }
}


function printTile(tile: GameTile) {
    console.log(tile.getId());
}
