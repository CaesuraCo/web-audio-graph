import { Vector2 } from "./math/Vector";
interface SharedProps {
    position: Vector2;
    connected: boolean;
    hasInput: boolean;
    uuid: string;
    toString: () => string;
    _parseAParam: (aParam: AudioParam) => object;
}
interface SharedOscProps extends SharedProps {
    stopAndReplace: () => GraphOscillatorNode;
    _start: () => void;
    running: boolean;
}
export interface GraphAudioBufferSourceNode extends AudioBufferSourceNode, SharedOscProps {
}
export interface GraphOscillatorNode extends OscillatorNode, SharedOscProps {
}
export interface GraphGainNode extends GainNode, SharedProps {
}
export interface GraphBiquadFilterNode extends BiquadFilterNode, SharedProps {
}
export interface GraphAnalyserNode extends AnalyserNode, SharedProps {
}
export declare type GraphAudioNode = GraphOscillatorNode | GraphGainNode | GraphBiquadFilterNode | GraphAnalyserNode;
export declare class AudioGraph {
    nodes: Map<GraphAudioNode, Array<GraphAudioNode>>;
    ctx: AudioContext;
    constructor(ctx: AudioContext);
    mixin: any;
    _parseFunction(str: string): Function;
    parseJSON(string: string): GraphOscillatorNode | GraphGainNode | GraphAnalyserNode;
    getNode(index: number): GraphAudioNode;
    getOscillator(index: number): GraphOscillatorNode;
    getGain(index: number): GraphGainNode;
    createOscillatorNode(position?: Vector2): GraphOscillatorNode;
    createGainNode(position?: Vector2): GraphGainNode;
    createBiquadFilterNode(position?: Vector2): GraphBiquadFilterNode;
    createAnalyserNode(position?: Vector2): GraphAnalyserNode;
    addNode(node: GraphAudioNode): void;
    removeNode(node: GraphAudioNode): void;
    bfs(start: GraphAudioNode): void;
    connect(src: GraphAudioNode, dest: GraphAudioNode): void;
    reconnect(src: GraphAudioNode): void;
    disconnect(src: GraphAudioNode, dest: GraphAudioNode): void;
}
export {};
