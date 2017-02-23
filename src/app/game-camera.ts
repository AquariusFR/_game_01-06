export default class GameCamera {
    zoom:number = 1;



  zoomOut(): void {
    console.log('zoomOut');
    this.zoom = this.zoom /1.25;
    this.showZoom();
  }
  zoomReset(): void {
    console.log('zoomReset');
    this.zoom = 1;
    this.showZoom();
  }
  zoomIn(): void {
    console.log('zoomIn');
    this.zoom = this.zoom *1.25;
    this.showZoom();
  }

  private showZoom(){

    console.log('zoom level', this.zoom);
  }
}
