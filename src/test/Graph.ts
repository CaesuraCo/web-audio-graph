import {
  GraphAudioNode,
  GraphOscillatorNode,
  GraphGainNode,
  GraphBiquadFilterNode,
  GraphAnalyserNode,
  AudioGraph,
} from "../Graph";
import "web-audio-test-api";

describe("Graph", () => {
  it("Should be able to create all types of audio nodes", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    const gainNode: GraphGainNode = graph.createGainNode();
    const filterNode: GraphBiquadFilterNode = graph.createBiquadFilterNode();
    const analyserNode: GraphAnalyserNode = graph.createAnalyserNode();

    expect(graph.nodes.has(oscNode)).toEqual(true);
    expect(graph.nodes.has(gainNode)).toEqual(true);
    expect(graph.nodes.has(filterNode)).toEqual(true);
    expect(graph.nodes.has(analyserNode)).toEqual(true);
  });
  it("Should be able to update node and edge", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const oscNode2 = graph.createOscillatorNode();

    graph.connect(oscNode, oscNode2);

    oscNode2.frequency.value = 99;
    const edges = graph.nodes.get(oscNode) || [];
    expect((edges[0] as GraphOscillatorNode).frequency.value).toEqual(99);
  });
  it("Should be able to get node from graph by index", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const index = graph.nodes.size - 1;

    const node: GraphOscillatorNode = graph.getOscillator(index);
    // change frequency AFTER calling getOscillator()
    oscNode.frequency.value = 123;

    expect(node).toBeDefined();
    expect(node).toEqual(oscNode);
    expect(node.frequency.value).toEqual(123);
  });
  it("Should be able to remove audio nodes", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();

    expect(graph.nodes.has(oscNode)).toEqual(true);

    graph.removeNode(oscNode);
    expect(graph.nodes.has(oscNode)).toEqual(false);
  });
  it("Should be able to connect node to one", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const oscNode2 = graph.createOscillatorNode();

    graph.connect(oscNode, oscNode2);

    expect(graph.nodes.get(oscNode)).toEqual([oscNode2]);
  });
  it("should be able to reconnect a node after disconnecting", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const oscNode2 = graph.createOscillatorNode();

    graph.connect(oscNode, oscNode2);

    oscNode.disconnect();

    graph.reconnect(oscNode);
  });
  it("Should be able to remove node connection to one", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const oscNode2 = graph.createOscillatorNode();

    graph.connect(oscNode, oscNode2);
    expect(graph.nodes.get(oscNode)).toEqual([oscNode2]);

    graph.disconnect(oscNode, oscNode2);

    expect(graph.nodes.get(oscNode)).toEqual([]);
  });
  it("Should be able to JSON.stringify nodes", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const osc = graph.createOscillatorNode();
    const gain = graph.createGainNode();
    graph.connect(osc, gain);
    const string = osc.toString();
    expect(typeof string === "string");
  });
  it("Should be able to parse string to json and create nodes", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const gainNode = graph.createGainNode();
    const biquadFilterNode = graph.createBiquadFilterNode();
    const analyserNode = graph.createAnalyserNode();

    oscNode.frequency.value = 666;
    const oscParsed = graph.parseJSON(oscNode.toString());
    const gainParsed = graph.parseJSON(gainNode.toString());
    const biquadFilterParsed = graph.parseJSON(biquadFilterNode.toString());
    const analyserParsed = graph.parseJSON(analyserNode.toString());

    expect(oscParsed.toString()).toEqual(oscNode.toString());
    expect(gainParsed.toString()).toEqual(gainNode.toString());
    expect(biquadFilterParsed.toString()).toEqual(biquadFilterNode.toString());
    expect(analyserParsed.toString()).toEqual(analyserNode.toString());
  });
  it("Should be able to connect node to many", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    const oscNode = graph.createOscillatorNode();
    const gainNode = graph.createGainNode();
    const filterNode = graph.createBiquadFilterNode();
    const analyserNode = graph.createAnalyserNode();

    graph.connect(oscNode, gainNode);
    graph.connect(oscNode, filterNode);
    graph.connect(oscNode, analyserNode);

    expect(graph.nodes.get(oscNode)).toEqual([
      gainNode,
      filterNode,
      analyserNode,
    ]);
  });
  it("Should be able to remove connection node to many", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let newNode = graph.createOscillatorNode();
    const newNode2 = graph.createAnalyserNode();
    const newNode3 = graph.createBiquadFilterNode();
    const newNode4 = graph.createGainNode();

    newNode.start();
    graph.connect(newNode, newNode2);
    graph.connect(newNode, newNode3);
    graph.connect(newNode, newNode4);

    newNode = newNode.stopAndReplace();

    expect(graph.nodes.get(newNode)).toEqual([newNode2, newNode3, newNode4]);

    graph.disconnect(newNode, newNode2);
    expect(graph.nodes.get(newNode)).toEqual([newNode3, newNode4]);
    expect(graph.nodes.has(newNode2)).toEqual(true);
    graph.disconnect(newNode, newNode3);
    expect(graph.nodes.get(newNode)).toEqual([newNode4]);
    expect(graph.nodes.has(newNode3)).toEqual(true);
    graph.disconnect(newNode, newNode4);
    expect(graph.nodes.get(newNode)).toEqual([]);
    expect(graph.nodes.has(newNode4)).toEqual(true);
  });
});
