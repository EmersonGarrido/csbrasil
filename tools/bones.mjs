import { NodeIO } from '@gltf-transform/core';
const io = new NodeIO();
const doc = await io.read(process.argv[2]);
const names = doc.getRoot().listNodes().map(n => n.getName());
console.log('nodes (' + names.length + '):', names.join(', '));
