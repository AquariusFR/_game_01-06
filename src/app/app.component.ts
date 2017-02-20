import { AfterContentInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {
  title = 'app works!';

  constructor(private elementRef: ElementRef) { }
  ngAfterContentInit() {
    getCtx(this.elementRef);
  }
}

function getCtx(elementRef: ElementRef) {

  var canvas = elementRef.nativeElement.querySelector('canvas'),
    ctx = canvas.getContext('2d');
  canvas.className = 'game__canvas';
  canvas.width = document.body.clientWidth;
  canvas.height =  document.documentElement.clientHeight;
  //ctx.imageSmoothingEnabled = false; // future

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


