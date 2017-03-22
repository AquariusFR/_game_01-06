import { Spawnable } from 'app/phaser/spawnable'

export class Pool extends Phaser.Group {

    public sprites:Array<Phaser.Sprite>;

    constructor(game: Phaser.Game, private spriteType: typeof Spawnable, instances: number, name: string) {
        super(game, game.world, name, false, true, Phaser.Physics.ARCADE);
        this.initializePool(instances);
    }

    private initializePool(instances) {
        this.sprites = new Array();
        if (instances <= 0) {
            return;
        } // We don't need to add anything to the group
        for (var i = 0; i < instances; i++) {
            let sprite = this.add(new this.spriteType(this.game)); // Add new sprite
            sprite.poolId = i;
            this.sprites.push(sprite);
        }
    }

    public createNew(x, y, data) {
        let obj = this.getFirstDead(false);
        if (!obj) {
            obj = new this.spriteType(this.game);
            this.add(obj, true);
        }
        return obj.spawn(x, y, data);
    }
}