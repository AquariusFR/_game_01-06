import { AfterContentInit, Component, ElementRef } from '@angular/core';
import { GameService } from 'app/loader/game.service'; 
import GameMap from 'app/game-map';
import GameSprites from 'app/game-sprites';
import { GameSprite } from 'app/game-sprite';
import GameTile from 'app/game-tile';
import GameCamera from 'app/game-camera';
import { Game } from 'app/phaser/game';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [ GameService ], 
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
  private camera: GameCamera;
  private map: GameMap;
  private sprites: GameSprites;
  private game: Game;

  public constructor(private elementRef: ElementRef, private gameService: GameService) { }

  public moveRight(): void {
    this.camera.panRight();
  }

  public moveLeft(): void {
    this.camera.panLeft();
  }
  public moveUp(): void {
    this.camera.panUp();
  }
  public moveDown(): void {
    this.camera.panDown();
  }
  public zoomIn(): void {
    this.camera.zoomIn();
  }
  public zoomReset(): void {
    this.camera.zoomReset();
  }
  public zoomOut(): void {
    this.camera.zoomOut();
  }

  public moveTo(): void {
  }

  public runLeft(): void {
    let player1: GameSprite = this.sprites.getSprite('player1');

    player1.moveBy(-100, 0);
  }
  public runRight(): void {

    let player1: GameSprite = this.sprites.getSprite('player1');

    player1.moveBy(100, 0);
  }
  public runUp(): void {
    let player1: GameSprite = this.sprites.getSprite('player1');

    player1.moveBy(0, -100);
  }
  public runDown(): void {
    let player1: GameSprite = this.sprites.getSprite('player1');

    player1.moveBy(0, 100);

  }
  public moveToCenter(): void {
    let player1: GameSprite = this.sprites.getSprite('player1');

    player1.moveTo(10, 10);
  }

  public shake(): void{
    this.game.shake();
  }

  public ngAfterContentInit() {
    /*let mapBackgroundCanvas: HTMLCanvasElement = this.getBackgroundCanvas();
    let mapSpritesCanvas: HTMLCanvasElement = this.getSpritesCanvas();
    this.camera = new GameCamera(() => this.refresh());
    this.map = new GameMap(mapBackgroundCanvas, this.camera);
    this.sprites = new GameSprites(mapSpritesCanvas, this.camera);*/
    this.game = new Game(this.gameService);
  }

  private refresh(): void {
    this.map.draw();
  }

  private getBackgroundCanvas(): HTMLCanvasElement {
    var canvasBackground: HTMLCanvasElement = this.elementRef.nativeElement.querySelector('.game__canvas__background');

    canvasBackground.width = 1280;
    canvasBackground.height = 720;

    return canvasBackground;
  }
  private getSpritesCanvas(): HTMLCanvasElement {
    var canvasSprites: HTMLCanvasElement = this.elementRef.nativeElement.querySelector('.game__canvas__sprites');

    canvasSprites.width = 1280;
    canvasSprites.height = 720;

    return canvasSprites;
  }

  private getMapCtx(mapCanvas: HTMLCanvasElement): CanvasRenderingContext2D {
    var ctx: CanvasRenderingContext2D = mapCanvas.getContext('2d');
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    return ctx;
  }
}



