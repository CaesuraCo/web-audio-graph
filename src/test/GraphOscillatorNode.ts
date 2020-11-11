import {
  GraphAudioNode,
  GraphOscillatorNode,
  GraphGainNode,
  GraphBiquadFilterNode,
  GraphAnalyserNode,
  AudioGraph,
} from "../Graph";
import "web-audio-test-api";

describe("GraphOscillatorNode", () => {
  it("Should be able to create GraphOscillatorNodes", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    expect(oscNode instanceof OscillatorNode).toEqual(true);

    expect(oscNode._parseAParam).toBeDefined();
    expect(oscNode._start).toBeDefined();
    expect(oscNode.start).toBeDefined();
    expect(oscNode.stopAndReplace).toBeDefined();
    expect(oscNode.toString).toBeDefined();
    expect(oscNode.running).toBeDefined();
    expect(graph.nodes.has(oscNode));
  });
  it("Should be able to start, stop, and start oscillator again", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    expect(graph.nodes.has(oscNode));

    expect(oscNode.running).toEqual(false);
    oscNode.start();
    expect(oscNode.running).toEqual(true);
    oscNode = oscNode.stopAndReplace();
    expect(oscNode.running).toEqual(false);
    oscNode.start();
    expect(oscNode.running).toEqual(true);

    graph.nodes.forEach((value, key) => {
      expect(key instanceof OscillatorNode).toEqual(true);
      if (key instanceof OscillatorNode) {
        expect(key).toHaveProperty("running");
        expect(key["running"]).toEqual(true);
      }
    });

    expect(graph.nodes.size).toEqual(1);
    expect(graph.nodes.has(oscNode)).toEqual(true);
  });
  it("Should still be running after disconnecting", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    let gainNode: GraphGainNode = graph.createGainNode();
    expect(oscNode.running).toEqual(false);
    oscNode.start();
    expect(oscNode.running).toEqual(true);

    graph.connect(oscNode, gainNode);
    expect(graph.nodes.get(oscNode)).toEqual([gainNode]);
    expect(oscNode.running).toEqual(true);

    graph.disconnect(oscNode, gainNode);
    expect(graph.nodes.get(oscNode)).toEqual([]);
    expect(oscNode.running).toEqual(true);
  });
  it("Should be able to reconnect after start, stop", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    let gainNode = graph.createGainNode();

    oscNode.start();
    oscNode = oscNode.stopAndReplace();

    graph.connect(oscNode, gainNode);
  });
  it("Should be able to disconnect even after stopping", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    let gainNode: GraphGainNode = graph.createGainNode();
    expect(oscNode.running).toEqual(false);
    oscNode.start();
    expect(oscNode.running).toEqual(true);

    graph.connect(oscNode, gainNode);
    expect(graph.nodes.get(oscNode)).toEqual([gainNode]);
    expect(oscNode.running).toEqual(true);

    oscNode = oscNode.stopAndReplace();
    graph.disconnect(oscNode, gainNode);
    expect(graph.nodes.get(oscNode)).toEqual([]);
    expect(oscNode.running).toEqual(false);
  });
  it("Should keep connection even after starting and stopping", () => {
    const ctx = new AudioContext();
    const graph = new AudioGraph(ctx);

    let oscNode: GraphOscillatorNode = graph.createOscillatorNode();
    let oscNode2: GraphOscillatorNode = graph.createOscillatorNode();

    graph.connect(oscNode, oscNode2);

    const testIfStillConnected = () => {
      expect(graph.nodes.has(oscNode));
      expect(graph.nodes.has(oscNode2));

      // get edges
      const edges = graph.nodes.get(oscNode);

      // get edges
      expect(edges).toBeDefined();
      if (edges) expect(edges.values()).toContain(oscNode2);

      if (edges) {
        expect(edges.values()).toContain(oscNode2);
        expect(edges[0]).toHaveProperty("frequency");

        expect((edges[0] as OscillatorNode)["frequency"].value).toEqual(
          oscNode2.frequency.value
        );
      }

      expect(oscNode2.hasInput).toEqual(true);
    };

    expect(graph.nodes.has(oscNode));
    expect(graph.nodes.has(oscNode2));

    expect(oscNode.running).toEqual(false);

    /* STARTING OSC */
    oscNode.start();
    testIfStillConnected();
    oscNode.frequency.value = 220;
    oscNode2.frequency.value = 123;

    testIfStillConnected();

    /* STOPPING OSC */
    oscNode = oscNode.stopAndReplace();
    oscNode.frequency.value = 666;
    oscNode2.frequency.value = 666;
    testIfStillConnected();

    /* STARTING OSC */
    oscNode.start();
    oscNode.frequency.value = 404;
    oscNode2.frequency.value = 404;
    testIfStillConnected();

    expect(graph.nodes.size).toEqual(2);
    expect(graph.nodes.has(oscNode)).toEqual(true);
    expect(graph.nodes.has(oscNode2)).toEqual(true);
  });
});
