import './citationnet.css';
import { FieldChart } from './piechart';
import ForceGraph3D,{ ForceGraph3DInstance } from '3d-force-graph';
import { forceRadial } from "d3-force";
import * as d3 from "d3";

export type Dictionary<T> = {
    [key: string]: T;
}

export const fieldColorDict: Dictionary<string> = {
    "Agricultural and Biological Sciences": "#808080",
    "Arts and Humanities": "#8b4513",
    "Biochemistry, Genetics and Molecular Biology": "#006400",
    "Business, Management and Accounting": "#808000",
    "Chemical Engineering": "#483d8b", 
    "Chemistry": "#3cb371",
    "Computer Science": "#000080",
    "Decision Sciences": "#9acd32",
    "Dentistry": "#8b008b",
    "Earth and Planetary Sciences": "#ff0000",
    "Economics, Econometrics and Finance": "#ff8c00",
    "Energy": "#ffd700",
    "Engineering": "#0000cd",
    "Environmental Science": "#00ff00",
    "Health Professions": "#00ff7f",
    "Immunology and Microbiology": "#dc143c",
    "Materials Science": "#00ffff",
    "Mathematics": "#00bfff",
    "Medicine": "#ff00ff",
    "Neuroscience": "#db7093",
    "Nursing": "#b0e0e6",
    "Pharmacology, Toxicology and Pharmaceutics": "#ff1493",
    "Physics and Astronomy": "#7b68ee",
    "Psychology": "#ffa07a",
    "Social Sciences": "#ee82ee",
    "Veterinary": "#ffe4b5",
    "Other": "#ffffe7",
};

export interface CiteNode extends Object {
    id: string;
    display_name: string;
    publication_year: number;
    cited_by_count: number;
    topic: string;
    isSource: boolean;
    fz: number;
  };

export interface CiteLink extends Object {
    source: string;
    target: string;
    year: number;
    level: string;
  };

export interface StatDict extends Object {
    field: string
    color: string
    value: number
    amount: number
}

export interface PieChartEntry extends Object {
    data: StatDict
    endAngle: number
    index: number
    padAngle: number
    startAngle: number
    value: number
}

export interface ICitationNet extends Object {

    containerID: string
    graph: ForceGraph3DInstance
    citenodes: CiteNode[]
    citelinks: CiteLink[]

    createNodeLabel(
        node: CiteNode
    ): string
    openNodeInfo(
        node: CiteNode
    ): void
    radialStrengthPerNode(
        node: CiteNode,
        minStrength:number,
        maxStrength:number,
        min:number,
        max:number
    ): number
    view(
        viewPoint:string
    ): void
    setRelativeNodeSize(
        relNodeSize:string
    ):void
    setCylinder(
        radius:number,
        outervalue:number
    ):void
    redraw():void


}

export class CitationNet implements ICitationNet {

    jsondata: string;
    containerID: string;
    graph;
    citenodes: CiteNode[] | any;
    citelinks: CiteLink[] | any;

    constructor(jsondata: string, containerID:string) {
        this.jsondata = jsondata;
        this.containerID = containerID;
        this.graph = ForceGraph3D(
            {
                'controlType': 'trackball',
                'rendererConfig': {
                    antialias: false,
                    alpha: false
                }
            });
    };
  
  /**
   * Load data into graph.
   *
   * @returns The current citationnet class.
   */
    loadData() {
        const container = document.getElementById(this.containerID)
        if (container != null) {
            this.graph(container).jsonUrl(this.jsondata)
            this.citenodes = this.graph.graphData().nodes
            this.citelinks = this.graph.graphData().links
            return this
        }
    }

   /**
    * Calculate statistics of fields for current data
    * 
    * @remarks For all different fields of research the number of nodes
    * is calculated. If the percentage of the total number of field nodes
    * is larger then 0.01, the information is added to the statistics. 
    * If not, the nodes of this field are collected to the value Other. 
    * 
    * @returns An array of StatDicts with field name, field color, field percentage and field count
    */

    getFieldStatistics() {
        let data = this.graph.graphData().nodes
        let totalNodes = data.length
        let statistics: StatDict[] = []
        let othervalues: number = 0.0
        for (let field in fieldColorDict) {
            let nodes = data.filter(
                (node: any) => node.topic==field
            )
            if (nodes.length/totalNodes > 0.01) {
                statistics.push(
                    {
                        "field": field,
                        "color": fieldColorDict[field],
                        "value": nodes.length/totalNodes,
                        "amount": nodes.length
                    }
                )
            } else {
                othervalues += nodes.length
            }     
        }
        statistics.push(
            {
                "field": "Other",
                "color": fieldColorDict["Other"],
                "value": othervalues/totalNodes,
                "amount": othervalues
            }
        )
        if (statistics != null) {
            return statistics
        }
    }

  /**
   * Reheat simulation of 3D graph.
   * 
   * @remarks
   * For some parameter changes a reheating is necessary to apply changes.
   *
   * @returns The current citationnet class.
   */
    redraw() {
        this.graph.d3ReheatSimulation()
        this.graph.onEngineStop(() => this.graph.zoomToFit(400))
    }


  /**
   * Changes the point of view on the citationnet.
   *
   * @remarks
   * This function is toggled via the keys 'ArrowUp / ArrowDown'.
   *
   * @param viewPoint: string - Either "top" or "side".
   * @returns The current citationnet class.
   */
    view(viewPoint: string) {
        if (viewPoint == 'top') {
            this.graph.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 500)
            this.graph.camera().up.set(0.0, 1.0, 0.0)
            this.graph.camera().zoom = 2.0
            this.graph.camera().updateProjectionMatrix()
            // this.graph.onEngineStop(() => this.graph.zoomToFit(400))
        } else if (viewPoint == 'side') {
            this.graph.cameraPosition({ x: 0, y: -500, z: 0 }, { x: 0, y: 0, z: 0 }, 500)
            this.graph.camera().up.set(0.0, 0.0, 1.0)
            this.graph.camera().zoom = 1.0
            this.graph.camera().updateProjectionMatrix()
            // this.graph.onEngineStop(() => this.graph.zoomToFit(400))
        }
    }

  /**
   * Opens an info box of the clicked node with a link to OpenAlex data.
   *
   * @remarks
   * This function is used as 'onclick'. The box stays visible for 10 sec.
   *
   * @param node: The current node.
   * @returns None
   */
    openNodeInfo(node: CiteNode) {
        let content = document.getElementById("content")
        if (content != null) {
            let infobox = content.appendChild(document.createElement("div"))
            const id = Math.random().toString(16).slice(2);
            infobox.id = `infobox-${id}`
            let infotext = this.createNodeLabel(node)
            let openalexID = (typeof node.id !== 'undefined') ? node.id : node.display_name
            const openalexLink = `</br><a href="https://openalex.org/works/${openalexID}" target="_blank">View in OpenAlex.</a>`
            infobox.innerText = infotext
            infobox.insertAdjacentHTML('beforeend', openalexLink)
            infobox.className = "show"
            setTimeout( function() {
                document.getElementById(`infobox-${id}`).remove();
            }, 10000);
        }
    }

  /**
   * Creates the string for hover- and infobox.
   *
   * @param node: The current node.
   * @returns A string with node information.
   */
    createNodeLabel(node: CiteNode) {
        let openalexID = (typeof node.id !== 'undefined') ? node.id : node.display_name;
        let field = (typeof node.topic !== 'undefined') ? ", Field: " + node.topic : "No field.";
        return `${openalexID} @ ${node.publication_year}\n cited ${node['cited_by_count']} times${field}`;
    }

  /**
   * Calculate the radial strength for each node based on its citation count.
   *
   * @param node: The current node.
   * @param [minStrength=0.0] The minimal strength as a float number.
   * @param [maxStrength=1.0] The maximal strength as a float number.
   * @param [min=5.0] The minimal citation count,  can be used to create a "hole" in the cylinder
   * @param [max=1000] The maximal value of the citation count to be considered in the force.
   * 
   * @returns A float number between min and max strength.
   */
    radialStrengthPerNode(node: CiteNode, minStrength:number =0.0, maxStrength: number = 1.0, min:number = 5.0, max:number = 1000): number {
        let x = node['cited_by_count'];
        let out = minStrength + (x - min) * (maxStrength - minStrength) / (max - min);
        return out <= minStrength ? minStrength
            : out >= maxStrength ? maxStrength
            : out;
    };

  /**
   * Set the cylinder design for nodes.
   * 
   * @remarks Design by applying a radial force to each node that depends 
   * on the number of citations for that node. Minimal force is 2 such that
   * the central node used for querying lies at zero. All publications with 
   * citations larger than the outer value lie on the outer ring.
   *
   * @returns The current citationnet class.
   */
    setCylinder(radius: number = 200, outervalue: number = 500) {
        this.graph
            .d3Force('center', null)
            .d3Force('charge', null)
            .d3Force('radialInner', forceRadial(0).strength(0.1))
            .d3Force('radialOuter',
                forceRadial(radius).strength(
                    (node: any) => this.radialStrengthPerNode(node, 0.0, 1.0, 0.0, outervalue)
                )
            )
    }

  /**
   * Set the main node properties and interaction.
   * 
   * @remarks Nodes are colored by their field with colors defined in
   * the field color dictionary. On mouse hover node labels are shown. 
   * Clicking on a node opens an infobox with a link to the dataset 
   * at OpenAlex.
   *
   */
    setNodeProp() {
        this.graph
            .nodeId('id')
            .nodeRelSize(0.5)
            .nodeOpacity(0.8)
            .enableNodeDrag(false)
            .nodeColor((node:any) => fieldColorDict[node.topic])
            .nodeVal((node:any) => node['cited_by_count'])
            .nodeLabel((node: any) => this.createNodeLabel(node))
            .onNodeClick((node: any) => this.openNodeInfo(node))
    }

  /**
   * Set the strength of links to zero.
   * 
   * @remarks This switches off any spring force layouts. Nodes
   * are therefore arranged on circles with diameter related to 
   * citation count. Each circles z coordinate corresponds to 
   * the publication year. 
   *
   * @returns The current citationnet class.
   */
    setLinkStrength(strength: number = 0.0) {
        let linkforce = this.graph.d3Force('link')
        if (linkforce != null) {
            linkforce.strength(strength)
            return this
        }
    }

      /**
   * Toggle the relative node size.
   * 
   * 
   * @returns The current citationnet class.
   */
    setRelativeNodeSize(relNodeSize: string) {
        if (relNodeSize == 'off') {
            this.graph.nodeVal(1.0);
        }
        else if (relNodeSize == 'on') {
            this.graph.nodeVal((node:any) => node['cited_by_count']);
        }
        return this
    }

    /**
   * Strength function factory to generate the radial strength.
   *
   * @remarks
   * This is a linear interpolation between min and max values for the amount of citations of a node. 
   * The minimally returned strength is 0.0 and the maximal strength is 1.0. All nodes with 2 citations
   * are on the inner-most ring, while all nodes with 1000 or more citations are grouped on the outer ring.
   *
   * @param minStrength, default 0.0
   * @param maxStrength, default 1.0
   * @param min, default 2.0
   * @param max, default 1000.0
   * @returns {function} A function taking the node as an argument and returning a strength between 0.0 and 1.0
   */
    static radialStrength(minStrength: number = 0.0, maxStrength: number = 1.0, min: number = 0, max: number = 1000) {
        let strengthFunc = function (node: CiteNode, i: any, nodes: any) {
            let x = node['cited_by_count'];
            let out = minStrength + (x - min) * (maxStrength - minStrength) / (max - min);
            return out <= minStrength ? minStrength
                : out >= maxStrength ? maxStrength
                : out;
        };
        return strengthFunc;  
    }
}

export function toggleNodeSize(citationnet: CitationNet) {
    let nodeSwitch = document.getElementById("toggleNodeSize") as HTMLInputElement;
    if (nodeSwitch != null && nodeSwitch.checked == true) {
        citationnet.setRelativeNodeSize("on");
    } else if (nodeSwitch != null && nodeSwitch.checked == false) {
        citationnet.setRelativeNodeSize("off");
    }
}

export function toggleGraphView(citationnet: CitationNet) {
    let nodeSwitchTop = document.getElementById("topview") as HTMLInputElement;
    let nodeSwitchSide = document.getElementById("sideview") as HTMLInputElement;
    if (nodeSwitchTop != null && nodeSwitchTop.checked == true) {
        citationnet.view("top");
    } else if (nodeSwitchSide != null && nodeSwitchSide.checked == true) {
        citationnet.view("side");
    }
}

export function toggleView(event:any, citationnet: CitationNet) {
    if (event.code === 'ArrowDown') {
        citationnet.view("side");
    }
    if (event.code === 'ArrowUp') {
        citationnet.view("top");
    }
}

export function changeRelativeNodeSize(citationnet: CitationNet) {
    let slider = document.getElementById("relativeNodeSize") as HTMLInputElement;
    let size = parseFloat(slider.value);
    citationnet.graph.nodeRelSize(size);
}

export function toggleSourceEdges(citationnet: CitationNet) {
    let nodeSwitch = document.getElementById("toggleSourceEdges") as HTMLInputElement;
    let edges = citationnet.graph.graphData().links;
    let nodes = citationnet.graph.graphData().nodes;
    if (nodeSwitch != null && nodeSwitch.checked == true) {
        let sourceNode = citationnet.graph.graphData().nodes.filter((node: any) => node.isSource)[0]
        citationnet.graph.linkVisibility(edge => edge.source.id == sourceNode.id || edge.target.id == sourceNode.id);
    } else if (nodeSwitch != null && nodeSwitch.checked == false) {
        citationnet.graph.linkVisibility(true);
    }
}

export function setCylinderValue(citationnet: CitationNet) {
    let slider1 = document.getElementById("cylinderradius") as HTMLInputElement;
    let radius = parseFloat(slider1.value);
    let slider2 = document.getElementById("maximalcitation") as HTMLInputElement;
    let outervalue = parseFloat(slider2.value);
    citationnet.setCylinder(radius, outervalue)
    citationnet.redraw()
}

export function togglePieChart(citationnet: CitationNet) {
    let selector = document.getElementById("togglePieChart") as HTMLInputElement;
    let piediv = document.getElementById("piechart");
    if (piediv != null && !piediv.getElementsByTagName("svg").length) {
        const chart = new FieldChart(citationnet, 400, 400)
        chart.makeSVG();
    }
    if (selector != null && piediv != null && selector.checked == true) {
        piediv.hidden = false;
    } else if (selector != null && piediv != null && selector.checked == false) {
        piediv.hidden = true
    }
}