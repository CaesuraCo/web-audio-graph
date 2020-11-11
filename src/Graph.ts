import { Vector2 } from "./math/Vector";

/** @internal */
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** @internal */
interface SharedProps {
  position: Vector2;
  connected: boolean;
  hasInput: boolean;
  uuid: string;
  toString: () => string;
  _parseAParam: (aParam: AudioParam) => object;
}

/** @internal */
interface SharedOscProps extends SharedProps {
  stopAndReplace: () => GraphOscillatorNode;
  _start: () => void;
  running: boolean;
}

export interface GraphAudioBufferSourceNode
  extends AudioBufferSourceNode,
    SharedOscProps {}
export interface GraphOscillatorNode extends OscillatorNode, SharedOscProps {}
export interface GraphGainNode extends GainNode, SharedProps {}
export interface GraphBiquadFilterNode extends BiquadFilterNode, SharedProps {}
export interface GraphAnalyserNode extends AnalyserNode, SharedProps {}

export type GraphAudioNode =
  | GraphOscillatorNode
  | GraphGainNode
  | GraphBiquadFilterNode
  | GraphAnalyserNode;

export class AudioGraph {
  nodes: Map<GraphAudioNode, Array<GraphAudioNode>>;
  ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.nodes = new Map();
    this.ctx = ctx;
  }

  /** @internal */
  _mixin: any = {
    _parseAParam(aParam: AudioParam) {
      return {
        defaultValue: aParam.defaultValue,
        maxValue: aParam.maxValue,
        minValue: aParam.minValue,
        value: aParam.value,
      };
    },
    toString(): string {
      const obj = {
        numberOfInputs: this.numberOfInputs,
        numberOfOutputs: this.numberOfOutpus,
        channelCount: this.channelCount,
        channelCountMode: this.channelCountMode,
        channelInterpretation: this.channelInterpretation,
        gain: this.gain && this._parseAParam(this.gain),
        frequency: this.frequency && this._parseAParam(this.frequency),
        detune: this.detune && this._parseAParam(this.detune),
        Q: this.Q && this._parseAParam(this.Q),
        fftSize: this.fftSize,
        minDecibels: this.minDecibels,
        maxDecibels: this.maxDecibels,
        smoothingTimeConstant: this.smoothingTimeConstant,
        type: this.type,
        position: this.position,
        connected: this.connected,
        hasInput: this.hasInput,
        prototype: this.constructor.name,
      };
      return JSON.stringify(obj);
    },
    position: { x: 0, y: 0 },
    connected: false,
    hasInput: false,
    running: false,
  };

  /** @internal */
  _parseFunction(str: string) {
    var fn_body_idx = str.indexOf("{"),
      fn_body = str.substring(fn_body_idx + 1, str.lastIndexOf("}")),
      fn_declare = str.substring(0, fn_body_idx),
      fn_params = fn_declare.substring(
        fn_declare.indexOf("(") + 1,
        fn_declare.lastIndexOf(")")
      ),
      args = fn_params.split(",");

    args.push(fn_body);

    const Fn = () => {
      return Function.apply(this, args);
    };
    Fn.prototype = Function.prototype;

    return Fn();
  }

  /** Parse string to JSON and create a node from that */
  parseJSON(string: string) {
    const parsed = JSON.parse(string);
    let node;
    switch (parsed.prototype) {
      case "OscillatorNode":
        node = this.createOscillatorNode(parsed.position);
        node.frequency.value = parsed.frequency.value;
        node.detune.value = parsed.detune.value;
        node.type = parsed.type;
        node.uuid = parsed.uuid;
        return node;
      case "GainNode":
        node = this.createGainNode(parsed.position);
        node.gain.value = parsed.gain.value;
        node.uuid = parsed.uuid;
        return node;
      case "BiquadFilterNode":
        node = this.createBiquadFilterNode(parsed.position);
        node.gain.value = parsed.gain.value;
        node.Q.value = parsed.Q.value;
        node.frequency.value = parsed.frequency.value;
        node.detune.value = parsed.detune.value;
        node.type = parsed.type;
        node.uuid = parsed.uuid;
        return node;
      case "AnalyserNode":
        node = this.createAnalyserNode(parsed.position);
        node.fftSize = parsed.fftSize;
        node.minDecibels = parsed.minDecibels;
        node.maxDecibels = parsed.maxDecibels;
        node.smoothingTimeConstant = parsed.smoothingTimeConstant;
        node.uuid = parsed.uuid;
        return node;
      default:
        throw new Error("Couldn't find prototype");
    }
  }
  /** Get node by index */
  getNode(index: number) {
    return Array.from(this.nodes.keys())[index];
  }
  /** Get OscillatorNode by index */
  getOscillator(index: number) {
    return this.getNode(index) as GraphOscillatorNode;
  }
  /** Get GainNodeby index */
  getGain(index: number) {
    return this.getNode(index) as GraphGainNode;
  }
  /** Create OscillatorNode and add it to the graph
   *  @param position Position is an optional Vector2 that stores a possible x,y coordinate for use in GUI's etc
   */
  createOscillatorNode(position: Vector2 = { x: 0, y: 0 }) {
    const node = this.ctx.createOscillator();
    const nodePlus: GraphOscillatorNode = Object.assign(node, this._mixin);
    nodePlus.position = position;
    nodePlus.uuid = uuidv4();

    const stopAndReplace = (): GraphOscillatorNode => {
      if (nodePlus.running) {
        nodePlus.stop();
        // first we copp the nodes edges, to reconnect later
        const edges = this.nodes.get(nodePlus) || [];
        // node is now useless due to web audio garbage collection
        // so we'll remove the old one and create a new one.
        this.removeNode(nodePlus);
        const newNode = this.createOscillatorNode(nodePlus.position);
        // copy values
        newNode.frequency.value = nodePlus.frequency.value;
        // copy edges (connections), and reconnect
        this.nodes.set(newNode, edges);
        this.reconnect(newNode);
        return newNode;
      }
      return nodePlus;
    };
    nodePlus.stopAndReplace = stopAndReplace;

    nodePlus._start = OscillatorNode.prototype.start;
    const start = (): GraphOscillatorNode => {
      if (!nodePlus.running) {
        nodePlus._start();
        nodePlus.running = true;
      }
      return nodePlus;
    };
    nodePlus.start = start;

    this.addNode(nodePlus);
    return nodePlus;
  }
  /** Create a GainNode and add it to the graph
   *  @param position Position is an optional Vector2 that stores a possible x,y coordinate for use in GUI's etc
   */
  createGainNode(position: Vector2 = { x: 0, y: 0 }) {
    const node = this.ctx.createGain();
    const nodePlus: GraphGainNode = Object.assign(node, this._mixin);
    nodePlus.position = position;

    this.addNode(nodePlus);
    return nodePlus;
  }
  /** Create a BiquadFilterNode and add it to the graph
   *  @param position Position is an optional Vector2 that stores a possible x,y coordinate for use in GUI's etc
   */
  createBiquadFilterNode(position: Vector2 = { x: 0, y: 0 }) {
    const node = this.ctx.createBiquadFilter();
    const nodePlus: GraphBiquadFilterNode = Object.assign(node, this._mixin);
    nodePlus.position = position;

    this.addNode(nodePlus);
    return nodePlus;
  }
  /** Create an AnalyserNode and add it to the graph
   *  @param position Position is an optional Vector2 that stores a possible x,y coordinate for use in GUI's etc
   */
  createAnalyserNode(position: Vector2 = { x: 0, y: 0 }) {
    const node = this.ctx.createAnalyser();
    const nodePlus: GraphAnalyserNode = Object.assign(node, this._mixin);
    nodePlus.position = position;

    this.addNode(nodePlus);
    return nodePlus;
  }
  /** Adds a node to the graph */
  addNode(node: GraphAudioNode) {
    if (!this.nodes.has(node)) {
      this.nodes.set(node, []);
    } else {
      throw "Node already exists!";
    }
  }
  /** Remove node to the graph */
  removeNode(node: GraphAudioNode) {
    this.nodes.delete(node);
  }
  /** Breadth-First Search implementation */
  bfs(start: GraphAudioNode) {
    let visited = {};
    let queue: Array<GraphAudioNode> = [];
    visited = { start: true };
    queue.push(start);

    while (queue.length) {
      let current = queue.pop();

      if (current) {
        let arr = this.nodes.get(current);
      }
    }
  }
  /** Connect nodes together
   * @param src the source node
   * @param destination the node to connect to
   */
  connect(src: GraphAudioNode, dest: GraphAudioNode) {
    if (this.nodes.has(src)) {
      if (this.nodes.has(dest)) {
        let audioDestination: any = dest;
        if (dest instanceof OscillatorNode) {
          audioDestination = dest.frequency;
        }

        src.connect(audioDestination);
        let edges = this.nodes.get(src) || [];
        edges.push(dest);
        src.connected = true;
        dest.hasInput = true;
      } else {
        throw {
          error: `Couldn't find destination node ${dest.constructor.name}`,
        };
      }
    } else {
      throw {
        error: `Couldn't find source node ${src.constructor.name}`,
      };
    }
  }
  /** Mostly used internally, this reconnects the nodes, after something has changed
   * @param src the source node
   */
  reconnect(src: GraphAudioNode) {
    if (this.nodes.has(src)) {
      const edges = this.nodes.get(src) || [];
      for (const edge of edges) {
        let audioDestination: any = edge;
        if (edge instanceof OscillatorNode) {
          audioDestination = edge.frequency;
        }

        src.connect(audioDestination);
      }
    }
  }
  /** Disconnects the nodes
   * @param src the source node
   * @param destination the node to connect to
   */
  disconnect(src: GraphAudioNode, dest: GraphAudioNode) {
    if (this.nodes.has(src)) {
      if (this.nodes.has(dest)) {
        let edges: Array<GraphAudioNode> = this.nodes.get(src) || [];
        if (edges.length > 0) {
          // Disconnect all Webaudio nodes and delete destination node
          // from edges array
          src.disconnect();
          edges = edges.filter((edge) => {
            return edge !== dest;
          });
          this.nodes.set(src, edges);
          // Re-connect existing edges
          for (const edge of edges) {
            src.connect(edge);
          }
          if (edges.length < 1) {
            src.connected = false;
          }
        }
      } else {
        throw `Couldn't find node ${dest}`;
      }
    } else {
      throw `Couldn't find node ${src}`;
    }
  }
}
