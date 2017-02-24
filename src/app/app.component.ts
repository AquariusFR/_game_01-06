import { AfterContentInit, Component, ElementRef } from '@angular/core';
import GameMap from 'app/game-map';
import GameTile from 'app/game-tile';
import GameCamera from 'app/game-camera';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
  camera: GameCamera;
  map: GameMap;

  moveRight(): void {
    this.camera.moveBy(32 * 4, 0, () => this.refresh());
  }

  moveLeft(): void {
    this.camera.moveBy(-32 * 4, 0, () => this.refresh());
  }
  moveUp(): void {
    this.camera.moveBy(0, -32 * 4, () => this.refresh());
  }
  moveDown(): void {
    this.camera.moveBy(0, 800, () => this.refresh());
  }


  zoomIn(): void {
    this.camera.zoomIn(() => this.refresh());
  }
  zoomReset(): void {
    this.camera.zoomReset(() => this.refresh());
  }
  zoomOut(): void {
    this.camera.zoomOut(() => this.refresh());
  }

  private refresh(): void {
    this.map.draw();
  }

  constructor(private elementRef: ElementRef) {
  }

  public ngAfterContentInit() {
    let mapCanvas: HTMLCanvasElement = this.getCanvas();
    let tileA: GameTile = new GameTile('toto A', 'assets/bigtile.png');
    let tiles: Array<GameTile> = [tileA];
    this.camera = new GameCamera();
    this.map = new GameMap(tiles, mapCanvas, this.camera);
  }


  private getCanvas(): HTMLCanvasElement {
    var canvas: HTMLCanvasElement = this.elementRef.nativeElement.querySelector('canvas');
    canvas.className = 'game__canvas';
    canvas.width = 1280;
    canvas.height = 720;
    return canvas;
  }


  private getMapCtx(mapCanvas: HTMLCanvasElement): CanvasRenderingContext2D {
    var ctx: CanvasRenderingContext2D = mapCanvas.getContext('2d');
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    return ctx;
  }


  private fullscreen() {
    var el = document.getElementById('canvas');

    if (el.webkitRequestFullScreen) {
      el.webkitRequestFullScreen();
    }
  }
}



