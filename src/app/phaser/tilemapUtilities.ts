export class TilemapUtilities {


    mergeLayers(top:Phaser.TilemapLayer, bottomLayer:Phaser.TilemapLayer){
        top.canvas = bottomLayer.canvas;
    }

}