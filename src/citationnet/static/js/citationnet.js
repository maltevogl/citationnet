import './citationnet.css';
import ForceGraph3D from '3d-force-graph';
import { forceRadial } from "d3-force";
var fieldColorDict = {
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
};
;
;
var citationnet = /** @class */ (function () {
    function citationnet(jsondata, containerID) {
        this.jsondata = jsondata;
        this.containerID = containerID;
        this.graph = ForceGraph3D({
            'controlType': 'trackball',
            'rendererConfig': {
                antialias: false,
                alpha: false
            }
        });
        this.citenodes = this.graph.graphData().nodes;
        this.citelinks = this.graph.graphData().links;
    }
    ;
    citationnet.prototype.loadData = function () {
        var container = document.getElementById(this.containerID);
        if (container != null) {
            this.graph(container).jsonUrl(this.jsondata);
            return citationnet;
        }
    };
    citationnet.prototype.redraw = function () {
        this.graph.d3ReheatSimulation();
    };
    /**
     * Changes the point of view on the citationnet.
     *
     * @remarks
     * This function is toggled via the key combinations 'Alt + ArrowUp / ArrowDown'.
     *
     * @param viewPoint: string - Either "top" or "side".
     * @returns The current citationnet graph.
     */
    citationnet.prototype.view = function (viewPoint, citationnet) {
        if (viewPoint == 'top') {
            citationnet.graph.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 500);
            citationnet.graph.camera().up.set(0.0, 1.0, 0.0);
            citationnet.graph.camera().zoom = 2.0;
            citationnet.graph.camera().updateProjectionMatrix();
            citationnet.graph.zoomToFit();
        }
        else if (viewPoint == 'side') {
            citationnet.graph.cameraPosition({ x: 0, y: -500, z: 0 }, { x: 0, y: 0, z: 0 }, 500);
            citationnet.graph.camera().up.set(0.0, 0.0, 1.0);
            citationnet.graph.camera().zoom = 1.0;
            citationnet.graph.camera().updateProjectionMatrix();
            citationnet.graph.zoomToFit();
        }
        return citationnet;
    };
    citationnet.prototype.adaptWindowSize = function (citationnet) {
        var container = document.getElementById(citationnet.containerID);
        if (container != null) {
            var width = container.clientWidth;
            var height = container.clientHeight;
            citationnet.graph.camera().left = width / -2;
            citationnet.graph.camera().right = width / 2;
            citationnet.graph.camera().top = height / 2;
            citationnet.graph.camera().bottom = height / -2;
            citationnet.graph.camera().updateProjectionMatrix();
        }
    };
    /**
     * Opens an infobox of the clicked node with a link to OpenAlex data.
     *
     * @remarks
     * This function is used as 'onclick'. The box stays visible for 10 sec.
     *
     * @param node: The current node.
     * @returns None
     */
    citationnet.openNodeInfo = function (node) {
        var infobox = document.getElementById("infobox");
        if (infobox != null) {
            var infotext = citationnet.createNodeLabel(node);
            var openalexID = (typeof node.id !== 'undefined') ? node.id : node.display_name;
            var openalexLink = "</br><a href=\"".concat(openalexID, "\" target=\"_blank\">View in OpenAlex.</a>");
            infobox.className = "show";
            infobox.innerText = infotext;
            infobox.insertAdjacentHTML('beforeend', openalexLink);
            setTimeout(function (infobox) { infobox.className = infobox.className.replace("show", ""); }, 10000);
        }
    };
    /**
     * Creates the string for hover- and infobox.
     *
     * @param node: The current node.
     * @returns A string with node information.
     */
    citationnet.createNodeLabel = function (node) {
        var openalexID = (typeof node.id !== 'undefined') ? node.id : node.display_name;
        var field = (typeof node.topic !== 'undefined') ? ", Field: " + node.topic : "No field.";
        return "".concat(openalexID, " @ ").concat(node.publication_year, "\n cited ").concat(node['cited_by_count'], " times").concat(field);
    };
    /**
     * Strenght function factory to generate the radial strength.
     *
     * @remarks
     * This is a linear interpolation between min and max values for the amount of citations of a node.
     * The minimally returned strength is 0.0 and the maximal strength is 1.0. All nodes with 2 citations
     * are on the inner-most ring, while all nodes with 1000 or more citations are grouped on the outer ring.
     *
     * @param minStrength: number, default 0.0
     * @param maxStrength: number, default 1.0
     * @param min: number, default 2.0
     * @param max: number, default 1000.0
     * @returns A function taking the node as an argument and returning a strength between 0.0 and 1.0
     */
    citationnet.radialStrength = function (minStrength, maxStrength, min, max) {
        if (minStrength === void 0) { minStrength = 0.0; }
        if (maxStrength === void 0) { maxStrength = 1.0; }
        if (min === void 0) { min = 2.0; }
        if (max === void 0) { max = 1000.0; }
        var strengthFunc = function (node, minStrength, maxStrength, min, max) {
            var x = node['cited_by_count'];
            var out = minStrength + (x - min) * (maxStrength - minStrength) / (max - min);
            return out <= minStrength ? minStrength
                : out >= maxStrength ? maxStrength
                    : out;
        };
        return strengthFunc;
    };
    citationnet.setCylinder = function (citationnet, radius, outervalue) {
        if (radius === void 0) { radius = 200; }
        if (outervalue === void 0) { outervalue = 500; }
        citationnet.graph.d3Force('radialOuter', forceRadial(radius).strength(citationnet.radialStrength(0.0, 1.0, 1, outervalue)));
        return citationnet;
    };
    citationnet.setNodeProp = function (citationnet) {
        if (citationnet != null) {
            citationnet.graph
                .nodeId('id')
                .nodeRelSize(0.5)
                .nodeOpacity(0.8)
                .d3Force('center', null)
                .d3Force('charge', null)
                .d3Force('radialInner', forceRadial(0).strength(0.1))
                .enableNodeDrag(false)
                .nodeColor(function (node) { return fieldColorDict[node.topic]; })
                .nodeVal(function (node) { return node['cited_by_count']; })
                .nodeLabel(function (node) { return citationnet.createNodeLabel(node); })
                .onNodeClick(function (node) { return citationnet.openNodeInfo(node); });
            return citationnet;
        }
    };
    // TODO: Remove node: any by adding correct types. 
    // Problem results from this line:   onNodeClick(callback: (node: object, event: MouseEvent) => void): ChainableInstance;
    // here: https://github.com/vasturiano/3d-force-graph/blob/9806444ee2af34a0a45ecc8ea035ec9efa929d54/src/index.d.ts#L41
    citationnet.setLinkStrength = function (citationnet, strength) {
        if (strength === void 0) { strength = 0.0; }
        if (citationnet != null) {
            var linkforce = citationnet.graph.d3Force('link');
            if (linkforce != null) {
                linkforce.strength(strength);
                return citationnet;
            }
        }
    };
    citationnet.prototype.hello = function () {
        console.log('Citationnet works.');
    };
    return citationnet;
}());
export { citationnet };
//export { citationnet }
//# sourceMappingURL=citationnet.js.map