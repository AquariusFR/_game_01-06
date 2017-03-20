import { Entity, EntityType } from 'app/game/entity';
import { EasyStar } from 'app/game/easystar';
import { Engine } from 'app/phaser/engine';
import * as _ from 'lodash';

const tilesize = 32;

export class GameMap {
    private entities: Array<Entity> = new Array();
    private grid: Array<Array<number>>;
    private easyStar: EasyStar;
    private size: MapSize;
    private squares: Map<string, Square> = new Map<string, Square>()
    private engine: Engine;
    constructor(private name: string) { }

    setEngine(engine: Engine) {
        this.engine = engine;
    }

    public getVisibleEntitiedByEntity(entity: Entity): Array<Entity> {
        let square = entity.square,
            x: number = square.x,
            y: number = square.y,
            xMin = Math.max(x - entity.visionRange, 0),
            xMax = Math.min(x + entity.visionRange, this.size.width),
            yMin = Math.max(y - entity.visionRange, 0),
            yMax = Math.min(y + entity.visionRange, this.size.height),
            filter = (e: Entity) => {
                return this.isBetween(e.square.x, xMin, xMax) && this.isBetween(e.square.y, yMin, yMax);
            };

        let visibleEntities = this.entities.filter(filter).filter(e => this.isEntityCanSeeEntityB(entity, e));


        return visibleEntities;

    }

    private isBetween(value, min, max) {
        return min <= value && value <= max;
    }

    private isEntityCanSeeEntityB(a: Entity, b: Entity): boolean {
        let squares = this.BresenhamLine(a.square, b.square);

        return squares.reduce((canSee, currentSquare) => {
            
            // si l'entité ne peut pas voir au dela de al case, elle ne pourra pas voir plus loin
            if (a.coverDetection < currentSquare.cover) {
                return false;
            }
            return canSee;
        }, true);

    }

    // Returns the list of points from (x0, y0) to (x1, y1)
    private BresenhamLine(start: Square, end: Square): Array<Square> {
        let x0: number = start.x,
            y0: number = start.y,
            x1: number = end.x,
            y1: number = end.y,
            result: Array<Square> = new Array(),
            steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        // Optimization: it would be preferable to calculate in
        // advance the size of "result" and to use a fixed-size array
        // instead of a list.

        if (steep) {
            //Swap(ref x0, ref y0);
            x0 = start.y;
            y0 = start.x;
            //Swap(ref x1, ref y1);
            x1 = end.y;
            y1 = end.x;

        }
        if (x0 > x1) {
            //Swap(ref x0, ref x1);
            let tempX = x0;
            x0 = x1;
            x1 = tempX
            //Swap(ref y0, ref y1);
            let tempY = y0;
            y0 = y1;
            y1 = tempY;
        }

        let deltax: number = x1 - x0,
            deltay: number = Math.abs(y1 - y0),
            error: number = 0,
            ystep: number = y0 < y1 ? 1 : -1,
            y: number = y0;

        for (let x = x0; x <= x1; x++) {
            let point = new Phaser.Point();
            if (steep) {
                point.x = y;
                point.y = x;
            }
            else {
                point.x = x;
                point.y = y;
            }
            let key = point.x + ':' + point.y;

            result.push(this.squares.get(key));
            error += deltay;
            if (2 * error >= deltax) {
                y += ystep;
                error -= deltax;
            }
        }

        return result;
    }


    public preparePathCalculator() {
        let tileMap: Phaser.Tilemap = this.engine.map;
        this.size = {
            width: tileMap.width / 2,
            height: tileMap.height / 2
        }

        this.grid = new Array();
        _.times(this.size.height, rowIndex => {
            let row: Array<number> = new Array();
            _.times(this.size.width, columnIndex => {
                let tilePosition: Phaser.Point = this.getPointAtSquare(columnIndex, rowIndex),
                    gridStatus: number = this.engine.isPositionCollidable(tilePosition) ? 1 : 0,
                    tileCover:number = this.engine.getPositionCover(tilePosition);
                row.push(gridStatus);

                let key= columnIndex+ ':' +rowIndex;
                if (!this.squares.has(key)) {
                    this.squares.set(key, {
                        entity: null,
                        x: columnIndex,
                        y: rowIndex,
                        cover:tileCover
                    })
                }
            });
            this.grid.push(row);
        })

        this.easyStar = new EasyStar([0], this.grid);
        this.easyStar.enableCornerCutting();
        this.easyStar.enableDiagonals();
    }

    private getPointKey(point: Phaser.Point): string {
        let squareX = Math.min(point.x / 32, this.size.width),
            squareY = Math.min(point.y / 32, this.size.width);
        return squareX + ':' + squareY;
    }

    public putEntityAtPoint(entity: Entity): Square {

        let position = new Phaser.Point;
        position.x = entity.position.x;
        position.y = entity.position.y;
        let square = this.getSquareAtPoint(position);

        if (square.entity) {
            throw new Error("entity.already.here");
        }
        this.grid[square.y][square.x] += 10;

        square.entity = entity;
        entity.square = square;

        this.entities.push(entity)

        return square;
    }

    public showAccessibleTilesByEntity(entity: Entity, callback?:()=>void) {
        let position = new Phaser.Point;
        position.x = entity.position.x;
        position.y = entity.position.y;
        let sourceSquare = this.getSquareAtPoint(entity.position);
        this.easyStar.getTilesInRange(sourceSquare.x, sourceSquare.y, entity.mouvementRange, pathes => {
            this.collecteAccessibleTiles(entity, pathes);
            if(callback){
                callback();
            }
        });
    }

    private collecteAccessibleTiles(entity: Entity, pathes: Map<string, any[]>) {
        entity.pathes = pathes;
        let positions: Array<Phaser.Point> = new Array();
        pathes.forEach((path, key) => {

            let splittedKey = key.split('_'),
                squareX = Number(splittedKey[0]),
                squareY = Number(splittedKey[1]);
            positions.push(this.getPointAtSquare(squareX, squareY));
        });
        this.engine.addAccessibleTiles(positions);
    }


    public moveEntityFollowingPath(entity: Entity, path:Array<any>, callback: () => void, error: (e) => void): void {
    
        let self = this,
            grid = this.grid,
            sourceSquare = this.getSquareAtPoint(entity.position);
        
        if (path === null) {
            error('Path was not found.');
            return;
        }
        let currentPositionIndex = 0;
        move();
        function move() {
            let currentPathPoint = path[currentPositionIndex],
                currentPosition = self.getPointAtSquare(currentPathPoint.x, currentPathPoint.y);
                let square = self.getSquareAtPoint(currentPosition);
            entity.square = square;
            if (currentPositionIndex >= path.length - 1) {
                entity.move(currentPosition, () => {
                    let targetSquare = self.getSquareAtPoint(currentPosition);
                    entity.finishMoving();
                    sourceSquare.entity = null;
                    targetSquare.entity = entity;

                    let sourceInfo = grid[sourceSquare.y][sourceSquare.x];

                    if (sourceInfo === 0 || sourceInfo === 1) {
                        grid[sourceSquare.y][sourceSquare.x] = 0;
                    } else if (sourceInfo > 9) {
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

    }


    public moveEntityAtPoint(entity: Entity, targetPoint: Phaser.Point, callback: () => void, error: (e) => void): void {
        let sourceSquare = this.getSquareAtPoint(entity.position),
            targetSquare = this.getSquareAtPoint(targetPoint),
            self = this,
            grid = this.grid;


        let path = entity.pathes.get(targetSquare.x + '_' + targetSquare.y);

        if (path === null) {
            error('Path was not found.');
            return;
        }
        let currentPositionIndex = 0;



        move();
        function move() {
            let currentPathPoint = path[currentPositionIndex],
                currentPosition = self.getPointAtSquare(currentPathPoint.x, currentPathPoint.y),
                square = self.getSquareAtPoint(currentPosition);
                entity.square = square;
            if (currentPositionIndex >= path.length - 1) {
                entity.move(currentPosition, () => {
                    entity.finishMoving();
                    sourceSquare.entity = null;
                    targetSquare.entity = entity;

                    let sourceInfo = grid[sourceSquare.y][sourceSquare.x];

                    if (sourceInfo === 0 || sourceInfo === 1) {
                        grid[sourceSquare.y][sourceSquare.x] = 0;
                    } else if (sourceInfo > 9) {
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
                y: squareY,
                cover:0
            })
        }

        return this.squares.get(key);
    }
}

interface MapSize {
    width: number,
    height: number
}

export interface Square {
    x: number,
    y: number,
    entity: Entity,
    cover: number
}