import { Entity, EntityType } from 'app/game/entity';
import { EasyStar } from 'app/game/easystar';
import { Engine } from 'app/phaser/engine';
import * as _ from 'lodash';

const tilesize = 32;

export class GameMap {
    private grid: Array<Array<number>>;
    private easyStar: EasyStar;
    private size: MapSize;
    private squares: Map<string, Square> = new Map<string, Square>()
    private engine: Engine;
    constructor(private name: string ) { }

    setEngine(engine: Engine){
        this.engine = engine;
    }

    public preparePathCalculator() {
        let tileMap: Phaser.Tilemap = this.engine.map;
        this.size = {
            width: tileMap.width / 2,
            height: tileMap.height / 2
        }

        this.grid = new Array();
        _.times(this.size.height, rowIndex => {
            console.log(rowIndex);
            let row: Array<number> = new Array();
            _.times(this.size.width, columnIndex => {
                let tilePosition: Phaser.Point = this.getPointAtSquare(columnIndex, rowIndex),
                    gridStatus: number = this.engine.isPositionCollidable(tilePosition) ? 1 : 0;
                row.push(gridStatus);
            });
            this.grid.push(row);
        })

        this.easyStar = new EasyStar([0], this.grid);
        this.easyStar.enableCornerCutting();
    }

    private getPointKey(point: Phaser.Point): string {
        let squareX = Math.min(point.x / 32, this.size.width),
            squareY = Math.min(point.y / 32, this.size.width);
        return squareX + ':' + squareY;
    }

    public putEntityAtPoint(entity: Entity): Square {

        let position = new Phaser.Point;
        position.x =entity.position.x;
        position.y =entity.position.y + 32;
        let square = this.getSquareAtPoint(position);

        if (square.entity) {
            throw new Error("entity.already.here");
        }

        square.entity = entity;
        return square;
    }

    public moveEntityAtPoint(entity: Entity, targetPoint: Phaser.Point, callback: () => void, error:(e)=>void): void {
        let sourceSquare = this.getSquareAtPoint(entity.position),
            targetSquare = this.getSquareAtPoint(targetPoint),
            self = this,
            grid = this.grid;

        this.easyStar.findPath(sourceSquare.x, sourceSquare.y, targetSquare.x, targetSquare.y, function (path: Array<any>) {
            if (path === null) {
                error('Path was not found.');
                return;
            }
            let currentPositionIndex = 0;
            move();
            //add reference of an antity at this point for easyStar
            function move() {
                let currentPathPoint = path[currentPositionIndex],
                    currentPosition = self.getPointAtSquare(currentPathPoint.x, currentPathPoint.y);
                if (currentPositionIndex >= path.length-1) {
                    entity.move(currentPosition, ()=> {
                        entity.finishMoving();
                        sourceSquare.entity = null;
                        targetSquare.entity = entity;

                        let sourceInfo = grid[sourceSquare.y][sourceSquare.x];

                        if(sourceInfo === 0 || sourceInfo === 1){
                            grid[sourceSquare.y][sourceSquare.x] = 0;
                        } else if(sourceInfo > 9) {
                            grid[sourceSquare.y][sourceSquare.x] -= 10;
                        }

                        grid[targetSquare.y][targetSquare.x] += 10;
                        callback();
                    });
                    self.engine.moveGlowPosition(currentPosition);
                } else {
                    currentPositionIndex = currentPositionIndex + 1;
                    console.log("moving to ", currentPosition.x + ':' + currentPosition.y, currentPathPoint);
                    entity.move(currentPosition, () => move());
                    self.engine.moveGlowPosition(currentPosition);
                }
            }
        });
        this.easyStar.calculate();
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
                x: squareX,
                y: squareY
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