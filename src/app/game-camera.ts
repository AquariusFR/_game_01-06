const pixelPanPerSecond:number = 512;

export default class GameCamera {
  public zoom: number = 1;
  public x: number = 0;
  public y: number = 0;
  private targetX: number;
  private targetY: number;
  private targetXRight: boolean;
  private targetYDown: boolean;


  private moveSpeed: number = 3;
  private targetSpeedX: number = 3;
  private targetSpeedY: number = 3;
  private lastUpdate:number;

  public zoomOut(): void {
    console.log('zoomOut');
    this.zoom = this.zoom / 1.25;
    this.showZoom();
  }
  public zoomReset(): void {
    console.log('zoomReset');
    this.zoom = 1;
    this.x = 0;
    this.y = 0;
    this.showZoom();
  }
  public zoomIn(): void {
    console.log('zoomIn');
    this.zoom = this.zoom * 1.25;
    this.showZoom();
  }

  public moveBy(deltaX: number, deltaY: number, refresh: () => void) {
    this.lastUpdate= Date.now();
    this.targetX = this.x + deltaX;
    this.targetY = this.y + deltaY;

    this.targetXRight = this.targetX > this.x;
    this.targetYDown = this.targetY > this.y;

    this.targetSpeedX = this.targetXRight ? 1 : -1;
    this.targetSpeedY = this.targetYDown ? 1 : -1;


    window.requestAnimationFrame(c=>this.moving(refresh));

  }
  private moving(refresh: () => void) {

    let durationSinceLastUpdate = Date.now() - this.lastUpdate;
    this.lastUpdate= Date.now();
    let pixelToMove = Math.floor(pixelPanPerSecond * durationSinceLastUpdate / 1000);

    console.log('moving by', pixelToMove);

    let arrivedX = (this.targetXRight && this.x >= this.targetX) || (!this.targetXRight && this.x <= this.targetX);
    let arrivedY = (this.targetYDown && this.y >= this.targetY) || (!this.targetYDown && this.y <= this.targetY);

    this.x = arrivedX ? this.targetX : this.x + (this.targetSpeedX * pixelToMove);
    this.y = arrivedY ? this.targetY : this.y + (this.targetSpeedY * pixelToMove);

    console.log('coordinate', this.x, this.y);
    refresh();

    if(!arrivedX || !arrivedY ){
      setTimeout(() => this.moving(refresh), 1);
    }
  }

  private showZoom() {

    console.log('zoom level', this.zoom);
  }
}
