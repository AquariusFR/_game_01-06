export class Bullet extends Phaser.Sprite {
    scaleSpeed: number;
    tracking: boolean;

    distance: number
    sx: number
    sy: number

    constructor(game: Phaser.Game, key: string) {
        super(game, 0, 0, key);
        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

        this.anchor.set(0.5);

        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        this.exists = false;
        this.visible = false;

        this.tracking = false;
        this.scaleSpeed = 0;
    }

    fire(x: number, y: number, angle: number, speed: number, gx: number, gy: number, distance: number) {
        gx = gx || 0;
        gy = gy || 0;

        this.reset(x, y);
        this.scale.set(1);
        this.distance = distance;

        this.sx = x
        this.sy = y

        this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

        this.angle = angle;

        this.body.gravity.set(gx, gy);
        this.exists = true;
        this.visible = true;
    }

    update() {
        if (!this.exists) {
            return
        }

        let dx = Math.abs(this.sx - this.x);
        let dy = Math.abs(this.sy - this.y);
        let currentDistance = (dx + dy)

        console.log('currentDistance', currentDistance)

        if (currentDistance >= this.distance) {
            this.exists = false;
            this.visible = false;
        }

        if (this.tracking) {
            this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
        }

        if (this.scaleSpeed > 0) {
            this.scale.x += this.scaleSpeed;
            this.scale.y += this.scaleSpeed;
        }
    }
}