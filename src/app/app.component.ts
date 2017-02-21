import { AfterContentInit, Component, ElementRef } from '@angular/core';
import GameMap from 'app/game-map';
import GameTile from 'app/game-tile';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
  title = 'app works!';
  map:GameMap;


  constructor(private elementRef: ElementRef) {
    let tileA:GameTile = new GameTile('toto A', 'assets/bigtile.png');
    let tileB:GameTile = new GameTile('toto B', 'assets/city.png');
    let tiles:Array<GameTile> = [tileA, tileB];
    this.map = new GameMap(tiles);
   }

  ngAfterContentInit() {
    let mapCanvas: CanvasRenderingContext2D = getCtx(this.elementRef);
    this.map.setCanvas(mapCanvas);
    this.map.draw();
  }
}

function getCtx(elementRef: ElementRef): CanvasRenderingContext2D {

  var canvas: HTMLCanvasElement = elementRef.nativeElement.querySelector('canvas'),
    ctx: CanvasRenderingContext2D = canvas.getContext('2d');
  canvas.className = 'game__canvas';
  canvas.width = document.body.clientWidth;
  canvas.height = document.documentElement.clientHeight;
  ctx.mozImageSmoothingEnabled = true; // future

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.font = "12px Arial";
  ctx.fillText('finish', 10, 10);
  return ctx;
}

function fullscreen() {
  var el = document.getElementById('canvas');

  if (el.webkitRequestFullScreen) {
    el.webkitRequestFullScreen();
  }
}


