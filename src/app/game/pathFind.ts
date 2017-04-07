import { Square } from 'app/game/map'


const DIAGONAL_COST: number = 1.4;

interface ChildNode{
    cost:number,
    node:Node
}

class Node {
    childs: number
    weight: number
    visited: boolean
    type: number

    constructor(
        public x: number,
        public y: number,
        map: Array<Array<number>>) {
        this.type = map[y][x];
        this.weight = -1;
        this.visited = false
    }

    getKey(): string {
        return this.getKeyFromCoordinate(this.x, this.y);
    }

    getChilds(weights: Map<string, Node>): Array<ChildNode> {
        let childs = new Array<ChildNode>(),
            addInbound = (deltax, deltay, diagonal?:boolean) => {

                let x = this.x + deltax,
                    y = this.y + deltay;


                let child = weights.get(this.getKeyFromCoordinate(x, y));

                if (child && child.type == 0) {
                    
                    childs.push({
                        cost : diagonal? DIAGONAL_COST:1,
                        node: child
                    });
                }
            }
        /**
         * -1, -1 | 0, -1  | 1, -1
         * -1,  0 | SOURCE | 1,  0
         * -1,  1 | 0,  1  | 1,  1
         */
        addInbound(-1, -1, true); addInbound(0, -1); addInbound(1, -1, true);
        addInbound(-1, 0);/*SOURCE        */addInbound(1, 0);
        addInbound(-1, 1, true); addInbound(0, 1); addInbound(1, 1, true);


        return childs;

    }

    private getKeyFromCoordinate(x: number, y: number) {
        return x + ':' + y;
    }

}

export class PathFind {



    find(_start: Square, _end: Square, _map: Array<Array<number>>, max: number, callback:(x, y, path:Array<Node>)=>void) {
        let self= this;
        setTimeout(function() {
            self.do(_start, _end, _map, max, callback);
        });
    }
    do(_start: Square, _end: Square, _map: Array<Array<number>>, max: number, callback:(x:number, y:number, path:Array<Node>)=>void) {
    
        let pathFindLog = function (message) {
            console.log(message);
        },
            weights = new Map<string, Node>(),
            weightDico = {},
            ancestors = new Map<string, Node>(),
            index = 0;

        // initialisation
        //map[y][x]
        _map.forEach((line, y) => {
            line.forEach((square, x) => {
                let currentNode = new Node(x, y, _map);
                if (currentNode.x === _start.x && currentNode.y === _start.y) {
                    currentNode.weight = 0;
                }
                weights.set(currentNode.getKey(), currentNode);
                ancestors.set(currentNode.getKey(), null);
            }
            );
        }
        );

        //On recherche le noeud non parcouru ayant le poids le plus faible et on indique donc qu'on l'a parcouru
        let unvisitedLighterNodes = this.getUnvisitedLighterNodes(weights);
        let tilesSeen = 0;
        while (tilesSeen<max && unvisitedLighterNodes && unvisitedLighterNodes.length > 0 && !this.haveFoundDestination(unvisitedLighterNodes, _end)) {

            unvisitedLighterNodes.forEach(fatherNode => {

                fatherNode.visited = true;

                //On va rechercher "les fils" du noeud où l'on se trouve
                var childs = fatherNode.getChilds(weights);

                childs.forEach(currentChild => {

                    // SI ( le noeud-fils n'a pas encore été parcouru )
                    // ET QUE ( Poids(Noeud-père) + Poids(Liaison Noeud-père/Noeud-fils) < Poids(Noeud-fils) ) OU Poids(Noeud-fils) = -1 
                    // la distance entre chaque case est de 1
                    if (!currentChild.node.visited && ((fatherNode.weight + currentChild.cost < currentChild.node.weight) || currentChild.node.weight == -1)) {
                        //Poids(Noeud-fils) = Poids(Noeud-père) + Poids(Liaison Noeud-père/Noeud-fils)
                        currentChild.node.weight = fatherNode.weight + currentChild.cost;

                        //Antecedent(Noeud-fils) = Noeud-Père
                        ancestors.set(currentChild.node.getKey(), fatherNode);
                    }

                });
            });

            unvisitedLighterNodes = this.getUnvisitedLighterNodes(weights);
        }

        let path = this.readPath(_start, _end, ancestors);

        if(!path){
            return null;
        }

        path.push(weights.get(_end.x + ':' + _end.y));

        callback(_end.x, _end.y, path);
    }

    private readPath(_start: Square, _end: Square, ancestors: Map<string, Node>) {
        let path = new Array<Node>();
        let currentNode = ancestors.get(_end.x + ':' + _end.y),
            startKey = _start.x + ':' + _start.y;
        if(!currentNode){
            return null;
        }
        path.push(currentNode);
        while (currentNode.getKey() != startKey) {
            currentNode = ancestors.get(currentNode.getKey());
            path.push(currentNode);
        }
        return path.reverse();
    }

    private haveFoundDestination(unvisitedLighterNodes: Array<Node>, destination: Square) {
        return unvisitedLighterNodes.filter(node => node.x == destination.x && node.y == destination.y).length > 0;
    }

    private getUnvisitedLighterNodes = function (_weights: Map<string, Node>): Array<Node> {

        var unvisitedLighterNodes: Array<Node> = null;
        var lesserWeight = 2048;
        var breakLoop = false;

        _weights.forEach(
            currentWeightNode => {
                if (breakLoop) {
                    return;
                }

                if (currentWeightNode.visited || currentWeightNode.weight == -1) {
                    return;
                }
                if (currentWeightNode.weight > lesserWeight) {
                    breakLoop = true;
                    return;
                }
                if (currentWeightNode.weight == lesserWeight) {
                    unvisitedLighterNodes.push(currentWeightNode);
                    return;
                }
                if (currentWeightNode.weight < lesserWeight) {
                    // initialise le tableau
                    unvisitedLighterNodes = [currentWeightNode];
                    lesserWeight = currentWeightNode.weight;
                    return;
                }
            }
        );

        return unvisitedLighterNodes;
    };
}