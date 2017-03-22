
export class Spawnable extends Phaser.Sprite {

    constructor(game: Phaser.Game, x?: number, y?: number, texture?: string) {
        super(game, x, y, texture);
    }

    spawn(x: number, y: number, data: any) {
        this.stdReset(x,y);
    }

    stdReset(x, y) {
        this.reset(x, y);
        /*this.x = x;
        this.y = y;
        this.body.position.x = x;
        this.body.position.y = y;*/

        this.exists = true;
        this.alive = true;
    }
}