import * as d3 from 'd3';

export enum AreaClassCode {
    _left,
    _upper_left,
    _top,
    _upper_right,
    _right,
    _bottom_left,
    _bottom,
    _bottom_right,
    _center
}

export class TorusLayoutViewController {
    private graph: any;

    constructor(graph: any) {
        this.graph = graph;
    }

    /** A method to bind a draggable behaviour to an svg element in a group*/
    public applyGroupDraggableBehaviour(element: any, graph: any, configuration: any, boundaryObject: any, updateRender: any, computeWrappingGraphForRendering: any): void {
        const d3element = d3.select(element);

        d3element.call(d3.drag()
        .on('start', (): void => {
            configuration.dragStartX = d3.event.x;
            configuration.dragStartY = d3.event.y;
            
            /** Preventing propagation of dragstart to parent elements */
            d3.event.sourceEvent.stopPropagation();
        })
        .on("drag", ():void => {
            //apply transforma to graph
            this.transform(graph, d3.event.x - configuration.dragStartX,
                d3.event.y - configuration.dragStartY);

            //compute 
            configuration.dragStartX = d3.event.x;
            configuration.dragStartY = d3.event.y;
            
            computeWrappingGraphForRendering();

            //center
            updateRender(0, 0, AreaClassCode._center.toString());

            //surrounding squares
            //left
            updateRender(-boundaryObject.oneThirdWidth, 0, AreaClassCode._left.toString());
            //upper-left
            updateRender(-boundaryObject.oneThirdWidth, -boundaryObject.oneThirdHeight, AreaClassCode._upper_left.toString());
            //top
            updateRender(0, -boundaryObject.oneThirdHeight, AreaClassCode._top.toString());
            //upper-right
            updateRender(boundaryObject.oneThirdWidth, -boundaryObject.oneThirdHeight, AreaClassCode._upper_right.toString());
            //right
            updateRender(boundaryObject.oneThirdWidth, 0, AreaClassCode._right.toString());
            //bottom-right
            updateRender(boundaryObject.oneThirdWidth, boundaryObject.oneThirdHeight, AreaClassCode._bottom_right.toString());
            //bottom
            updateRender(0, boundaryObject.oneThirdHeight, AreaClassCode._bottom.toString());
            //bottom-left
            updateRender(-boundaryObject.oneThirdWidth, boundaryObject.oneThirdHeight, AreaClassCode._bottom_left.toString());
        })
        .on("end", (): void => {            
            //apply transforma to graph
            this.transform(graph, d3.event.x - configuration.dragStartX,
                d3.event.y - configuration.dragStartY);

            let d: Date = new Date();

            configuration.dragStartX = d3.event.x;
            configuration.dragStartY = d3.event.y;

            computeWrappingGraphForRendering();

            //center
            updateRender(0, 0, AreaClassCode._center.toString());

            //surrounding squares
            //left
            updateRender(-boundaryObject.oneThirdWidth, 0, AreaClassCode._left.toString());
            //upper-left
            updateRender(-boundaryObject.oneThirdWidth, -boundaryObject.oneThirdHeight, AreaClassCode._upper_left.toString());
            //top
            updateRender(0, -boundaryObject.oneThirdHeight, AreaClassCode._top.toString());
            //upper-right
            updateRender(boundaryObject.oneThirdWidth, -boundaryObject.oneThirdHeight, AreaClassCode._upper_right.toString());
            //right
            updateRender(boundaryObject.oneThirdWidth, 0, AreaClassCode._right.toString());
            //bottom-right
            updateRender(boundaryObject.oneThirdWidth, boundaryObject.oneThirdHeight, AreaClassCode._bottom_right.toString());
            //bottom
            updateRender(0, boundaryObject.oneThirdHeight, AreaClassCode._bottom.toString());
            //bottom-left
            updateRender(-boundaryObject.oneThirdWidth, boundaryObject.oneThirdHeight, AreaClassCode._bottom_left.toString());
        }));
    }

    public computeWrappingGraphForRendering(graph: any, 
        twoEdgeWrappingGraph: any, threeEdgeWrappingGraph: any, bEnableTorusWrapping: boolean,
        oneThirdWidth: number, twoThirdsWidth: number, oneThirdHeight: number, twoThirdsHeight: number, wrappingNodeLabel: Array<any>): void {

        //wrapping node if it's not within boundary using its relative position to svg group
        if(bEnableTorusWrapping) {
            this.wrappingNode(graph, oneThirdWidth, twoThirdsWidth, oneThirdHeight, twoThirdsHeight);
        }

        let results: any = {"edgeLength":Number.MAX_VALUE,
        "minDiffFromIdealDistance": Number.MAX_VALUE};        
        
        //remove all intersection points and reset visiblt to true for all edges
        if(twoEdgeWrappingGraph != null && twoEdgeWrappingGraph.links != null &&
            twoEdgeWrappingGraph.nodes != null){
                //restore visibility of edges on graph
                //overwrite all the wrapping edges derived in previous layout round
                graph.links.forEach(d => {
                    d.visible = true;                    
                });

                graph.links.forEach(d => {
                    if(d.source.visible && d.target.visible)
                        d.visible = true;
                    else
                        d.visible = false;
                });
                twoEdgeWrappingGraph.nodes.splice(0, twoEdgeWrappingGraph.nodes.length);
                twoEdgeWrappingGraph.links.splice(0, twoEdgeWrappingGraph.links.length);
                threeEdgeWrappingGraph.nodes.splice(0, threeEdgeWrappingGraph.nodes.length);
                threeEdgeWrappingGraph.links.splice(0, threeEdgeWrappingGraph.links.length);
                wrappingNodeLabel.splice(0, wrappingNodeLabel.length);

                for(let node of graph.nodes){
                    if(node.visible) {
                        twoEdgeWrappingGraph.nodes.push({"x":node.x, "y":node.y, "visible": false});
                        threeEdgeWrappingGraph.nodes.push({"x":node.x, "y":node.y, "visible": false});
                    }                        
                }                
        }

        let sourceX: number = 0;
        let sourceY: number = 0;
        let targetX: number = 0;
        let targetY: number = 0;
        let nodesInContext: Array<any> = null;
        let intersectionPoints: Array<any> = null;
        let tmpDistance: number = 0;

        for(let edge of graph.links) {
            if(edge.visible) {
                sourceX = edge.source.x;
                sourceY = edge.source.y;
                targetX = edge.target.x;
                targetY = edge.target.y;
                results = {"edgeLength": Number.MAX_VALUE, "minDiffFromIdealDistance": Number.MAX_VALUE};
                let idealDistance = graph.linkLength *(graph.shortestPath[edge.source.nodeIndex][edge.target.nodeIndex].length - 1);
                tmpDistance = 0;

                nodesInContext = this.getNodePositionsFromContext(oneThirdWidth, twoThirdsWidth, oneThirdHeight, twoThirdsHeight, targetX, targetY);
                intersectionPoints = this.getIntersectionPoints(
                    sourceX, sourceY, targetX, targetY, nodesInContext, results, bEnableTorusWrapping,
                    oneThirdWidth, twoThirdsWidth, oneThirdHeight, twoThirdsHeight, idealDistance);
                tmpDistance = this.findEuclideanDistance(sourceX, sourceY, targetX, targetY);
                let diffFromIdealDistance = Math.abs(tmpDistance - idealDistance);

                if(results.minDiffFromIdealDistance <= diffFromIdealDistance && intersectionPoints != null && intersectionPoints.length > 0) {
                    if(intersectionPoints.length > 2 && intersectionPoints.length < 5) {
                        threeEdgeWrappingGraph.nodes.push({"x":intersectionPoints[0].x,"y":intersectionPoints[0].y,
                            "visible": true});
                        threeEdgeWrappingGraph.nodes.push({"x":intersectionPoints[1].x,"y":intersectionPoints[1].y,
                            "visible": true});
                        threeEdgeWrappingGraph.links.push({"x1":intersectionPoints[0].x,"y1":intersectionPoints[0].y,
                            "x2":sourceX,"y2":sourceY,"visible": true});
                        threeEdgeWrappingGraph.links.push({"x1":intersectionPoints[1].x,"y1":intersectionPoints[1].y,
                            "x2":targetX,"y2":targetY,"visible": true});
                            
                        threeEdgeWrappingGraph.nodes.push({"x":intersectionPoints[2].x,"y":intersectionPoints[2].y,
                        "visible": true});
                        threeEdgeWrappingGraph.nodes.push({"x":intersectionPoints[3].x,"y":intersectionPoints[3].y,
                            "visible": true});
                        threeEdgeWrappingGraph.links.push({"x1":intersectionPoints[2].x,"y1":intersectionPoints[2].y,
                            "x2":intersectionPoints[3].x,"y2":intersectionPoints[3].y,"visible": true});

                        wrappingNodeLabel.push({"x":intersectionPoints[0].x,"y":intersectionPoints[0].y,
                                           "visible": true, "name": edge.target.name});
                        wrappingNodeLabel.push({"x":intersectionPoints[1].x,"y":intersectionPoints[1].y,
                                           "visible": true, "name": edge.source.name});
                    }
                    else {
                        twoEdgeWrappingGraph.nodes.push({"x":intersectionPoints[0].x,"y":intersectionPoints[0].y,
                            "visible": true});
                        twoEdgeWrappingGraph.nodes.push({"x":intersectionPoints[1].x,"y":intersectionPoints[1].y,
                            "visible": true});
                        twoEdgeWrappingGraph.links.push({"x1":intersectionPoints[0].x,"y1":intersectionPoints[0].y,
                            "x2":sourceX,"y2":sourceY,"visible": true});
                        twoEdgeWrappingGraph.links.push({"x1":intersectionPoints[1].x,"y1":intersectionPoints[1].y,
                            "x2":targetX,"y2":targetY,"visible": true});

                        wrappingNodeLabel.push({"x":intersectionPoints[0].x,"y":intersectionPoints[0].y,
                            "visible": true, "name": edge.target.name});
                        wrappingNodeLabel.push({"x":intersectionPoints[1].x,"y":intersectionPoints[1].y,
                            "visible": true, "name": edge.source.name});
                    }                    

                    //mark the link as invisible 
                    edge.visible = false;
                }                
            }            
        }
    }

    private findEuclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
    }

    private getNodePositionsFromContext(oneThirdWidth: number, twoThirdsWidth: number, oneThirdHeight: number, twoThirdsHeight: number, x: number, y: number): any {
        let nodesInContext: any = new Array<any>();
        if(nodesInContext != null){
            //calculate x, y position of nodes in the 4 adjacent squares 
            //in the order of [left, up, right, bottom]
            nodesInContext.push({"x":x-oneThirdWidth, "y":y, "intersectedX": oneThirdWidth, "intersectedY": 0});
            nodesInContext.push({"x":x, "y":y-oneThirdHeight, "intersectedX": 0, "intersectedY": oneThirdHeight});
            nodesInContext.push({"x":x+oneThirdWidth, "y":y, "intersectedX": twoThirdsWidth, "intersectedY": 0});
            nodesInContext.push({"x":x, "y":y+oneThirdHeight, "intersectedX": 0, "intersectedY": twoThirdsHeight});

            //calculate x, y position of nodes in the 4 corner squares
            //in the order of [upper-left, upper-right, bottom-right bottom-left]
            nodesInContext.push({"x":x-oneThirdWidth, "y":y-oneThirdHeight, "intersectedX": oneThirdWidth, "intersectedY": oneThirdHeight});
            nodesInContext.push({"x":x+oneThirdWidth, "y":y-oneThirdHeight, "intersectedX": twoThirdsWidth, "intersectedY": oneThirdHeight});            
            nodesInContext.push({"x":x+oneThirdWidth, "y":y+oneThirdHeight, "intersectedX": twoThirdsWidth, "intersectedY": twoThirdsHeight});
            nodesInContext.push({"x":x-oneThirdWidth, "y":y+oneThirdHeight, "intersectedX": oneThirdWidth, "intersectedY": twoThirdsHeight});            
        }
        return nodesInContext;
    }

    private getIntersectionPoints(sourceX: number, sourceY: number, targetX: number, targetY: number, nodesInContext: any, results: any,
        bEnableTorusWrapping: boolean, oneThirdWidth: number, twoThirdsWidth: number, oneThirdHeight: number, twoThirdsHeight: number, idealDistance: number): any{        
        let intersectionPoints: any= new Array<any>();
        let minDiffFromIdealDistance = Number.MAX_VALUE;

        //ignore if nodesInContext is null or empty
        if(nodesInContext == null)
            intersectionPoints = null;
        else if(bEnableTorusWrapping) {
            //for each targetNode, we need to calculate a pair of intersection points on two sides of boundaries
            for(let mappingNode of nodesInContext) {
                let intersectedX1: number = 0;
                let intersectedY1: number = 0;
                let intersectedX2: number = 0;
                let intersectedY2: number = 0;
                let intersectedX3: number = 0;
                let intersectedY3: number = 0;
                let intersectedX4: number = 0;
                let intersectedY4: number = 0;

                //if intersection resides in a corner square, check which of the two sides of the the boundary it intersects
                if(mappingNode.intersectedX != 0 && mappingNode.intersectedY != 0) {
                    //upper-left corner
                    if(mappingNode.intersectedX == oneThirdWidth && mappingNode.intersectedY == oneThirdHeight) {
                        let testX1: number = mappingNode.intersectedX;
                        let testY1: number = this.getYGivenXAndSrcnodesInContext(sourceX, sourceY, 
                            mappingNode.x, mappingNode.y, mappingNode.intersectedX);
                        
                        let testY2: number = mappingNode.intersectedY;
                        let testX2: number = this.getXGivenYAndSrcnodesInContext(sourceX, sourceY,
                                mappingNode.x, mappingNode.y, mappingNode.intersectedY);

                        //check whether testY1 is within center square boundary 
                        if(testY1 >= oneThirdHeight && testY1 <= twoThirdsHeight) {
                            intersectedX1 = mappingNode.intersectedX;
                            intersectedY1 = testY1;

                            intersectedX2 = testX2 + oneThirdWidth;
                            intersectedY2 = testY2 + oneThirdHeight;

                            intersectedX3 = intersectedX1 + oneThirdWidth;
                            intersectedY3 = intersectedY1;

                            intersectedX4 = testX2 + oneThirdWidth;
                            intersectedY4 = testY2;
                        }
                        else if(testX2 >= oneThirdWidth && testX2 <= twoThirdsWidth) {
                            intersectedX1 = testX2;
                            intersectedY1 = mappingNode.intersectedY;

                            intersectedX2 = testX1 + oneThirdWidth;
                            intersectedY2 = testY1 + oneThirdHeight;                            

                            intersectedX3 = intersectedX1;
                            intersectedY3 = intersectedY1 + oneThirdHeight;

                            intersectedX4 = testX1;
                            intersectedY4 = testY1 + oneThirdHeight;
                        }
                    }
                    //upper-right corner
                    else if(mappingNode.intersectedX == twoThirdsWidth && mappingNode.intersectedY == oneThirdHeight) {
                        let testX1: number = mappingNode.intersectedX;
                        let testY1: number = this.getYGivenXAndSrcnodesInContext(sourceX, sourceY, 
                            mappingNode.x, mappingNode.y, mappingNode.intersectedX);
                        
                        let testY2: number = mappingNode.intersectedY;
                        let testX2: number = this.getXGivenYAndSrcnodesInContext(sourceX, sourceY,
                                mappingNode.x, mappingNode.y, mappingNode.intersectedY);

                        //check whether testY1 is within center square boundary 
                        if(testY1 >= oneThirdHeight && testY1 <= twoThirdsHeight) {
                            intersectedX1 = mappingNode.intersectedX;
                            intersectedY1 = testY1;

                            intersectedX2 = testX2 - oneThirdWidth;
                            intersectedY2 = testY2 + oneThirdHeight;

                            intersectedX3 = intersectedX1 - oneThirdWidth;
                            intersectedY3 = intersectedY1;

                            intersectedX4 = testX2 - oneThirdWidth;
                            intersectedY4 = testY2;
                        }
                        else if(testX2 >= oneThirdWidth && testX2 <= twoThirdsWidth) {
                            intersectedX1 = testX2;
                            intersectedY1 = mappingNode.intersectedY;

                            intersectedX2 = testX1 - oneThirdWidth;
                            intersectedY2 = testY1 + oneThirdHeight; 
                            
                            intersectedX3 = intersectedX1;
                            intersectedY3 = intersectedY1 + oneThirdHeight;

                            intersectedX4 = testX1;
                            intersectedY4 = testY1 + oneThirdHeight;
                        }
                    }
                    //bottom-right corner
                    else if(mappingNode.intersectedX == twoThirdsWidth && mappingNode.intersectedY == twoThirdsHeight) {
                        let testX1: number = mappingNode.intersectedX;
                        let testY1: number = this.getYGivenXAndSrcnodesInContext(sourceX, sourceY, 
                            mappingNode.x, mappingNode.y, mappingNode.intersectedX);
                        
                        let testY2: number = mappingNode.intersectedY;
                        let testX2: number = this.getXGivenYAndSrcnodesInContext(sourceX, sourceY,
                                mappingNode.x, mappingNode.y, mappingNode.intersectedY);

                        //check whether testY1 is within center square boundary 
                        if(testY1 >= oneThirdHeight && testY1 <= twoThirdsHeight) {
                            intersectedX1 = mappingNode.intersectedX;
                            intersectedY1 = testY1;

                            intersectedX2 = testX2 - oneThirdWidth;
                            intersectedY2 = testY2 - oneThirdHeight;

                            intersectedX3 = intersectedX1 - oneThirdWidth;
                            intersectedY3 = intersectedY1;

                            intersectedX4 = testX2 - oneThirdWidth;
                            intersectedY4 = testY2;
                        }
                        else if(testX2 >= oneThirdWidth && testX2 <= twoThirdsWidth) {
                            intersectedX1 = testX2;
                            intersectedY1 = mappingNode.intersectedY;

                            intersectedX2 = testX1 - oneThirdWidth;
                            intersectedY2 = testY1 - oneThirdHeight;      
                            
                            intersectedX3 = intersectedX1;
                            intersectedY3 = intersectedY1 - oneThirdHeight;

                            intersectedX4 = testX1;
                            intersectedY4 = testY1 - oneThirdHeight;
                        }
                    }
                    //bottom-left corner
                    else if(mappingNode.intersectedX == oneThirdWidth && mappingNode.intersectedY == twoThirdsHeight) {
                        let testX1: number = mappingNode.intersectedX;
                        let testY1: number = this.getYGivenXAndSrcnodesInContext(sourceX, sourceY, 
                            mappingNode.x, mappingNode.y, mappingNode.intersectedX);
                        
                        let testY2: number = mappingNode.intersectedY;
                        let testX2: number = this.getXGivenYAndSrcnodesInContext(sourceX, sourceY,
                                mappingNode.x, mappingNode.y, mappingNode.intersectedY);

                        //check whether testY1 is within center square boundary 
                        if(testY1 >= oneThirdHeight && testY1 <= twoThirdsHeight) {
                            intersectedX1 = mappingNode.intersectedX;
                            intersectedY1 = testY1;

                            intersectedX2 = testX2 + oneThirdWidth;
                            intersectedY2 = testY2 - oneThirdHeight;

                            intersectedX3 = intersectedX1 + oneThirdWidth;
                            intersectedY3 = intersectedY1;

                            intersectedX4 = testX2 + oneThirdWidth;
                            intersectedY4 = testY2;
                        }
                        else if(testX2 >= oneThirdWidth && testX2 <= twoThirdsWidth) {
                            intersectedX1 = testX2;
                            intersectedY1 = mappingNode.intersectedY;

                            intersectedX2 = testX1 + oneThirdWidth;
                            intersectedY2 = testY1 - oneThirdHeight;                            

                            intersectedX3 = intersectedX1;
                            intersectedY3 = intersectedY1 - oneThirdHeight;

                            intersectedX4 = testX1;
                            intersectedY4 = testY1 - oneThirdHeight;
                        }
                    }
                }
                else if(mappingNode.intersectedX != 0) {
                    intersectedX1 = mappingNode.intersectedX;
                    intersectedY1 = this.getYGivenXAndSrcnodesInContext(sourceX, sourceY, 
                        mappingNode.x, mappingNode.y, mappingNode.intersectedX);
                    intersectedX2 = mappingNode.intersectedX == oneThirdWidth ? twoThirdsWidth : oneThirdWidth;
                    intersectedY2 = intersectedY1;
                }
                else if(mappingNode.intersectedY != 0) {
                    intersectedY1 = mappingNode.intersectedY;
                    intersectedX1 = this.getXGivenYAndSrcnodesInContext(sourceX, sourceY,
                        mappingNode.x, mappingNode.y, mappingNode.intersectedY);

                    intersectedX2 = intersectedX1;
                    intersectedY2 = mappingNode.intersectedY == oneThirdHeight ? twoThirdsHeight : oneThirdHeight;
                }   
                let tmpDistanceBtnSourceAndIntersectPt1: number = this.findEuclideanDistance(intersectedX1, intersectedY1, sourceX, sourceY);
                let tmpDistanceBtnTargetAndIntersectPt2: number = this.findEuclideanDistance(intersectedX2, intersectedY2, targetX, targetY);
                
                let diffFromIdealDistance = Math.abs(tmpDistanceBtnSourceAndIntersectPt1 + tmpDistanceBtnTargetAndIntersectPt2 - idealDistance);

                //compute sum of two edge segment for wrapping on adjacent squares
                if((mappingNode.intersectedX == 0 || mappingNode.intersectedY == 0) &&
                    minDiffFromIdealDistance > diffFromIdealDistance) {
                    
                    if(mappingNode.intersectedX != 0 || mappingNode.intersectedY != 0) {
                        minDiffFromIdealDistance = diffFromIdealDistance;
                        results.edgeLength = tmpDistanceBtnSourceAndIntersectPt1 + tmpDistanceBtnTargetAndIntersectPt2;
                        results.minDiffFromIdealDistance = minDiffFromIdealDistance;
                        intersectionPoints.splice(0,intersectionPoints.length);
                        intersectionPoints.push({"x":intersectedX1, "y":intersectedY1});
                        intersectionPoints.push({"x":intersectedX2, "y":intersectedY2});
                    }                    
                }    
                //compute sum of three edge segment for wrapping on corner squares
                else if((mappingNode.intersectedX != 0 && mappingNode.intersectedY != 0)) {
                        let tmpDistanceBtnIntersectPt3Pt4: number = this.findEuclideanDistance(
                            intersectedX3, intersectedY3, intersectedX4, intersectedY4);

                        diffFromIdealDistance = Math.abs(tmpDistanceBtnSourceAndIntersectPt1 + tmpDistanceBtnTargetAndIntersectPt2 + tmpDistanceBtnIntersectPt3Pt4 - idealDistance);

                        if(minDiffFromIdealDistance > diffFromIdealDistance) {
                            minDiffFromIdealDistance = diffFromIdealDistance;
                            results.edgeLength = tmpDistanceBtnSourceAndIntersectPt1 + tmpDistanceBtnTargetAndIntersectPt2 + tmpDistanceBtnIntersectPt3Pt4;
                            results.minDiffFromIdealDistance = minDiffFromIdealDistance;
                            intersectionPoints.splice(0,intersectionPoints.length);
                            intersectionPoints.push({"x":intersectedX1, "y":intersectedY1});
                            intersectionPoints.push({"x":intersectedX2, "y":intersectedY2});
                            intersectionPoints.push({"x":intersectedX3, "y":intersectedY3});
                            intersectionPoints.push({"x":intersectedX4, "y":intersectedY4});
                        }       
                }              
            }
        }
        return intersectionPoints;
    }

    private getYGivenXAndSrcnodesInContext(x1: number, y1: number, x2: number, y2: number, x: number): number {
        let y: number = 0;
        if(x1 == x2)
            y = (y1+y2)/2;
        else {
            y = (x2*y1-x*y1-x1*y2+x*y2)/(x2-x1);
        }
        return y;
    }

    private getXGivenYAndSrcnodesInContext(x1: number, y1: number, x2: number, y2: number, y: number): number {
        let x: number = 0;
        if(y1 == y2)
            x = (x1+x2)/2;
        else {
            x = (x1*y2-x2*y1-x1*y+x2*y)/(y2-y1);
        }
        return x;
    }

    public wrappingNode(graph: any, oneThirdWidth: number, twoThirdsWidth: number, oneThirdHeight: number, twoThirdsHeight: number): void{
        for(let node of graph.nodes) {
            if(node.x > twoThirdsWidth) {
                node.x -= oneThirdWidth;
            }            
            else if(node.x < oneThirdWidth) {
                node.x += oneThirdWidth;
            }

            if(node.y > twoThirdsHeight) {
                node.y -= oneThirdHeight;
            }
            else if(node.y < oneThirdHeight) {
                node.y += oneThirdHeight;
            }
        }

        for(let link of graph.links) {
            if(link.source.x > twoThirdsWidth) {
                link.source.x -= oneThirdWidth;
                while (link.source.x > twoThirdsWidth)
                    link.source.x -= oneThirdWidth;
            }            
            else if(link.source.x < oneThirdWidth) {
                link.source.x += oneThirdWidth;
                while (link.source.x < oneThirdWidth)
                    link.source.x += oneThirdWidth;
            }

            if(link.source.y > twoThirdsHeight) {
                link.source.y -= oneThirdHeight;
                while (link.source.y > twoThirdsHeight)
                    link.source.y -= oneThirdHeight;                
            }
            else if(link.source.y < oneThirdHeight) {
                link.source.y += oneThirdHeight;
                while (link.source.y < oneThirdHeight)
                    link.source.y += oneThirdHeight;
            }

            if(link.target.x > twoThirdsWidth) {
                link.target.x -= oneThirdWidth;
                while (link.target.x > twoThirdsWidth)
                    link.target.x -= oneThirdWidth;
            }            
            else if(link.target.x < oneThirdWidth) {
                link.target.x += oneThirdWidth;
                while (link.target.x < oneThirdWidth)
                    link.target.x += oneThirdWidth;
            }

            if(link.target.y > twoThirdsHeight) {
                link.target.y -= oneThirdHeight;
                while (link.target.y > twoThirdsHeight)
                    link.target.y -= oneThirdHeight;                
            }
            else if(link.target.y < oneThirdHeight) {
                link.target.y += oneThirdHeight;
                while (link.target.y < oneThirdHeight)
                    link.target.y += oneThirdHeight;
            }
        }
    }

    private transform(graph: any, offsetX: number, offsetY: number){
        for (let node of graph.nodes){
            node.x += offsetX;
            node.y += offsetY;
        }        
    }
}