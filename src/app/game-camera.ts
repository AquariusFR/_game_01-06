const pixelPanPerSecond: number = 512;
const zoomPerscond: number = 1;
export default class GameCamera {

  public zoom: number = 1;
  public targetZoom: number;
  public isZoomOut: boolean;
  public x: number = 0;
  public y: number = 0;
  private targetX: number;
  private targetY: number;
  private targetXRight: boolean;
  private targetYDown: boolean;

  private targetSpeedX: number;
  private targetSpeedY: number;
  private lastUpdate: number;

  public zoomOut(refresh: () => void): void {
    console.log('zoomOut');
    this.targetZoom = this.zoom / 1.25;
    this.showZoom(refresh);
  }
  public zoomReset(refresh: () => void): void {
    console.log('zoomReset');
    this.targetZoom = 1;
    this.x = 0;
    this.y = 0;
    this.showZoom(refresh);
  }
  public zoomIn(refresh: () => void): void {
    console.log('zoomIn');
    this.targetZoom = this.zoom * 1.25;
    this.showZoom(refresh);
  }

  private showZoom(refresh: () => void) {
    console.log('zoom level', this.zoom);
    this.lastUpdate = Date.now();

    this.isZoomOut = this.targetZoom < this.zoom;

    window.requestAnimationFrame(c => this.zooming(refresh));
  }
  private zooming(refresh: () => void) {

    let durationSinceLastUpdate = Date.now() - this.lastUpdate;

    this.lastUpdate = Date.now();
    let zoomingFactor = zoomPerscond * durationSinceLastUpdate / 1000;

    this.zoom = this.isZoomOut ? this.zoom + zoomingFactor : this.zoom - zoomingFactor;

    let zoomArrived = (this.isZoomOut && this.zoom <= this.targetZoom);

    if(zoomArrived){
      this.zoom=this.targetZoom;
    }

    refresh();

    if (!zoomArrived) {
      window.requestAnimationFrame(c => this.zooming(refresh));
    }
  }

  public moveBy(deltaX: number, deltaY: number, refresh: () => void) {
    this.lastUpdate = Date.now();
    this.targetX = this.x + deltaX;
    this.targetY = this.y + deltaY;

    this.targetXRight = this.targetX > this.x;
    this.targetYDown = this.targetY > this.y;

    this.targetSpeedX = this.targetXRight ? 1 : -1;
    this.targetSpeedY = this.targetYDown ? 1 : -1;


    window.requestAnimationFrame(c => this.moving(refresh));

  }

  private moving(refresh: () => void) {

    let durationSinceLastUpdate = Date.now() - this.lastUpdate;
    this.lastUpdate = Date.now();
    let pixelToMove = Math.floor(pixelPanPerSecond * durationSinceLastUpdate / 1000);

    console.log('moving by', pixelToMove);

    let arrivedX = (this.targetXRight && this.x >= this.targetX) || (!this.targetXRight && this.x <= this.targetX);
    let arrivedY = (this.targetYDown && this.y >= this.targetY) || (!this.targetYDown && this.y <= this.targetY);

    this.x = arrivedX ? this.targetX : this.x + (this.targetSpeedX * pixelToMove);
    this.y = arrivedY ? this.targetY : this.y + (this.targetSpeedY * pixelToMove);

    console.log('coordinate', this.x, this.y);
    refresh();

    if (!arrivedX || !arrivedY) {
      setTimeout(() => this.moving(refresh), 1);
    }
  }

}
