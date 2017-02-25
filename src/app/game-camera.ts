const pixelPanPerSecond: number = 512;
const zoomPerscond: number = 1;

export default class GameCamera {

  public zoom: number = 1;
  public targetZoom: number;
  public isZoomingIn: boolean;
  public x: number = 10;
  public y: number = 10;
  private targetX: number;
  private targetY: number;
  private targetXRight: boolean;
  private targetYDown: boolean;

  private targetSpeedX: number;
  private targetSpeedY: number;
  private lastUpdate: number;

  public constructor(private refresh: () => void) {

  }


  public zoomOut(): void {
    console.log('zoomOut');
    this.targetZoom = this.zoom - 0.25;

    if(this.targetZoom<.5){
      return;
    }

    this.isZoomingIn = false;
    this.showZoom();
  }
  public zoomReset(): void {
    console.log('zoomReset');
    this.targetZoom = 1;
    this.isZoomingIn = this.zoom<1;
    this.x = 10;
    this.y = 10;
    this.showZoom();
  }
  public zoomIn(): void {
    console.log('zoomIn');
    if(this.targetZoom>4){
      return;
    }
    this.targetZoom = this.zoom + 0.25;
    this.isZoomingIn = true;
    this.showZoom();
  }

  private showZoom() {
    console.log('zoom level', this.zoom);
    this.lastUpdate = Date.now();

    //this.isZoomingIn = this.targetZoom < this.zoom;

    window.requestAnimationFrame(c => this.zooming());
  }
  private zooming() {

    let durationSinceLastUpdate = Date.now() - this.lastUpdate;

    this.lastUpdate = Date.now();
    let zoomingFactor = zoomPerscond * durationSinceLastUpdate / 1000;

    this.zoom = this.isZoomingIn ? this.zoom + zoomingFactor : this.zoom - zoomingFactor;

    let zoomArrived = (this.isZoomingIn && this.zoom >= this.targetZoom) || (!this.isZoomingIn && this.zoom <= this.targetZoom);

    if (zoomArrived) {
      this.zoom = this.targetZoom;
    }
    console.log('zooming', 'time', durationSinceLastUpdate + 'ms', 'factor', zoomingFactor, 'zoom level', this.zoom);


    this.refresh();

    if (!zoomArrived) {
      window.requestAnimationFrame(c => this.zooming());
    }
  }

  public panLeft() {
    this.moveBy(-32 * 4, 0);
  }

  public panRight() {
    this.moveBy(32 * 4, 0);
  }

  public panUp() {
    this.moveBy(0, -32 * 4);
  }

  public panDown() {
    this.moveBy(0, 32 * 4);
  }

  private moveBy(deltaX: number, deltaY: number) {
    this.lastUpdate = Date.now();
    this.targetX = this.x + deltaX;
    this.targetY = this.y + deltaY;

    this.targetXRight = this.targetX > this.x;
    this.targetYDown = this.targetY > this.y;

    this.targetSpeedX = this.targetXRight ? 1 : -1;
    this.targetSpeedY = this.targetYDown ? 1 : -1;


    window.requestAnimationFrame(c => this.moving());

  }

  private moving() {

    let durationSinceLastUpdate = Date.now() - this.lastUpdate;
    this.lastUpdate = Date.now();
    let pixelToMove = Math.floor(pixelPanPerSecond * durationSinceLastUpdate / 1000);

    console.log('moving by', pixelToMove);

    let arrivedX = (this.targetXRight && this.x >= this.targetX) || (!this.targetXRight && this.x <= this.targetX);
    let arrivedY = (this.targetYDown && this.y >= this.targetY) || (!this.targetYDown && this.y <= this.targetY);

    this.x = arrivedX ? this.targetX : this.x + (this.targetSpeedX * pixelToMove);
    this.y = arrivedY ? this.targetY : this.y + (this.targetSpeedY * pixelToMove);

    console.log('coordinate', this.x, this.y);
    this.refresh();

    if (!arrivedX || !arrivedY) {
      setTimeout(() => this.moving(), 1);
    }
  }

}
