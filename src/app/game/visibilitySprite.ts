import { Spawnable } from 'app/phaser/spawnable'

export class VisibilitySprite extends Spawnable {

    constructor(game: Phaser.Game) {
        super(game, null, null, 'markers');
        this.animations.add("visible", ["marker/visible_tile"], 5, true);
        this.play("visible");
    }

    spawn(x: number, y: number, data: any){
        super.spawn(x, y, data);
    }
}