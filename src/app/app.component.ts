import { AfterContentInit, Component, ElementRef } from '@angular/core';
import { GameService } from 'app/loader/game.service';
import GameMap from 'app/game-map';
import GameSprites from 'app/game-sprites';
import { GameSprite } from 'app/game-sprite';
import GameTile from 'app/game-tile';
import GameCamera from 'app/game-camera';
import { Game } from 'app/game/game';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [GameService],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
  private game: Game;
  private camera: GameCamera;
  private map: GameMap;
  private sprites: GameSprites;

  public constructor(private elementRef: ElementRef, private gameService: GameService) { }


  public ngAfterContentInit() {
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



