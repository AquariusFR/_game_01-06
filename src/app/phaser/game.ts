import { ScrollableArea } from 'app/phaser/phaser.scrollable';

export class Game {

    private horizontalScroll = true;
    private verticalScroll = true;
    private kineticMovement = true;
    private scroller;
    private phaserGame: Phaser.Game;
    private cursors: Phaser.CursorKeys;
    private placeholderSprite: Phaser.Sprite;
    private wasd: any;
    private speed = 300;


    constructor() {
        let self = this;

        this.phaserGame = new Phaser.Game(600 * window.devicePixelRatio, 400 * window.devicePixelRatio, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

        function preload() {
            self.preload();
        }
        function create() {
            self.create();
        }
        function update() {
            self.update();
        }
    }

    public shake() {
        this.phaserGame.camera.resetFX();
        this.phaserGame.camera.shake(0.004, 100, true, Phaser.Camera.SHAKE_BOTH, true);
        this.phaserGame.camera.flash(0xff0000, 50, false, 0.7);
    }

    preload() {

        this.phaserGame.load.image('map', 'assets/bigtile.png');
        this.phaserGame.load.image('placeholder', 'assets/placeholder_sprite.png');
        this.phaserGame.load.image("background", "assets/lightworld_large.gif");
    }

    private group: Phaser.Group;

    create() {
        var image = this.phaserGame.make.image(0, 0, "background");


        this.phaserGame.physics.startSystem(Phaser.Physics.ARCADE);
        this.cursors = this.phaserGame.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.phaserGame.input.keyboard.addKey(Phaser.Keyboard.Z),
            down: this.phaserGame.input.keyboard.addKey(Phaser.Keyboard.S),
            left: this.phaserGame.input.keyboard.addKey(Phaser.Keyboard.Q),
            right: this.phaserGame.input.keyboard.addKey(Phaser.Keyboard.D),

        };


        this.group = this.phaserGame.add.physicsGroup();

        this.scroller = this.phaserGame.add.existing(new ScrollableArea(this.phaserGame, 0, 0, this.phaserGame.width, this.phaserGame.height));

        this.scroller.addChild(image);
        this.placeholderSprite = this.phaserGame.add.sprite(this.phaserGame.world.centerX, this.phaserGame.world.centerY, 'placeholder');

        this.phaserGame.physics.enable(this.placeholderSprite, Phaser.Physics.ARCADE);
        this.placeholderSprite.body.collideWorldBounds = true;


        this.placeholderSprite.body.onCollide = new Phaser.Signal();
        this.placeholderSprite.body.onCollide.add(this.hitSprite, this.scroller);
        this.scroller.addChild(this.placeholderSprite);

        this.scroller.start();
    }

    moveTo(x, y) {
        var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create });
        function preload() { game.load.image('arrow', 'assets/sprites/arrow.png'); }
        var sprite; var tween; function create() {
            sprite = game.add.sprite(32, 32, 'arrow'); sprite.anchor.setTo(0.5, 0.5);
            game.input.onDown.add(moveSprite, this);
        }
        function moveSprite(pointer) {
            if (tween && tween.isRunning) {
                tween.stop();
            } sprite.rotation = game.physics.angleToPointer(sprite, pointer);
            //  300 = 300 pixels per second = the speed the sprite will move at, regardless of the distance it has to travel   
            var duration = (game.physics.distanceToPointer(sprite, pointer) / 300) * 1000;
            tween = game.add.tween(sprite).to({ x: pointer.x, y: pointer.y }, duration, Phaser.Easing.Linear.None, true);
        }
    }

    private now: number;
    private timestamp: number;
    private startX: number;
    private startY: number;


    hitSprite() {
        console.log('collision !!!');
    }

    update() {

        this.now = Date.now();
        var elapsed = this.now - this.timestamp;
        this.timestamp = this.now;
        if (this.phaserGame.physics.arcade.collide(this.placeholderSprite, this.scroller,this.hitSprite, this.hitSprite, this.phaserGame)) {
            console.log('boom');
        }
        if (false && this.placeholderSprite.body.velocity.x || this.placeholderSprite.body.velocity.y) {

            var coeffX = this.startX ? (this.timestamp - this.startX) * 150 / 1000 : 0;
            var coeffY = this.startY ? (this.timestamp - this.startY) * 150 / 1000 : 0;

            var velocityx = Math.abs(this.placeholderSprite.body.velocity.x) - coeffX;
            var velocityy = Math.abs(this.placeholderSprite.body.velocity.y) - coeffY;

            velocityx = velocityx < 10 ? 0 : velocityx;
            velocityy = velocityy < 10 ? 0 : velocityy;

            velocityx = this.placeholderSprite.body.velocity.x > 0 ? velocityx : -velocityx;
            velocityy = this.placeholderSprite.body.velocity.y > 0 ? velocityy : -velocityy;



            this.placeholderSprite.body.velocity.x = velocityx;
            this.placeholderSprite.body.velocity.y = velocityy;

            if (this.placeholderSprite.body.velocity.x = 0) {
                this.startX = 0;
            }
            if (this.placeholderSprite.body.velocity.y = 0) {
                this.startY = 0;
            }
        }

        let noDirectionPressedflag = true;

        if (this.wasd.left.isDown) {
            this.placeholderSprite.body.velocity.x = -this.speed;
            this.startX = Date.now();
            noDirectionPressedflag = false;
        }
        else if (this.wasd.right.isDown) {
            console.log('start', this.placeholderSprite.body.velocity.x);
            this.placeholderSprite.body.velocity.x = this.placeholderSprite.body.velocity.x < this.speed ? this.speed : this.placeholderSprite.body.velocity.x *1.05;
            console.log('end', this.placeholderSprite.body.velocity.x);
            this.startX = Date.now();
            noDirectionPressedflag = false;
            //// Define your actionsvar ACTIONS = {    LEFT: 1,    UP: 2,    RIGHT: 3,    DOWN: 4,    ATTACK: 5,    BASIC_ATTACK: 6,};// Define your keymap, as many keys per action as we wantvar defaultKeymap = {    [ACTION.LEFT]:  [Phaser.KeyCode.A, Phaser.KeyCode.LEFT],    [ACTION.UP]:    [Phaser.KeyCode.W, Phaser.KeyCode.UP],    [ACTION.RIGHT]: [Phaser.KeyCode.D, Phaser.KeyCode.RIGHT],    [ACTION.DOWN]:  [Phaser.KeyCode.S, Phaser.KeyCode.DOWN],    [ACTION.BASIC_ATTACK]: Phaser.KeyCode.CONTROL};// Create Keymap classvar Keymap = function( keyboard, defaultKeymap ) {    this.map = {};    var self = this;    _.forEach(defaultKeymap, function(KeyCode, action) {        self.map[action] = [];        if(_.isArray(KeyCode)) {            _.forEach(KeyCode, (code) => {                self.map[action].push(keyboard.addKey(code));            });        } else {            self.map[action].push(keyboard.addKey(KeyCode));        }    });};// isDown function for your actionKeymap.prototype.isDown = function(action) {    for(let i = 0, length = this.map[action].length; i < length; i++ ){        if(this.map[action][i].isDown) {            return true;        }    }    return false;};// Create the Keymapvar myMap = new Keymap(game.input.keyboard, defaultKeymap);// In your update function you can now useif( myMap.isDown(ACTION.LEFT) ) {    // do stuff}

        }

        if (this.wasd.up.isDown) {
            this.placeholderSprite.body.velocity.y = -this.speed;
            this.startY = Date.now();
            noDirectionPressedflag = false;
        }
        else if (this.wasd.down.isDown) {
            this.placeholderSprite.body.velocity.y = this.speed;
            this.startY = Date.now();
            noDirectionPressedflag = false;
        }

        if(noDirectionPressedflag){
            this.placeholderSprite.body.velocity.set(0);
        }
    }
}