import './citationnet.css';
import { ForceGraph3DInstance } from '3d-force-graph';
interface CiteNode extends Object {
    id: string;
    display_name: string;
    publication_year: number;
    cited_by_count: number;
    topic: string;
    isSource: boolean;
    fz: number;
}
interface CiteLink extends Object {
    source: string;
    target: string;
    year: number;
    level: string;
}
export declare class citationnet {
    jsondata: string;
    containerID: string;
    graph: ForceGraph3DInstance;
    citenodes: CiteNode[] | any;
    citelinks: CiteLink[] | any;
    constructor(jsondata: string, containerID: string);
    loadData(): this | undefined;
    redraw(): void;
    /**
     * Changes the point of view on the citationnet.
     *
     * @remarks
     * This function is toggled via the key combinations 'Alt + ArrowUp / ArrowDown'.
     *
     * @param viewPoint: string - Either "top" or "side".
     * @returns The current citationnet graph.
     */
    view(viewPoint: string): this;
    adaptWindowSize(): this;
    /**
     * Opens an infobox of the clicked node with a link to OpenAlex data.
     *
     * @remarks
     * This function is used as 'onclick'. The box stays visible for 10 sec.
     *
     * @param node: The current node.
     * @returns None
     */
    static openNodeInfo(node: CiteNode): void;
    /**
     * Creates the string for hover- and infobox.
     *
     * @param node: The current node.
     * @returns A string with node information.
     */
    static createNodeLabel(node: CiteNode): string;
    static radialStrength(node: CiteNode, minStrength?: number, maxStrength?: number, min?: number, max?: number): number;
    setCylinder(radius?: number, outervalue?: number): typeof citationnet;
    setNodeProp(): this;
    setLinkStrength(strength?: number): this | undefined;
    hello(): void;
}
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
export declare function radialStrength(minStrength?: number, maxStrength?: number, min?: number, max?: number): (node: CiteNode, minStrength?: number, maxStrength?: number, min?: number, max?: number) => number;
export {};
