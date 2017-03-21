/**
*   EasyStar.ts
*   github.com/prettymuchbryce/EasyStarJS
*   github.com/AquariusFR/easystarjs
*   Licensed under the MIT license.
*
*   Original Implementation By Bryce Neal (@prettymuchbryce)
*   to TypeScript By Fred Nobre (@AquariusFR)
**/
import * as _ from 'lodash';
import { Square } from 'app/game/map'

declare var Heap: any;

const STRAIGHT_COST: number = 1.0;
const DIAGONAL_COST: number = 1.4;
const CLOSED_LIST = 0;
const OPEN_LIST = 1;
const EasyStar_TOP = 'TOP'
const EasyStar_TOP_RIGHT = 'TOP_RIGHT'
const EasyStar_RIGHT = 'RIGHT'
const EasyStar_BOTTOM_RIGHT = 'BOTTOM_RIGHT'
const EasyStar_BOTTOM = 'BOTTOM'
const EasyStar_BOTTOM_LEFT = 'BOTTOM_LEFT'
const EasyStar_LEFT = 'LEFT'
const EasyStar_TOP_LEFT = 'TOP_LEFT'


export class EasyStar {

    private syncEnabled = false;
    private pointsToAvoid: Map<string, number> = new Map();
    private collisionGrid: Array<Array<number>>;
    private costMap: Map<number, number> = new Map();
    private pointsToCost: Map<string, number> = new Map();
    private directionalConditions: Map<string, Array<string>> = new Map();
    private allowCornerCutting = true;
    private iterationsSoFar: number;
    private instances: Array<Instance> = [];
    private iterationsPerCalculation: number = Number.MAX_VALUE;
    private diagonalsEnabled = false;

    constructor(private acceptableTiles: Array<number>, collisionGrid: Array<Array<number>>) {

        // No grid was set
        if (collisionGrid === undefined) {
            throw new Error("You can't set a path without first calling setGrid() on EasyStar.");
        }
        this.setGrid(collisionGrid);
        // TODO add in constructor
        // No acceptable tiles were set
        if (this.acceptableTiles === undefined) {
            throw new Error("You can't set a path without first calling setAcceptableTiles() on EasyStar.");
        }
    }


    public filterAccessibleTiles(start: Square, squareInRange: Array<Square>, range: number, callback: (pathes: Map<string, Array<any>>) => void): void {

        console.time('getTilesInRange');

        let self = this;
        let tilesCalculated = 0;
        let tilesCalculatedFinish = 0;

        let pathes = new Map<string, Array<any>>();

        //for max range
        // search surrounding nodes
        squareInRange.forEach(currentSquare => {
            tilesCalculated++;
            this.findPath(start.x, start.y, currentSquare.x, currentSquare.y, (path) => collectPath(currentSquare.x, currentSquare.y, path), range);
            self.calculate();
        })



        self.calculate();
        function collectPath(x, y, path) {
            tilesCalculatedFinish++;
            if (path) {
                pathes.set(self.getPointsKey(x, y), path);
            }
            if (tilesCalculated === tilesCalculatedFinish) {

                console.timeEnd("getTilesInRange");
                callback(pathes);
            }
        }
    }

    private cleanX(x: number) {
        if (x < 0 || x > this.collisionGrid[0].length - 1) {
            return -1;
        }
        return x;
    }
    private cleanY(y: number) {
        if (y < 0 || y > this.collisionGrid.length - 1) {
            return -1;
        }
        return y;
    }

    /**
     * Enables sync mode for this EasyStar instance..
     * if you're into that sort of thing.
     **/
    public enableSync() {
        this.syncEnabled = true;
    };

    /**
    * Disables sync mode for this EasyStar instance.
    **/
    public disableSync() {
        this.syncEnabled = false;
    };

    /**
     * Enable diagonal pathfinding.
     */
    public enableDiagonals() {
        this.diagonalsEnabled = true;
    }

    /**
     * Disable diagonal pathfinding.
     */
    public disableDiagonals() {
        this.diagonalsEnabled = false;
    }


    /**
        * Sets the collision grid that EasyStar uses.
        *
        * @param {Array} grid The collision grid that this EasyStar instance will read from.
        * This should be a 2D Array of Numbers.
        **/
    public setGrid(grid): void {
        this.collisionGrid = grid;

        //Setup cost map
        this.collisionGrid.forEach(cg =>
            cg
                .filter(c => !this.costMap[c])
                .forEach(c => this.setTileCost(c, 1))
        );
    };

    /**
    * Sets the tile cost for a particular tile type.
    *
    * @param {Number} The tile type to set the cost for.
    * @param {Number} The multiplicative cost associated with the given tile.
    **/
    public setTileCost(tileType: number, cost: number): void {
        this.costMap.set(tileType, cost);
    };

    /**
    * Sets the an additional cost for a particular point.
    * Overrides the cost from setTileCost.
    *
    * @param {Number} x The x value of the point to cost.
    * @param {Number} y The y value of the point to cost.
    * @param {Number} The multiplicative cost associated with the given point.
    **/
    public setAdditionalPointCost(x: number, y: number, cost: number): void {
        this.pointsToCost.set(this.getPointsKey(x, y), cost);
    };

    /**
    * Remove the additional cost for a particular point.
    *
    * @param {Number} x The x value of the point to stop costing.
    * @param {Number} y The y value of the point to stop costing.
    **/
    public removeAdditionalPointCost(x, y): void {
        this.pointsToCost.delete(this.getPointsKey(x, y));
    }

    private getPointsKey(x: number, y: number): string {
        return x + '_' + y;
    }

    /**
    * Remove all additional point costs.
    **/
    public removeAllAdditionalPointCosts(): void {
        this.pointsToCost = new Map();
    }

    /**
    * Sets a directional condition on a tile
    *
    * @param {Number} x The x value of the point.
    * @param {Number} y The y value of the point.
    * @param {Array.<String>} allowedDirections A list of all the allowed directions that can access
    * the tile.
    **/
    public setDirectionalCondition(x: number, y: number, allowedDirections: Array<string>): void {
        this.directionalConditions.set(this.getPointsKey(x, y), allowedDirections);
    };

    /**
    * Remove all directional conditions
    **/
    public removeAllDirectionalConditions(): void {
        this.directionalConditions = new Map();
    };

    /**
    * Sets the number of search iterations per calculation.
    * A lower number provides a slower result, but more practical if you
    * have a large tile-map and don't want to block your thread while
    * finding a path.
    *
    * @param {Number} iterations The number of searches to prefrom per calculate() call.
    **/
    public setIterationsPerCalculation(iterations: number): void {
        this.iterationsPerCalculation = iterations;
    };

    /**
    * Avoid a particular point on the grid,
    * regardless of whether or not it is an acceptable tile.
    *
    * @param {Number} x The x value of the point to avoid.
    * @param {Number} y The y value of the point to avoid.
    **/
    public avoidAdditionalPoint(x: number, y: number): void {
        this.pointsToAvoid.set(this.getPointsKey(x, y), 1);
    };




    /**
    * Stop avoiding a particular point on the grid.
    *
    * @param {Number} x The x value of the point to stop avoiding.
    * @param {Number} y The y value of the point to stop avoiding.
    **/
    public stopAvoidingAdditionalPoint(x: number, y: number): void {
        this.pointsToAvoid.delete(this.getPointsKey(x, y));
    };

    /**
    * Enables corner cutting in diagonal movement.
    **/
    public enableCornerCutting(): void {
        this.allowCornerCutting = true;
    };

    /**
    * Disables corner cutting in diagonal movement.
    **/
    public disableCornerCutting(): void {
        this.allowCornerCutting = false;
    };

    /**
    * Stop avoiding all additional points on the grid.
    **/
    public stopAvoidingAllAdditionalPoints(): void {
        this.pointsToAvoid = new Map;
    };




    /**
    * Find a path.
    *
    * @param {Number} startX The X position of the starting point.
    * @param {Number} startY The Y position of the starting point.
    * @param {Number} endX The X position of the ending point.
    * @param {Number} endY The Y position of the ending point.
    * @param {Function} callback A function that is called when your path
    * is found, or no path is found.
    *
    **/
    public findPath(startX: number, startY: number, endX: number, endY: number, callback, maxCost?: number): void {

        if (!maxCost) {
            maxCost = 999;
        }


        // Wraps the callback for sync vs async logic
        let syncEnabled = this.syncEnabled,
            callbackWrapper = function (result) {
                if (syncEnabled) {
                    callback(result);
                } else {
                    setTimeout(function () {
                        callback(result);
                    });
                }
            }
        // Start or endpoint outside of scope.
        if (startX < 0 || startY < 0 || endX < 0 || endY < 0 ||
            startX > this.collisionGrid[0].length - 1 || startY > this.collisionGrid.length - 1 ||
            endX > this.collisionGrid[0].length - 1 || endY > this.collisionGrid.length - 1) {
            throw new Error("Your start or end point is outside the scope of your grid." + startX + ':' + startY + "," + endX + ':' + endY);
        }

        // Start and end are the same tile.
        if (startX === endX && startY === endY) {
            callbackWrapper([]);
            return;
        }

        // End point is not an acceptable tile.
        var endTile = this.collisionGrid[endY][endX];
        var isAcceptable = false;
        for (var i = 0; i < this.acceptableTiles.length; i++) {
            if (endTile === this.acceptableTiles[i]) {
                isAcceptable = true;
                break;
            }
        }

        if (isAcceptable === false) {
            callbackWrapper(null);
            return;
        }

        // Create the instance
        var instance = new Instance();
        instance.openList = new Heap(function (nodeA, nodeB) {
            return nodeA.bestGuessDistance() - nodeB.bestGuessDistance();
        });
        instance.isDoneCalculating = false;
        instance.nodeHash = {};
        instance.startX = startX;
        instance.startY = startY;
        instance.endX = endX;
        instance.endY = endY;
        instance.maxCost = maxCost;
        instance.callback = callbackWrapper;

        let node = this.coordinateToNode(instance, instance.startX, instance.startY, null, STRAIGHT_COST);

        instance.openList.push(node);

        this.instances.push(instance);
    }
    /**
    * This method steps through the A* Algorithm in an attempt to
    * find your path(s). It will search 4-8 tiles (depending on diagonals) for every calculation.
    * You can change the number of calculations done in a call by using
    * easystar.setIteratonsPerCalculation().
    **/
    calculate(): void {
        if (this.instances.length === 0 || this.collisionGrid === undefined || this.acceptableTiles === undefined) {
            return;
        }
        for (this.iterationsSoFar = 0; this.iterationsSoFar < this.iterationsPerCalculation; this.iterationsSoFar++) {
            if (this.instances.length === 0) {
                return;
            }

            let instance = this.instances[0],
                searchNode = this.getNode(instance),
                tilesToSearch = [];

            if (!searchNode) {
                continue;
            }

            // Handles the case where we have found the destination
            if (this.haveFoundDestination(instance, searchNode)) {
                return
            }

            searchNode.list = CLOSED_LIST;

            this.checkTiles(instance, searchNode, tilesToSearch);

            if (this.diagonalsEnabled) {
                this.checkDiagonale(instance, searchNode, tilesToSearch);
            }

            var isDoneCalculating = false;

            // Search all of the surrounding nodes
            tilesToSearch.forEach(tile => {
                if (isDoneCalculating) {
                    return;
                }
                this.checkAdjacentNode(tile);
                if (tile.instance.isDoneCalculating === true) {
                    isDoneCalculating = true;
                }
            });

            if (isDoneCalculating) {
                this.instances.shift();
                continue;
            }
        }
    }


    //private

    private haveFoundDestination(instance: Instance, searchNode: Node): boolean {
        // Handles the case where we have found the destination
        if (instance.endX === searchNode.x && instance.endY === searchNode.y) {
            instance.isDoneCalculating = true;
            var path = [];
            path.push({ x: searchNode.x, y: searchNode.y });
            var parent = searchNode.parent;
            while (parent != null) {
                path.push({ x: parent.x, y: parent.y });
                parent = parent.parent;
            }
            path.reverse();
            var ic = instance;
            var ip = path;
            ic.callback(ip);
            return true;
        }
        return false;
    }

    private getNode(instance: Instance): Node {

        if (this.syncEnabled) {
            // If this is a sync instance, we want to make sure that it calculates synchronously.
            this.iterationsSoFar = 0;
        }

        // Couldn't find a path.
        if (instance.openList.length === 0) {
            var ic = instance;
            ic.callback(null);
            this.instances.shift();
            return;
        }

        var searchNode = instance.openList.pop();

        if (searchNode.costSoFar > instance.maxCost) {
            var ic = instance;
            ic.callback(null);
            this.instances.shift();
            return;
        }
        return searchNode;
    }

    private checkTiles(instance: Instance, searchNode: Node, tilesToSearch: Array<Object>) {
        if (searchNode.y > 0) {
            tilesToSearch.push({
                instance: instance, searchNode: searchNode,
                x: 0, y: -1, cost: STRAIGHT_COST * this.getTileCost(searchNode.x, searchNode.y - 1)
            });
        }
        if (searchNode.x < this.collisionGrid[0].length - 1) {
            tilesToSearch.push({
                instance: instance, searchNode: searchNode,
                x: 1, y: 0, cost: STRAIGHT_COST * this.getTileCost(searchNode.x + 1, searchNode.y)
            });
        }
        if (searchNode.y < this.collisionGrid.length - 1) {
            tilesToSearch.push({
                instance: instance, searchNode: searchNode,
                x: 0, y: 1, cost: STRAIGHT_COST * this.getTileCost(searchNode.x, searchNode.y + 1)
            });
        }
        if (searchNode.x > 0) {
            tilesToSearch.push({
                instance: instance, searchNode: searchNode,
                x: -1, y: 0, cost: STRAIGHT_COST * this.getTileCost(searchNode.x - 1, searchNode.y)
            });
        }
    }

    private checkDiagonale(instance: Instance, searchNode: Node, tilesToSearch: Array<Object>) {

        if (searchNode.x > 0 && searchNode.y > 0) {
            if (this.allowCornerCutting ||
                (
                    this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x, searchNode.y - 1) &&
                    this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x - 1, searchNode.y))) {

                tilesToSearch.push({
                    instance: instance, searchNode: searchNode,
                    x: -1, y: -1, cost: DIAGONAL_COST * this.getTileCost(searchNode.x - 1, searchNode.y - 1)
                });
            }
        }
        if (searchNode.x < this.collisionGrid[0].length - 1 && searchNode.y < this.collisionGrid.length - 1) {

            if (this.allowCornerCutting ||
                (
                    this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x, searchNode.y + 1) &&
                    this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x + 1, searchNode.y))) {

                tilesToSearch.push({
                    instance: instance, searchNode: searchNode,
                    x: 1, y: 1, cost: DIAGONAL_COST * this.getTileCost(searchNode.x + 1, searchNode.y + 1)
                });
            }
        }
        if (searchNode.x < this.collisionGrid[0].length - 1 && searchNode.y > 0) {

            if (this.allowCornerCutting ||
                (this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x, searchNode.y - 1) &&
                    this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x + 1, searchNode.y))) {


                tilesToSearch.push({
                    instance: instance, searchNode: searchNode,
                    x: 1, y: -1, cost: DIAGONAL_COST * this.getTileCost(searchNode.x + 1, searchNode.y - 1)
                });
            }
        }
        if (searchNode.x > 0 && searchNode.y < this.collisionGrid.length - 1) {

            if (this.allowCornerCutting ||
                (this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x, searchNode.y + 1) &&
                    this.isTileWalkable(this.collisionGrid, this.acceptableTiles, searchNode.x - 1, searchNode.y))) {


                tilesToSearch.push({
                    instance: instance, searchNode: searchNode,
                    x: -1, y: 1, cost: DIAGONAL_COST * this.getTileCost(searchNode.x - 1, searchNode.y + 1)
                });
            }
        }
    }

    // Private methods follow
    private checkAdjacentNode(tile): void {
        let instance = tile.instance,
            searchNode = tile.searchNode,
            x = tile.x,
            y = tile.y,
            cost = tile.cost,
            adjacentCoordinateX = searchNode.x + x,
            adjacentCoordinateY = searchNode.y + y;

        if (this.pointsToAvoid[adjacentCoordinateX + "_" + adjacentCoordinateY] === undefined &&
            this.isTileWalkable(this.collisionGrid, this.acceptableTiles, adjacentCoordinateX, adjacentCoordinateY, searchNode)) {
            var node = this.coordinateToNode(instance, adjacentCoordinateX, adjacentCoordinateY, searchNode, cost);

            if (node.list === undefined) {
                node.list = OPEN_LIST;
                instance.openList.push(node);
            } else if (searchNode.costSoFar + cost < node.costSoFar) {
                node.costSoFar = searchNode.costSoFar + cost;
                node.parent = searchNode;
                instance.openList.updateItem(node);
            }
        }
    };

    // Helpers
    private isTileWalkable(collisionGrid, acceptableTiles, x, y, sourceNode?): boolean {
        if (this.directionalConditions[x + "_" + y]) {
            var direction = this.calculateDirection(sourceNode.x - x, sourceNode.y - y)
            var directionIncluded = function () {
                for (var i = 0; i < this.directionalConditions[x + "_" + y].length; i++) {
                    if (this.directionalConditions[x + "_" + y][i] === direction) return true
                }
                return false
            }
            if (!directionIncluded()) return false
        }
        for (var i = 0; i < acceptableTiles.length; i++) {
            if (collisionGrid[y][x] === acceptableTiles[i]) {
                return true;
            }
        }

        return false;
    };

    /**
     * -1, -1 | 0, -1  | 1, -1
     * -1,  0 | SOURCE | 1,  0
     * -1,  1 | 0,  1  | 1,  1
     */
    private calculateDirection(diffX: number, diffY: number) {
        if (diffX === 0 && diffY === -1) return EasyStar_BOTTOM
        else if (diffX === 1 && diffY === -1) return EasyStar_BOTTOM_LEFT
        else if (diffX === 1 && diffY === 0) return EasyStar_LEFT
        else if (diffX === 1 && diffY === 1) return EasyStar_TOP_LEFT
        else if (diffX === 0 && diffY === 1) return EasyStar_TOP
        else if (diffX === -1 && diffY === 1) return EasyStar_TOP_RIGHT
        else if (diffX === -1 && diffY === 0) return EasyStar_RIGHT
        else if (diffX === -1 && diffY === -1) return EasyStar_BOTTOM_RIGHT
        throw new Error('These differences are not valid: ' + diffX + ', ' + diffY)
    };

    private getTileCost(x: number, y: number) {
        return this.pointsToCost[this.getPointsKey(x, y)] || this.costMap.get(this.collisionGrid[y][x])
    };

    private coordinateToNode(instance: Instance, x: number, y: number, parent, cost): Node {
        if (instance.nodeHash[x + "_" + y] !== undefined) {
            return instance.nodeHash[x + "_" + y];
        }
        var simpleDistanceToTarget = this.getDistance(x, y, instance.endX, instance.endY);
        if (parent !== null) {
            var costSoFar = parent.costSoFar + cost;
        } else {
            costSoFar = 0;
        }
        var node = new Node(parent, x, y, costSoFar, simpleDistanceToTarget);
        instance.nodeHash[x + "_" + y] = node;
        return node;
    };

    private getDistance(x1, y1, x2, y2) {
        if (this.diagonalsEnabled) {
            // Octile distance
            var dx = Math.abs(x1 - x2);
            var dy = Math.abs(y1 - y2);
            if (dx < dy) {
                return DIAGONAL_COST * dx + dy;
            } else {
                return DIAGONAL_COST * dy + dx;
            }
        } else {
            // Manhattan distance
            var dx = Math.abs(x1 - x2);
            var dy = Math.abs(y1 - y2);
            return (dx + dy);
        }
    };

}

class Instance {
    isDoneCalculating: boolean = true;
    pointsToAvoid = {};
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    maxCost?: number;
    callback;
    nodeHash = {};
    openList: Array<Node>;
}
/**
* A simple Node that represents a single tile on the grid.
* @param {Object} parent The parent node.
* @param {Number} x The x position on the grid.
* @param {Number} y The y position on the grid.
* @param {Number} costSoFar How far this node is in moves*cost from the start.
* @param {Number} simpleDistanceToTarget Manhatten distance to the end point.
**/
class Node {

    public list;
    constructor(public parent, public x: number, public y: number, public costSoFar: number, public simpleDistanceToTarget: number) { }

    /**
    * @return {Number} Best guess distance of a cost using this node.
    **/
    public bestGuessDistance(): number {
        return this.costSoFar + this.simpleDistanceToTarget;
    }
}