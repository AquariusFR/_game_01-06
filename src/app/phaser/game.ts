import { ScrollableArea } from 'app/phaser/phaser.scrollable';

export class Game {

    private horizontalScroll = true;
    private verticalScroll = true;
    private kineticMovement = true;
    private scroller;
    private phaserGame: Phaser.Game;

    constructor() {
        let self = this;

        this.phaserGame = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.AUTO, 'game', { preload: preload, create: create });



        function preload() {
            self.phaserGame.load.image('map', 'assets/bigtile.png');
            self.phaserGame.load.image("background", "assets/lightworld_large.gif");
        }
        function create() {
            self.scroller = self.phaserGame.add.existing(new ScrollableArea(self.phaserGame, 0, 0, self.phaserGame.width, self.phaserGame.height));
            
            var image = self.phaserGame.make.image(0, 0, "background");
            self.scroller.addChild(image);
            
            self.scroller.start();
        }
    }

    public shake() {
        this.phaserGame.camera.resetFX();
        this.phaserGame.camera.shake(0.004, 100, true, Phaser.Camera.SHAKE_BOTH, true);
        this.phaserGame.camera.flash(0xff0000, 50, false, 0.7);
    }
}