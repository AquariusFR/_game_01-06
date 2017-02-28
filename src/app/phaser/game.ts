
export class Game  {
 
    game : Phaser.Game;

    constructor() {
 
        this.game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.AUTO, 'content', { preload: this.preload, create: this.create });
 
    }
 
    preload() {
        this.game.load.image('logo', 'assets/bigtile.png');
    }

    create() {
        var logo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 0.5);
    }
}