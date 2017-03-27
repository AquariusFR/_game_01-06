export default class DelayedAnimation extends Phaser.Animation {
    _parent: any;
    _frameData: any;
    _frames: any;
    _frameIndex: number;
    isReversed: any;
    _timeLastFrame: number;
    _frameDiff: number;
    _frameSkip: number;
    _timeNextFrame: any;

    private timelineDelay:number

    static addToAnimations(animationManager: any, delay, name, frames, frameRate, loop, useNumericIndex?) {

        frames = frames || [];
        frameRate = frameRate || 60;

        if (loop === undefined) { loop = false; }

        //  If they didn't set the useNumericIndex then let's at least try and guess it
        if (useNumericIndex === undefined)
        {
            if (frames && typeof frames[0] === 'number')
            {
                useNumericIndex = true;
            }
            else
            {
                useNumericIndex = false;
            }
        }

        animationManager._outputFrames = [];

        animationManager._frameData.getFrameIndexes(frames, useNumericIndex, animationManager._outputFrames);

        let delayedAnimation = new DelayedAnimation(animationManager.game, animationManager.sprite, name, animationManager._frameData, animationManager._outputFrames, frameRate, loop);

        delayedAnimation.timelineDelay = delay;

        animationManager._anims[name] = delayedAnimation;



        animationManager.currentAnim = animationManager._anims[name];

        if (animationManager.sprite.tilingTexture)
        {
            animationManager.sprite.refreshTexture = true;
        }

        return animationManager._anims[name];

    }


    update(): boolean {





        if (this.isPaused)
        {
            return false;
        }

        if (this.isPlaying && this.game.time.time >= this._timeNextFrame)
        {
            this._frameSkip = 1;

            //  Lagging?
            this._frameDiff = this.game.time.time - this._timeNextFrame + this.timelineDelay;

            this._timeLastFrame = this.game.time.time;

            if (this._frameDiff > this.delay)
            {
                //  We need to skip a frame, work out how many
                this._frameSkip = Math.floor(this._frameDiff / this.delay);
                this._frameDiff -= (this._frameSkip * this.delay);
            }

            //  And what's left now?
            this._timeNextFrame = this.game.time.time + (this.delay - this._frameDiff);

            if (this.isReversed)
            {
                this._frameIndex -= this._frameSkip;
            }
            else
            {
                this._frameIndex += this._frameSkip;
            }

            if (!this.isReversed && this._frameIndex >= this._frames.length || this.isReversed && this._frameIndex <= -1)
            {
                if (this.loop)
                {
                    // Update current state before event callback
                    this._frameIndex = Math.abs(this._frameIndex) % this._frames.length;

                    if (this.isReversed)
                    {
                        this._frameIndex = this._frames.length - 1 - this._frameIndex;
                    }

                    this.currentFrame = this._frameData.getFrame(this._frames[this._frameIndex]);

                    //  Instead of calling updateCurrentFrame we do it here instead
                    if (this.currentFrame)
                    {
                        this._parent.setFrame(this.currentFrame);
                    }

                    this.loopCount++;
                    this._parent.events.onAnimationLoop$dispatch(this._parent, this);
                    this.onLoop.dispatch(this._parent, this);

                    if (this.onUpdate)
                    {
                        this.onUpdate.dispatch(this, this.currentFrame);

                        // False if the animation was destroyed from within a callback
                        return !!this._frameData;
                    }
                    else
                    {
                        return true;
                    }
                }
                else
                {
                    this.complete();
                    return false;
                }
            }
            else
            {
                return this.updateCurrentFrame(true);
            }
        }

        return false;
    }
}