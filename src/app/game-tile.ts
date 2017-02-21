import ImageToLoad from 'app/loader/image-to-load';

class GameTile {
    id:String;
    imageToLoad:ImageToLoad;

    constructor(id:String, src:string){
        this.id = id;


        this.imageToLoad = {
            name:id,
            url: src
        };
    }

    getId() :String{
        return this.id;
    }
}
export default GameTile;