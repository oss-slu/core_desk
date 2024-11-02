import {
  stl2png,
  makeStandardMaterial,
  makeEdgeMaterial,
} from "@scalenc/stl-to-png";

const mat = makeStandardMaterial(1, 0x53c3ee);
const edgemat = makeEdgeMaterial(1, 0x53c3ee);

export const renderStl = async (stlUrl, size = 200) => {
  const stlData = await fetch(stlUrl).then((res) => res.arrayBuffer());

  const pngData = stl2png(stlData, {
    width: size,
    height: size,
    materials: [mat],
    edgeMaterials: [edgemat],
  });

  return [pngData, stlData];
};
