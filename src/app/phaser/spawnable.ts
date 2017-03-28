
export class Spawnable extends Phaser.Sprite {

    data:Object

    constructor(game: Phaser.Game, x?: number, y?: number, texture?: string) {
        super(game, x, y, texture);
    }

    spawn(x: number, y: number, data?: any) {
        this.reset(x, y);
        this.data = data;
        this.exists = true;
        this.alive = true;
    }
}