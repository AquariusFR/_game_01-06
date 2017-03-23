import { Entity, EntityType } from 'app/game/entity';
import { Engine } from 'app/phaser/engine';
import * as _ from 'lodash';
declare let Graph: any;
declare let astar: any;

const tilesize = 32;

export class GameMap {
    private entities: Array<Entity> = new Array();
    private grid: Array<Array<number>>;
    private size: MapSize;
    public squares: Map<string, Square> = new Map<string, Square>()
    private engine: Engine;
    constructor(private name: string) { }

    setEngine(engine: Engine) {
        this.engine = engine;
    }

    public setVisibileSquares(entity: Entity, force?: boolean) {
        if (!entity.updateAccessibleTiles && !force) {
            return;
        }
        console.time(entity.id + 'setVisibileSquares');
        let square = entity.square,
            x: number = square.x,
            y: number = square.y,
            perimetre: Array<Square> = this.getSquareInRange(x, y, entity.visionRange),
            visibleSquares: Array<Square> = new Array();

        perimetre.forEach(currentSquare => {
            let line = this.BresenhamLine(square, currentSquare),
                squareJustBefore = line.length > 2 ? line[1] : null;

            // si la case justeavant masque la case, on ne l'ajoute pas
            if (squareJustBefore && entity.coverDetection < squareJustBefore.cover) {
                return;
            }

            let canSeeSquare = line.reduce((canSee, currentSquare) => {
                // si l'entité ne peut pas voir au dela de l case, elle ne pourra pas voir plus loin
                if (currentSquare.cover === 100) {
                    return false;
                }


                return canSee;
            }, true);
            if (canSeeSquare) {
                visibleSquares.push(currentSquare);
            }
        });
        entity.visibleSquares = visibleSquares;
        console.timeEnd(entity.id + 'setVisibileSquares');
    }

    private getSquareInRange(xm, ym, r): Array<Square> {
        //console.time('getSquareInRange');
        /* bottom left to top right */
        let x = -r, y = 0, err = 2 - 2 * r,
            perimetre: Array<Square> = new Array(),
            squaresMap: Map<string, Square> = new Map(),
            squaresInRange: Array<Square> = new Array(),
            size = this.size,
            isBetween = this.isBetween,
            squares = this.squares;

        do {
            /*   I. Quadrant +x +y */
            addToSquares((xm - x), (ym + y));
            /*  II. Quadrant -x +y */
            addToSquares((xm - y), (ym - x));
            /* III. Quadrant -x -y */
            addToSquares((xm + x), (ym - y));
            /*  IV. Quadrant +x -y */
            addToSquares((xm + y), (ym + x));

            r = err;
            if (r <= y) {
                /* y step */
                err += ++y * 2 + 1;
            }
            if (r > x || err > y) {
                /* x step */
                err += ++x * 2 + 1;
            }
        } while (x < 0);

        squaresMap.forEach(s => squaresInRange.push(s));
        //console.timeEnd("getSquareInRange");
        return squaresInRange;

        function addToSquares(x, y) {
            let step = x

            if (x < xm) {
                for (step; step <= xm; step++) {
                    let key = step + ':' + y,
                        square = squares.get(key);
                    if (square) {
                        square.data.distanceFrom = step;
                        squaresMap.set(key, squares.get(key));
                    }
                }
            } else {
                for (step; step >= xm; step--) {
                    let key = step + ':' + y,
                        square = squares.get(key);

                    if (square) {
                        square.data.distanceFrom = step;
                        squaresMap.set(key, squares.get(key));
                    }
                }
            }
        }
    }



    // si derrière une case à 50% de cover il est invisible.
    // si il se trouve
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
                    tileCover: number = this.engine.getPositionCover(tilePosition);
                row.push(gridStatus);

                let key = columnIndex + ':' + rowIndex;
                if (!this.squares.has(key)) {
                    this.squares.set(key, {
                        entity: null,
                        x: columnIndex,
                        y: rowIndex,
                        cover: tileCover,
                        data: {}
                    })
                }
            });
            this.grid.push(row);
        })
        // this.easyStar.enableCornerCutting();
        //this.easyStar.enableDiagonals();
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
        entity.targetSquare = square;

        this.entities.push(entity)

        return square;
    }

    public setAccessibleTilesByEntity(entity: Entity, callback?: () => void) {
        if (!entity.updateAccessibleTiles) {
            callback();
            return;
        }
        //mapLastUpdate
        entity.mapLastUpdate = this.mapLastUpdate;
        let squareInRange: Array<Square> = this.getSquareInRange(entity.targetSquare.x, entity.targetSquare.y, entity.mouvementRange);

        this.getWalkableTiles(entity.targetSquare, squareInRange, entity.mouvementRange, pathes => {
            this.collecteAccessibleTiles(entity, pathes);
            if (callback) {
                callback();
            }
        });
    }

    private collecteAccessibleTiles(entity: Entity, pathes: Map<string, any[]>) {
        entity.pathMap = pathes;
    }

    public mapLastUpdate: number = new Date().getTime();

    public moveEntityFollowingPath(entity: Entity, path: Array<any>, callback: () => void, error: (e) => void): void {

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

                self.mapLastUpdate = new Date().getTime();

            } else {
                currentPositionIndex = currentPositionIndex + 1;
                console.log("moving to ", currentPosition.x + ':' + currentPosition.y, currentPathPoint);
                entity.move(currentPosition, () => move());


                self.engine.moveGlowPosition(currentPosition);
            }
        }

    }


    public canEntityGoToTarget(entity: Entity, targetPoint: Phaser.Point) {
        let targetSquare = this.getSquareAtPoint(targetPoint);
        return entity.pathMap.get(targetSquare.x + '_' + targetSquare.y) != null;
    }

    public moveEntityAtPoint(entity: Entity, targetPoint: Phaser.Point, callback: () => void, error: (e) => void): void {
        let sourceSquare = this.getSquareAtPoint(entity.position),
            targetSquare = this.getSquareAtPoint(targetPoint),
            grid = this.grid;


        let path = entity.pathMap.get(targetSquare.x + '_' + targetSquare.y);

        if (!path) {
            error('Path was not found.');
            return;
        }
        let currentPositionIndex = 0;

        let move = () => {
            let currentPathPoint = path[currentPositionIndex],
                currentPosition = this.getPointAtSquare(currentPathPoint.x, currentPathPoint.y),
                square = this.getSquareAtPoint(currentPosition);
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
                this.engine.moveGlowPosition(currentPosition);
            } else {
                currentPositionIndex = currentPositionIndex + 1;
                console.log("moving to ", currentPosition.x + ':' + currentPosition.y, currentPathPoint);
                entity.move(currentPosition, () => move());


                this.engine.moveGlowPosition(currentPosition);
            }
        }
        move();
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
                cover: 0,
                data: {}
            })
        }

        return this.squares.get(key);
    }

    private getPointKey(point: Phaser.Point): string {
        let squareX = Math.min(point.x / 32, this.size.width),
            squareY = Math.min(point.y / 32, this.size.width);
        return squareX + ':' + squareY;
    }
    private getCoordinatesKey(x: number, y: number): string {
        return x + '_' + y;
    }

    private getWalkableTiles(start: Square, squareInRange: Array<Square>, range: number, callback: (pathes: Map<string, Array<any>>) => void): void {

        ///  a faire, voir les cases qui sont directements accessibles, tracer les chemins pour les autres cas

        console.time('getWalkableTiles');

        let self = this,
            tilesCalculated = 0,
            tilesCalculatedFinish = 0,
            currentDistance: number = 999,
            currentGroupIndex = -1,
            grid = this.grid,
            filteredPathes = new Map<string, Array<any>>(),
            pathes = new Map<string, Array<any>>(),
            graph = new Graph(getFlippedGrid()),
            squaresGroupedByDistance: Array<Array<Square>>,
            processedGroupIndex;

        //for max range
        // search surrounding nodes

        squaresGroupedByDistance = squareInRange
            .sort((s1, s2) => s1.data.distanceFrom - s2.data.distanceFrom)
            .reverse()
            .reduce((groupedByDistance, currentSquare) => {
                if (currentSquare.data.distanceFrom != currentDistance) {
                    currentDistance = currentSquare.data.distanceFrom;
                    currentGroupIndex++;
                    groupedByDistance.push([]);
                }
                currentSquare.data.process = true;
                groupedByDistance[currentGroupIndex].push(currentSquare);
                return groupedByDistance;
            }
            , new Array<Array<Square>>());
        processedGroupIndex = 0;


        let startTile = graph.grid[start.x][start.y];

        console.time('astar.search');
        squaresGroupedByDistance.forEach(squares => {
            squares.forEach(currentSquare => {
                let endTile = graph.grid[currentSquare.x][currentSquare.y],
                    pathKey = this.getCoordinatesKey(currentSquare.x, currentSquare.y);

                if (pathes.has(pathKey)) {
                    return;
                }

                let rawPath: Array<GridNode> = astar.search(graph, startTile, endTile);

                //on déroule le chemin, et on remplis les chemin vers les cases
                if (_.isEmpty(rawPath) || rawPath.length > range) {
                    pathes.set(pathKey, null);
                    return;
                }
                let path = rawPath.map(p => { return { x: p.x, y: p.y } });
                let length = path.length;
                path.forEach((square, index) => {
                    let pathToSquare = _.dropRight(path, length - 1 - index);
                    pathes.set(this.getCoordinatesKey(square.x, square.y), pathToSquare);
                }
                );
            });
        });
        console.timeEnd('astar.search');
        pathes.forEach((pathTo, key) => {
            if (pathTo) {
                filteredPathes.set(key, pathTo);
            }
        }
        );

        console.timeEnd("getWalkableTiles");
        callback(filteredPathes);


        function getFlippedGrid() {

            let negativeCollisionGrid = _.range(50).map(x => _.range(50).map(y => -1));

            grid.map(
                (line, rowIndex) => {
                    line.forEach(
                        (tile, columnIndex) =>
                            negativeCollisionGrid[columnIndex][rowIndex] = tile > 0 ? 0 : 1
                    );
                }
            )
            return negativeCollisionGrid;
        }
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
    cover: number,
    data: any
}
interface GridNode {
    x: number
    y: number
}