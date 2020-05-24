import * as d3 from 'd3';
import * as webcola from '../index'
import { AreaClassCode } from './torus-layout-view-controller';
import { TorusLayoutView } from './torus-layout-view';

export class TorusGraphExample {
    private static INSTANCE: TorusGraphExample;

    private cola: any;
    private graph: any;
    
    private bEnableTorusWrapping: boolean = false;

    public bDisplayContextConfig: Array<boolean>;
    public configuration: any;
    private torusLayoutView: TorusLayoutView;
    
    static getInstance(): TorusGraphExample {
        if(TorusGraphExample.INSTANCE == null) {
            TorusGraphExample.INSTANCE = new TorusGraphExample();
        }
        return TorusGraphExample.INSTANCE;
    }

    constructor() {
        d3.select('#intmode')
        .on('change', () => {
            this.init(true);
        });
        d3.select('#questionnum')
        .on('change', () => {
            this.init(true);
        });
        this.init(true);
    }

    private init(bInitConfig: boolean){
        let intmode = d3.select("#intmode").property("value"); //1: td, 2: pc, 3: fc, 4: nl
        let questionnum = d3.select("#questionnum").property("value");

        if((parseInt(questionnum) > 3 && parseInt(questionnum) < 6) || (parseInt(questionnum) > 10 && parseInt(questionnum) < 14)|| (parseInt(questionnum) > 16 && parseInt(questionnum) < 19)) {
			document.getElementById("questiontext").innerHTML = "<strong>Please identify all the friends of the orange node <span style='color: red'>in sorted order</span>.</strong><br />";
		}
		else if((intmode == "2" || intmode == "1" || intmode == "3") && parseInt(questionnum) == 6) {
			document.getElementById("questiontext").innerHTML = "<strong>What is the shortest path between <i>Start</i> and <i>End</i>?</strong><br />";
		}
		else if((intmode == "4") && parseInt(questionnum) == 6) {
			document.getElementById("questiontext").innerHTML = "<strong>Please identify all the friends of the orange node <span style='color: red'>in sorted order</span>.</strong><br />";
		}
		else if(parseInt(questionnum) == 7) {
			document.getElementById("questiontext").innerHTML = "<strong>Please identify the total number of people (nodes).</strong><br />";
		}
		else if(parseInt(questionnum) == 8) {
			document.getElementById("questiontext").innerHTML = "<strong>Please identify the total number of relationships (links).</strong><br />";
		}
		else {
			document.getElementById("questiontext").innerHTML = "<strong>What is the shortest path between <i>Start</i> and <i>End</i>?</strong><br />";
		}
        
        if(bInitConfig) {
            this.configuration = new Object(
                {
                    "originX": 0, 
                    "originY": 0, 
                    "dragStartX":0, 
                    "dragStartY": 0,
                    "width": 30000,//Number.MAX_SAFE_INTEGER,
                    "height": 30000,//Number.MAX_SAFE_INTEGER
                    "svgWidth": 975,
                    "svgHeight": 975                    
                });
        
            this.bDisplayContextConfig = new Array<boolean>();

            if(intmode == 1) { //td
                this.bDisplayContextConfig.push(false);
                this.bDisplayContextConfig.push(true);    
                this.bDisplayContextConfig.push(false); 
                this.bEnableTorusWrapping = true;
            }
            else if(intmode == 2){ //pc
                this.bDisplayContextConfig.push(true);
                this.bDisplayContextConfig.push(false);    
                this.bDisplayContextConfig.push(true); 
                this.bEnableTorusWrapping = true;
            }
            else if(intmode == 3){ //fc
                this.bDisplayContextConfig.push(true);
                this.bDisplayContextConfig.push(false);    
                this.bDisplayContextConfig.push(false); 
                this.bEnableTorusWrapping = true;
            }   
            else if(intmode == 4){ //nl
                this.bDisplayContextConfig.push(false);
                this.bDisplayContextConfig.push(false);    
                this.bDisplayContextConfig.push(false); 
                this.bEnableTorusWrapping = false;
            }   
            if(this.bDisplayContextConfig[1]){
                d3.select("#mainSvg").attr("viewBox", "295 295 385 385");
                d3.select("#mainSvg").attr("width", "385");
                d3.select("#mainSvg").attr("height", "385");
            }
            else if(this.bDisplayContextConfig[0] && this.bDisplayContextConfig[2]){
                d3.select("#mainSvg").attr("viewBox", "225 225 525 525");
                d3.select("#mainSvg").attr("width", "525");
                d3.select("#mainSvg").attr("height", "525");
            }
            else if(this.bDisplayContextConfig[0]) {
                d3.select("#mainSvg").attr("viewBox", "0 0 975 975");
                d3.select("#mainSvg").attr("width", "975");
                d3.select("#mainSvg").attr("height", "975");
            } 
            else {
                d3.select("#mainSvg").attr("viewBox", "0 0 975 975");
                d3.select("#mainSvg").attr("width", "975");
                d3.select("#mainSvg").attr("height", "975");
            }       
        }
        
        d3.select("#mainSvg").selectAll(".cleanOnInit").remove();
        fetch("graphdata/torus/"+String(intmode)+"."+String(parseInt(questionnum))+".json")
            .then(response => response.json())
            .then(graph => {
                //generate a graph based on input number of nodes
                this.generateGraph(graph);

                this.torusLayoutView = new TorusLayoutView(this.graph, this.configuration, this.bEnableTorusWrapping,
                    (areaClassName: string): void =>{
                        this.initRender(areaClassName);
                    },
                    (shiftX: number, shiftY: number, areaClassName: string): void => {
                        this.updateRender(shiftX, shiftY, areaClassName);
                    }, this.bDisplayContextConfig
                    );

                this.cola = webcola.d3adaptor(d3)
                    .linkDistance(this.graph.linkLength)
                    .avoidOverlaps(true)
                    .enableTorusWrapping(this.bEnableTorusWrapping)
                    .size([this.configuration.svgWidth, this.configuration.svgHeight])
                    .nodes(this.graph.nodes)
                    .links(this.graph.links)
                    .on("tick", () => {
                        console.log("tick");        
                        this.torusLayoutView.updateTorusLayout();
                    })
                    .start();
                                
                this.initForm();
                this.initGraphLayout();
        })
        .catch(error => console.error(error))
    }

    private onClick(): void {
        this.init(true);               
    }

    private initForm(){      
        d3.select("#btnUpdate").on("click", ()=>{this.onClick();});        
    }

    private initGraphLayout(){
        this.torusLayoutView.initTorusLayout();
        this.torusLayoutView.updateTorusLayout();
        setTimeout(()=>{
            this.torusLayoutView.updateTorusLayout();
            setTimeout(()=>{
                this.torusLayoutView.updateTorusLayout();
            }, 500);
        }, 500);
    }
    
    private initRender(areaClassName: string): void{
        let svg = d3.select("#mainSvg");
        let color = d3.scaleOrdinal(d3.schemeCategory10);

        if(!this.bDisplayContextConfig[0] && areaClassName != AreaClassCode._center.toString())
            return;

        //rendering nodes and links
        var link = svg.selectAll(".link" + areaClassName)
            .data(this.graph.links)
        .enter().append("line")
            .attr("class", "link" + areaClassName +" cleanOnInit")
            .style("visibility", function (d: any) {
                return "visible";
            });

		let nodeGroup = svg.selectAll(".draggableNodeGroup" + areaClassName)
            .data(this.graph.nodes)
        .enter().append("g")
            .attr("class", "draggableNodeGroup" + areaClassName + " cleanOnInit")
            .style("visibility", function (d: any) {
                return d.visible == true ? "visible" : "hidden";
            })
            .attr("draggable", true)
            .call(this.cola.drag);//()
            

        let node = nodeGroup
        .append("circle")
        .attr("class", "node" + areaClassName +" cleanOnInit")
        .attr("r", (d: any) => {
        if(d.name == "Start" || d.name == "End" || d.id == 4) 
            return 16;
        else
            return 14;
        })
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("stroke", (d: any) => {
        if(d.name == "Start" || d.name == "End" || d.id == 4)
            return "white";
        else
            return "black";
        }) 
        .style("fill", (d: any) => { 
        if(d.name == "Start")
            return "#F9820E";      
        else if(d.id == 4)
            return "#FF7E08";
        else if(d.name == "End")
            return "#187ABB";
        else
            return "#FFFFFF";
        });      

        nodeGroup.append("text")
            .attr("class", "label" + areaClassName + " cleanOnInit")
            .text((d: any) => { return d.name; })
            .attr("fill", (d: any) => {
                if(d.name == "Start" || d.name == "End" || d.id == 4)
                return "white";
                else
                return "black";
            })
            .attr("x", (d: any) => {
            return d.relativeX;
            })
            .attr("y", (d: any) => {
            var that = this;
            return d.relativeY;
            });

        if(areaClassName != AreaClassCode._center.toString()) {
            nodeGroup.style("opacity", 0.5);
            link.style("opacity", 0.3);
        }
    }
    
    private updateRender(shiftX: number, shiftY: number, areaClassName: string){
        let svg = d3.select("#mainSvg");
        
        let nodeGroup = svg.selectAll(".draggableNodeGroup" + areaClassName);
        let link = svg.selectAll(".link" + areaClassName);
        let label = svg.selectAll(".label" + areaClassName);

        //update
        nodeGroup
        .raise()
        .attr("transform", (d: any) => { 
            return "translate("+ (d.x + shiftX) +","+ (d.y + shiftY)+")"; 
        });

        link.attr("x1", (d: any) => { return (d.source.x + shiftX); })
            .attr("y1", (d: any) => { return (d.source.y + shiftY); })
            .attr("x2", (d: any) => { return (d.target.x + shiftX); })
            .attr("y2", (d: any) => { return (d.target.y + shiftY); })
            .style("visibility", (d: any) => {
            return d.visible == true ? "visible" : "hidden";
        });
    }

    private generateGraph(graphData: any): void{
        this.graph = {
            "nodes":[
              
            ],
            "links":[
            ],
            "shortestPath":{},
            "linkLength": 0
        };        

        this.graph.nodes = graphData.graph.nodes;
        for(let i=0; i< graphData.graph.links.length; i++){
            this.graph.links.push({"source":this.graph.nodes[graphData.graph.links[i]["source"]["nodeIndex"]],"target":this.graph.nodes[graphData.graph.links[i]["target"]["nodeIndex"]],
                "visible": graphData.graph.links[i]["visible"]});
        }
        this.graph.shortestPath = graphData.shortestPath;
        this.graph.linkLength = graphData.linkLength;
    }
}

TorusGraphExample.getInstance();