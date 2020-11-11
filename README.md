# Web Audio Graph

## Why?

The Web Audio API is great. It's approach of creating new nodes and garbage collecting old ones makes a lot of sense, except in the instances where you want to keep nodes around. For example, if you stop an `OscillatorNode`, it is basically useless and a new one should be created. This loses all of it's connections and values of course, which could be not what you want. This project sets you up with a graph, that automatically creates a new node when you stop it, and keeps track of connections and reconnects if needed. This also allows you to check which node is connected to which, another feature that can be very benificial.

## How to use

Here's a basic example:

```
const audioCtx = new AudioContext();
const graph = new AudioGraph();

let oscNode = graph.createOscillatorNode();
const gainNode = graph.createGainNode();

// connect nodes by calling graph.connect
graph.connect(oscNode, gainNode);

// start OscillatorNode the same as normal
oscNode.start();

// call stopAndReplace() instead of stop() to keep oscNode reference
oscNode = oscNode.stopAndReplace();

// check connections
const connections = graph.nodes.get(oscNode);
console.log(connections[0]) // should print the gainNode
```

there are also options to save nodes as strings, and create nodes again by parsing those strings.

```
    ....
    const string = oscNode.toString();
    // Now you can, for example, save the string to a database

    // later, when you fetch the string from the database again, parse it like this
    const string = fetch("...") // api call
    const newOsc = graph.parseJSON(string);
```
