import { Entity, EntityType } from 'app/game/entity';

const tilesize = 32;

export class GameMap {
    private size: MapSize;
    private squares: Map<string, Square>

    constructor(private name: string, width: number, height: number) {
        this.size = {
            width: width,
            height: height
        }
        this.squares = new Map<string, Square>();
    }

    private getPointKey(point: Phaser.Point): string {
        let squareX = Math.min(point.x / 32, this.size.width),
            squareY = Math.min(point.y / 32, this.size.width);
        return squareX + ':' + squareY;
    }

    public putEntityAtPoint(entity: Entity): Square {
        let square = this.getSquareAtPoint(entity.position);

        if (square.entity) {
            throw new Error("entity.already.here");
        }

        square.entity = entity;
        return square;
    }

    public moveEntityAtPoint(entity: Entity, targetPoint: Phaser.Point, callback:()=> void): Square {
        let sourceSquare = this.getSquareAtPoint(entity.position),
            targetSquare = this.getSquareAtPoint(targetPoint);


        sourceSquare.entity = null;
        targetSquare.entity = entity;

        entity.move(targetPoint, callback);
        return targetSquare;
    }

    public getName(): string {
        return this.name;
    }
    public getSize(): MapSize {
        return this.size;
    }
    public getPointAtSquare(squareX: number, squareY: number): Phaser.Point {
        let point: Phaser.Point = new Phaser.Point();
        point.x = Math.min(squareX * 32, this.size.width * 32);
        point.y = Math.min(squareY * 32, this.size.width * 32);
        return point;
    }
    public getSquareAtPoint(point: Phaser.Point): Square {

        let key = this.getPointKey(point),
            squareX = Math.min(point.x / 32, this.size.width),
            squareY = Math.min(point.y / 32, this.size.width);

        if (!this.squares.has(key)) {
            this.squares.set(key, {
                entity: null,
                y: squareX,
                x: squareY
            })
        }

        return this.squares.get(key);
    }
}

interface MapSize {
    width: number,
    height: number
}

interface Square {
    x: number,
    y: number,
    entity: Entity
}