import * as d3 from 'd3';
import { AreaClassCode } from './torus-layout-view-controller';
import { TorusLayoutViewController } from './torus-layout-view-controller';

export class TorusLayoutView {
    private torusLayoutViewController: TorusLayoutViewController;
    private data_boundaries: Array<any>;
    private optionalBoundary: Array<any>;
    private twoEdgeWrappingGraph: any;
    private threeEdgeWrappingGraph: any;
    private wrappingNodeLabel: Array<any>;
    private configuration: any;
    private graph: any;
    private bEnableTorusWrapping: boolean;
    private bDisplayContextConfig: Array<boolean>;
    private notifyInitRender: any;
    private notifyUpdateRender: any;
    private borders: Array<any>;
    private vertical_borders: Array<any>;
    private horizontal_borders: Array<any>;
    private boundaryObject: any;
    private optionalBoundaryObject: any;
    private optionalBoundaryMargin: number = 100;
    
    constructor(graph: any, configuration: any, 
        bEnableTorusWrapping: boolean, notifyInitRender: any, notifyUpdateRender: any, bDisplayContextConfig: Array<boolean>){
        this.init(graph, configuration, bEnableTorusWrapping, notifyInitRender, notifyUpdateRender, bDisplayContextConfig);
    }

    public initConfig(graph: any, configuration: any, 
        bEnableTorusWrapping: boolean, notifyInitRender: any, notifyUpdateRender: any, bDisplayContextConfig: Array<boolean>) {

        this.configuration = configuration;

        this.boundaryObject = {
            "oneThirdWidth": configuration.svgWidth/3,
            "twoThirdsWidth": configuration.svgWidth*2/3,
            "oneThirdHeight": configuration.svgHeight/3,
            "twoThirdsHeight": configuration.svgHeight*2/3
        };

        this.optionalBoundaryObject = {
            "oneThirdWidth": configuration.svgWidth/3-this.optionalBoundaryMargin,
            "twoThirdsWidth": configuration.svgWidth*2/3+this.optionalBoundaryMargin,
            "oneThirdHeight": configuration.svgHeight/3-this.optionalBoundaryMargin,
            "twoThirdsHeight": configuration.svgHeight*2/3+this.optionalBoundaryMargin
        };

        this.graph = graph;
        this.twoEdgeWrappingGraph = {
            "nodes":[
                
              ],
              "links":[                
              ]
        }

		this.threeEdgeWrappingGraph = {
            "nodes":[
                
            ],
            "links":[                
            ]
        }
        
        this.wrappingNodeLabel = new Array<any>();

        this.bEnableTorusWrapping = bEnableTorusWrapping;
        this.bDisplayContextConfig = bDisplayContextConfig;
        this.notifyInitRender = notifyInitRender;
        this.notifyUpdateRender = notifyUpdateRender;

        this.torusLayoutViewController = new TorusLayoutViewController(this.graph);

        this.borders = new Array<any>();
        this.horizontal_borders = new Array<any>();
        this.vertical_borders = new Array<any>();
        this.borders.push({"x1":0, "y1":0, "x2":configuration.svgWidth, "y2":0, "strokeWidth":1});
        this.borders.push({"x1":0, "y1":0, "x2":0, "y2":configuration.svgHeight, "strokeWidth":1});

        this.horizontal_borders.push({"x1":0, "y1":configuration.svgHeight, "x2":configuration.svgWidth, "y2":configuration.svgHeight, "strokeWidth":1});

        this.vertical_borders.push({"x1":configuration.svgWidth, "y1":0, "x2":configuration.svgWidth, "y2":configuration.svgHeight, "strokeWidth":1});

        this.data_boundaries = new Array<any>();
        this.data_boundaries.push({"x1":this.boundaryObject.oneThirdWidth, "y1":0, "x2":this.boundaryObject.oneThirdWidth, "y2":configuration.svgHeight, "strokeWidth":1});
        this.data_boundaries.push({"x1":this.boundaryObject.twoThirdsWidth, "y1":0, "x2":this.boundaryObject.twoThirdsWidth, "y2":configuration.svgHeight, "strokeWidth":1});
        this.data_boundaries.push({"x1":0, "y1":this.boundaryObject.oneThirdHeight, "x2":configuration.svgWidth, "y2":this.boundaryObject.oneThirdHeight, "strokeWidth":1});
        this.data_boundaries.push({"x1":0, "y1":this.boundaryObject.twoThirdsHeight, "x2":configuration.svgWidth, "y2":this.boundaryObject.twoThirdsHeight, "strokeWidth":1});
        this.data_boundaries.push({"x1":this.boundaryObject.oneThirdWidth, "y1":this.boundaryObject.oneThirdHeight, "x2":this.boundaryObject.twoThirdsWidth, "y2":this.boundaryObject.oneThirdHeight, "strokeWidth":5});
        this.data_boundaries.push({"x1":this.boundaryObject.oneThirdWidth, "y1":this.boundaryObject.twoThirdsHeight, "x2":this.boundaryObject.twoThirdsWidth, "y2":this.boundaryObject.twoThirdsHeight, "strokeWidth":5});

        this.optionalBoundary = new Array<any>();
        this.optionalBoundary.push({"x1":this.optionalBoundaryObject.oneThirdWidth, "y1":this.optionalBoundaryObject.oneThirdHeight, "x2":this.optionalBoundaryObject.oneThirdWidth, "y2":this.optionalBoundaryObject.twoThirdsHeight, "strokeWidth":1});
        this.optionalBoundary.push({"x1":this.optionalBoundaryObject.oneThirdWidth, "y1":this.optionalBoundaryObject.twoThirdsHeight, "x2":this.optionalBoundaryObject.twoThirdsWidth, "y2":this.optionalBoundaryObject.twoThirdsHeight, "strokeWidth":1});
        this.optionalBoundary.push({"x1":this.optionalBoundaryObject.twoThirdsWidth, "y1":this.optionalBoundaryObject.twoThirdsHeight, "x2":this.optionalBoundaryObject.twoThirdsWidth, "y2":this.optionalBoundaryObject.oneThirdHeight, "strokeWidth":1});
        this.optionalBoundary.push({"x1":this.optionalBoundaryObject.twoThirdsWidth, "y1":this.optionalBoundaryObject.oneThirdHeight, "x2":this.optionalBoundaryObject.oneThirdWidth, "y2":this.optionalBoundaryObject.oneThirdHeight, "strokeWidth":1});
    }

    public init(graph: any, configuration: any, 
        bEnableTorusWrapping: boolean, notifyInitRender: any, notifyUpdateRender: any, bDisplayContextConfig: Array<boolean>): void {
        
        this.initConfig(graph, configuration, bEnableTorusWrapping, notifyInitRender, notifyUpdateRender, bDisplayContextConfig);
        
        //initialize element in svg group
        let svg = d3.select("#mainSvg");
        let svgGroup = svg.selectAll(".draggableGroup")
            .data([{"x": 0, "y": 0}])
            .enter()
            .append("g")
            .attr("class", "draggableGroup" + " cleanOnInit")
            .attr("id", "parentGroup")
            .attr("draggable", true);

        svgGroup
            .selectAll(".background")
            .data([{"x": 0, "y": 0}])
            .enter()
            .append("rect")
            .attr("x", this.configuration.originX)
            .attr("y", this.configuration.originY)
            .attr("rx", 0)
            .attr("ry", 0)
            .attr("fill-opacity", 0)
            .attr("width", this.configuration.width)
            .attr("height", this.configuration.height)
            .attr("class", "background" + " cleanOnInit")
            .style("stroke", "black")
            .style("fill", "white")
            .lower();

        this.torusLayoutViewController.applyGroupDraggableBehaviour(d3.selectAll("#parentGroup").node(),
            this.graph, this.configuration, this.boundaryObject,
            (shiftX: number, shiftY: number, areaClassName: string): void => {
                this.updateRender(shiftX, shiftY, areaClassName, this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
            },
            ()=>{
                this.torusLayoutViewController.computeWrappingGraphForRendering(this.graph, this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph,
                    this.bEnableTorusWrapping, this.boundaryObject.oneThirdWidth, this.boundaryObject.twoThirdsWidth,
                    this.boundaryObject.oneThirdHeight, this.boundaryObject.twoThirdsHeight, this.wrappingNodeLabel);
            }); 
    }

    public initTorusLayout(){
        let svg = d3.select("#mainSvg");
        
        let verticalBoundary = new Array();
        verticalBoundary.push({"x1":this.boundaryObject.oneThirdWidth, "y1":this.boundaryObject.oneThirdHeight, "x2":this.boundaryObject.oneThirdWidth, "y2":this.boundaryObject.twoThirdsHeight, "strokeWidth":5});
        verticalBoundary.push({"x1":this.boundaryObject.twoThirdsWidth, "y1":this.boundaryObject.oneThirdHeight, "x2":this.boundaryObject.twoThirdsWidth, "y2":this.boundaryObject.twoThirdsHeight, "strokeWidth":5});

        if(this.bDisplayContextConfig[0] == true || this.bDisplayContextConfig[1] == true) {
            svg.selectAll(".verticalBoundary")
                .data(verticalBoundary)
                .enter()
                .append("line")
                .attr("x1", (d) => {return d.x1;})
                .attr("y1", (d) => {return d.y1;})
                .attr("x2", (d) => {return d.x2;})
                .attr("y2", (d) => {return d.y2;})
                .attr("class", "verticalBoundary" + " cleanOnInit")
                .style("stroke", "#BED7F6")
                .style("stroke-width", (d) => {return d.strokeWidth;});

            svg.selectAll(".bourndary")
                .data(this.data_boundaries)
                .enter()
                .append("line")
                .attr("x1", (d) => {return d.x1;})
                .attr("y1", (d) => {return d.y1;})
                .attr("x2", (d) => {return d.x2;})
                .attr("y2", (d) => {return d.y2;})
                .lower()
                .attr("class", "bourndary" + " cleanOnInit")
                .style("stroke", "#BED7F6")
                .style("stroke-width", (d) => {return d.strokeWidth;});

            svg.selectAll(".border")
                .data(this.borders)
                .enter()
                .append("line")
                .attr("x1", (d) => {return d.x1;})
                .attr("y1", (d) => {return d.y1;})
                .attr("x2", (d) => {return d.x2;})
                .attr("y2", (d) => {return d.y2;})
                .attr("class", "border" + " cleanOnInit")
                .style("stroke", "#BED7F6")
                .style("stroke-width", (d) => {return d.strokeWidth;});    

            svg.selectAll(".horizontal_border")
                .data(this.horizontal_borders)
                .enter()
                .append("line")
                .attr("x1", (d) => {return d.x1;})
                .attr("y1", (d) => {return d.y1;})
                .attr("x2", (d) => {return d.x2;})
                .attr("y2", (d) => {return d.y2;})
                .attr("class", "horizontal_border" + " cleanOnInit")
                .style("stroke", "#BED7F6")
                .style("stroke-width", (d) => {return d.strokeWidth;});

            svg.selectAll(".vertical_border")
                .data(this.vertical_borders)
                .enter()
                .append("line")
                .attr("x1", (d) => {return d.x1;})
                .attr("y1", (d) => {return d.y1;})
                .attr("x2", (d) => {return d.x2;})
                .attr("y2", (d) => {return d.y2;})
                .attr("class", "vertical_border" + " cleanOnInit")
                .style("stroke", "#BED7F6")
                .style("stroke-width", (d) => {return d.strokeWidth;});    
        }    

        //initialise Torus layout
        this.torusLayoutViewController.computeWrappingGraphForRendering(this.graph, this.twoEdgeWrappingGraph,
            this.threeEdgeWrappingGraph, this.bEnableTorusWrapping, this.boundaryObject.oneThirdWidth, this.boundaryObject.twoThirdsWidth,
            this.boundaryObject.oneThirdHeight, this.boundaryObject.twoThirdsHeight, this.wrappingNodeLabel);

        this.initRender(svg, 0, 0, AreaClassCode._center.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, -this.boundaryObject.oneThirdWidth, 0, AreaClassCode._left.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, -this.boundaryObject.oneThirdWidth, -this.boundaryObject.oneThirdHeight, AreaClassCode._upper_left.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, 0, -this.boundaryObject.oneThirdHeight, AreaClassCode._top.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, this.boundaryObject.oneThirdWidth, -this.boundaryObject.oneThirdHeight, AreaClassCode._upper_right.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, this.boundaryObject.oneThirdWidth, 0, AreaClassCode._right.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, this.boundaryObject.oneThirdWidth, this.boundaryObject.oneThirdHeight, AreaClassCode._bottom_right.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, 0, this.boundaryObject.oneThirdHeight, AreaClassCode._bottom.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
        this.initRender(svg, -this.boundaryObject.oneThirdWidth, this.boundaryObject.oneThirdHeight, AreaClassCode._bottom_left.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph);
    }

    public initRender(svg: any, shiftX: number, shiftY: number, areaClassName: string,
            twoEdgeWrappingGraph: any, threeEdgeWrappingGraph: any): void{
        if(this.bDisplayContextConfig[0] || areaClassName == AreaClassCode._center.toString()) {
            svg.selectAll(".twoEdgeWrappingNode" + areaClassName)
                .data(twoEdgeWrappingGraph.nodes)
            .enter().append("circle")
                .attr("class", "twoEdgeWrappingNode" + areaClassName +" cleanOnInit")
                .attr("r", 5)
                .attr("cx", (d: any)=>{return d.x + shiftX;})
                .attr("cy", (d: any)=>{return d.y + shiftY;})
                .attr("stroke", "black") 
                .style("fill", "#FFFFFF")  
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });        

            svg.selectAll(".twoEdgeWrappingLink" + areaClassName)
                .data(twoEdgeWrappingGraph.links)
            .enter().append("line")
                .attr("class", "twoEdgeWrappingLink" + areaClassName +" cleanOnInit")
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            svg.selectAll(".threeEdgeWrappingNode" + areaClassName)
                .data(threeEdgeWrappingGraph.nodes)
            .enter().append("circle")
                .attr("class", "threeEdgeWrappingNode" + areaClassName +" cleanOnInit")
                .attr("r", 5)
                .attr("cx", (d: any)=>{return d.x + shiftX;})
                .attr("cy", (d: any)=>{return d.y + shiftY;})
                .attr("stroke", "black") 
                .style("fill", "#FFFFFF") 
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });        

            svg.selectAll(".threeEdgeWrappingLink" + areaClassName)
                .data(threeEdgeWrappingGraph.links)
            .enter().append("line")
                .attr("class", "threeEdgeWrappingLink" + areaClassName +" cleanOnInit")
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            this.notifyInitRender(areaClassName);
        }        
    }

    public updateTorusLayout(): void {
        let svg = d3.select("#mainSvg");

        this.torusLayoutViewController.computeWrappingGraphForRendering(this.graph, this.twoEdgeWrappingGraph,
            this.threeEdgeWrappingGraph, this.bEnableTorusWrapping, this.boundaryObject.oneThirdWidth, this.boundaryObject.twoThirdsWidth,
            this.boundaryObject.oneThirdHeight, this.boundaryObject.twoThirdsHeight, this.wrappingNodeLabel);

        //center
        this.updateRender(0, 0, AreaClassCode._center.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);

        //surrounding squares
        //left
        this.updateRender(-this.boundaryObject.oneThirdWidth, 0, AreaClassCode._left.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //upper-left
        this.updateRender(-this.boundaryObject.oneThirdWidth, -this.boundaryObject.oneThirdHeight, AreaClassCode._upper_left.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //top
        this.updateRender(0, -this.boundaryObject.oneThirdHeight, AreaClassCode._top.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //upper-right
        this.updateRender(this.boundaryObject.oneThirdWidth, -this.boundaryObject.oneThirdHeight, AreaClassCode._upper_right.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //right
        this.updateRender(this.boundaryObject.oneThirdWidth, 0, AreaClassCode._right.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //bottom-right
        this.updateRender(this.boundaryObject.oneThirdWidth, this.boundaryObject.oneThirdHeight, AreaClassCode._bottom_right.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //bottom
        this.updateRender(0, this.boundaryObject.oneThirdHeight, AreaClassCode._bottom.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
        //bottom-left
        this.updateRender(-this.boundaryObject.oneThirdWidth, this.boundaryObject.oneThirdHeight, AreaClassCode._bottom_left.toString(), this.twoEdgeWrappingGraph, this.threeEdgeWrappingGraph, this.wrappingNodeLabel);
    }

    public updateRender(shiftX: number, shiftY: number, areaClassName: string, twoEdgeWrappingGraph: any, threeEdgeWrappingGraph: any, wrappingNodeLabel: Array<any>) {
        let svg = d3.select("#mainSvg");

        if(this.bDisplayContextConfig[0] || areaClassName == AreaClassCode._center.toString()) {
            let twoEdgeWrappingNode = svg.selectAll(".twoEdgeWrappingNode" + areaClassName)
            .data(twoEdgeWrappingGraph.nodes);

            let twoEdgeWrappingNodeLabel = svg.selectAll(".wrappingNodeLabel" + areaClassName)
                .data(wrappingNodeLabel);

            svg.selectAll(".wrappingNodeLabel" + areaClassName)
                .data(wrappingNodeLabel);

            let twoEdgeWrappingLink = svg.selectAll(".twoEdgeWrappingLink" + areaClassName)
                .data(twoEdgeWrappingGraph.links);

            //update
            twoEdgeWrappingNode
                .attr("cx", (d: any)=>{return d.x + shiftX;})
                .attr("cy", (d: any)=>{return d.y + shiftY;})
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            //enter
            twoEdgeWrappingNode 
            .enter().append("circle")
                .attr("class", "twoEdgeWrappingNode" + areaClassName +" cleanOnInit")
                .attr("r", 4)
                .attr("cx", (d: any)=>{return d.x + shiftX;})
                .attr("cy", (d: any)=>{return d.y + shiftY;})
                .attr("stroke", "black") 
                .style("fill", "#FFFFFF")
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            //exit
            twoEdgeWrappingNode
            .exit().remove();

            if(this.bDisplayContextConfig[1] && areaClassName == AreaClassCode._center.toString()) {
                //update
                twoEdgeWrappingNodeLabel
                    .attr("x", (d)=>{return 10+d.x + shiftX;})
                        .attr("y", (d)=>{return 10+d.y + shiftY;})
                        .text((d) => { 
                        if(d.name != undefined)          
                            return d.name;       
                        })      
                        .style("visibility", function (d) {
                        return d.visible == true ? "visible" : "hidden";
                    });

                //enter
                twoEdgeWrappingNodeLabel
                .enter().append("text")
                    .attr("class", "wrappingNodeLabel" + areaClassName +" cleanOnInit")
                    .attr("x", (d)=>{return 10+d.x + shiftX;})
                    .attr("y", (d)=>{return 10+d.y + shiftY;})
                    .text((d) => { 
                    if(d.name != undefined)          
                        return d.name;       
                    })      
                    .style("visibility", function (d) {
                    return d.visible == true ? "visible" : "hidden";
                });

                //exit
                twoEdgeWrappingNodeLabel
                .exit().remove();
            }
            //update
            twoEdgeWrappingLink 
                .attr("x1", function (d: any) { return d.x1 + shiftX; })
                .attr("y1", function (d: any) { return d.y1 + shiftY; })
                .attr("x2", function (d: any) { return d.x2 + shiftX; })
                .attr("y2", function (d: any) { return d.y2 + shiftY; })
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            //enter
            twoEdgeWrappingLink
            .enter().append("line")                
                .attr("class", "twoEdgeWrappingLink" + areaClassName +" cleanOnInit")
                .attr("x1", function (d: any) { return d.x1 + shiftX; })
                .attr("y1", function (d: any) { return d.y1 + shiftY; })
                .attr("x2", function (d: any) { return d.x2 + shiftX; })
                .attr("y2", function (d: any) { return d.y2 + shiftY; })
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });
                
                
            //exit
            twoEdgeWrappingLink
            .exit().remove();
            
            let threeEdgeWrappingNode = svg.selectAll(".threeEdgeWrappingNode" + areaClassName)
                .data(threeEdgeWrappingGraph.nodes);

            let threeEdgeWrappingLink = svg.selectAll(".threeEdgeWrappingLink" + areaClassName)
                .data(threeEdgeWrappingGraph.links);

            //update
            threeEdgeWrappingNode
                .attr("cx", (d: any)=>{return d.x + shiftX;})
                .attr("cy", (d: any)=>{return d.y + shiftY;})
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            //enter
            threeEdgeWrappingNode 
            .enter().append("circle")
                .attr("class", "threeEdgeWrappingNode" + areaClassName +" cleanOnInit")
                .attr("r", 4)
                .attr("cx", (d: any)=>{return d.x + shiftX;})
                .attr("cy", (d: any)=>{return d.y + shiftY;})
                .attr("stroke", "black") 
                .style("fill", "#FFFFFF")
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            //exit
            threeEdgeWrappingNode
            .exit().remove();


            //update
            threeEdgeWrappingLink 
                .attr("x1", function (d: any) { return d.x1 + shiftX; })
                .attr("y1", function (d: any) { return d.y1 + shiftY; })
                .attr("x2", function (d: any) { return d.x2 + shiftX; })
                .attr("y2", function (d: any) { return d.y2 + shiftY; })
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });

            //enter
            threeEdgeWrappingLink
            .enter().append("line")                
                .attr("class", "threeEdgeWrappingLink" + areaClassName +" cleanOnInit")
                .attr("x1", function (d: any) { return d.x1 + shiftX; })
                .attr("y1", function (d: any) { return d.y1 + shiftY; })
                .attr("x2", function (d: any) { return d.x2 + shiftX; })
                .attr("y2", function (d: any) { return d.y2 + shiftY; })
                .style("visibility", function (d: any) {
                    return d.visible == true ? "visible" : "hidden";
                });            
                
            //exit
            threeEdgeWrappingLink
            .exit().remove();

            if(areaClassName != AreaClassCode._center.toString()) {
                twoEdgeWrappingNode.style("opacity", 0.3);
                twoEdgeWrappingLink.style("opacity", 0.3);
                threeEdgeWrappingNode.style("opacity", 0.3);
                threeEdgeWrappingLink.style("opacity", 0.3);
            }
            this.notifyUpdateRender(shiftX, shiftY, areaClassName);  
        }   
        else {
            let twoEdgeWrappingNode = svg.selectAll(".twoEdgeWrappingNode" + areaClassName);
            let twoEdgeWrappingLink = svg.selectAll(".twoEdgeWrappingLink" + areaClassName);
               
            twoEdgeWrappingNode.remove();
            twoEdgeWrappingLink.remove();

            let twoEdgeWrappingNodeLabel = svg.selectAll(".wrappingNodeLabel" + areaClassName)
            twoEdgeWrappingNodeLabel.remove();

            let threeEdgeWrappingNode = svg.selectAll(".threeEdgeWrappingNode" + areaClassName);            
            let threeEdgeWrappingLink = svg.selectAll(".threeEdgeWrappingLink" + areaClassName);

            threeEdgeWrappingNode.remove();
            threeEdgeWrappingLink.remove();
        }           

        if(!this.bEnableTorusWrapping || !this.bDisplayContextConfig[1]) {
            let twoEdgeWrappingNodeLabel = svg.selectAll(".wrappingNodeLabel" + areaClassName)
            twoEdgeWrappingNodeLabel.remove();
        }
    }
}