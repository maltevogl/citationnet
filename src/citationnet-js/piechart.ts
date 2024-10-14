import { StatDict, PieChartEntry, CitationNet, fieldColorDict } from "./citationnet";
import * as d3 from "d3";

export interface FieldChartInterface extends Object {
    makeSVG():void;
    citationnet: CitationNet;
    width: number;
    height: number;
    radius:number;
    dataset: StatDict[];
}

export class FieldChart {

    width: number;
    height: number;
    radius:number;
    dataset:StatDict[];

    constructor(citationet: CitationNet, width:number, height:number) {
        this.width = width;
        this.height = height;
        this.dataset = citationet.getFieldStatistics();
        this.radius = Math.min(width, height) / 2;
    }

    makeSVG() {
        const pie = d3.pie().sort(null).value(d => d.value);
        const arc = d3.arc().innerRadius(80).outerRadius(Math.min(this.width, this.height) / 2 - 1);
        const labelRadius = arc.outerRadius()() * 0.8;
        const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);

        const arcs = pie(this.dataset);

        const total = this.dataset.reduce(
            (acc, cur) => acc + cur.amount,
            0
        )

        const svg = d3.create("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
            .attr("style", "position:relative; z-index:1; left:92%; bottom: 40%; max-width: 100%; height: auto; font: 12px sans-serif; fill: white");
    
        svg.append("g")
            .attr("stroke", "white")
            .selectAll()
            .data(arcs)
            .join("path")
            .attr("fill", d => fieldColorDict[d.data.field])
            .attr("d", arc)
            .on("mouseover", function(event, d) {
                tooltip.style("opacity", 1);
                tooltip.html(`${d.data.field}: ${d.data.value.toPrecision(2).toLocaleString()} %`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.style("opacity", 0);
            });

        svg.append("text")
            .attr("x", 0)             
            .attr("y", -10)
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .text("Research fields");

        svg.append("text")
            .attr("x", 0)             
            .attr("y", 10)
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .text(`of ${total} documents`);

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

            
        let piediv = document.getElementById("piechart")
        let svgcontent = svg.node()
        console.log(svgcontent);
        if (piediv != null && svgcontent != null) {
            piediv.insertAdjacentElement("beforeend", svgcontent)
        }
    };
}