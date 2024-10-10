import { CitationNet } from '../src/citationnet-js/citationnet';
import { expect } from "chai";

describe('After creating a new instance of citationnet', () => {
  let network = new CitationNet(
    "Malte_Vogl_W2083876332.json",
    "3d-graph"
  );
  network.loadData();
  let graphData = network.graph.graphData().nodes;
  it('it should have no return value', () => {
    expect(typeof(network) == "object").to.be.true;
  });
  it('it should be able to load the data from the JSON file', () => {
    expect(typeof(network.loadData) == "function").to.be.true;
  });
  it('it should display the json file name', () => {
    expect(network.jsondata == 'Malte_Vogl_W2083876332.json').to.be.true;
  });
});