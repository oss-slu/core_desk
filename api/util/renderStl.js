import {
  stl2png,
  makeStandardMaterial,
  makeEdgeMaterial,
} from "@scalenc/stl-to-png";

const mat = makeStandardMaterial(1, 0x53c3ee);
const edgemat = makeEdgeMaterial(1, 0x53c3ee);

const prefixUrl = (url) => {
  // if url doesnt start with http:// or https://, add it
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
};

export const renderStl = async (stlUrl, size = 200) => {
  const stlData = await fetch(prefixUrl(stlUrl)).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch STL: ${res.status}`);
    return res.arrayBuffer();
  });

  // Basic validation to avoid parsing non-STL responses (e.g., HTML error pages)
  if (stlData.byteLength < 84) {
    throw new Error("STL file too small or malformed");
  }

  const bytes = new Uint8Array(stlData);
  const view = new DataView(stlData);

  // Detect ASCII STL (starts with 'solid')
  const asciiSig = String.fromCharCode(
    bytes[0],
    bytes[1],
    bytes[2],
    bytes[3],
    bytes[4]
  ).toLowerCase();

  // Detect common HTML responses to guard early
  const htmlSig = asciiSig.startsWith("<html") || asciiSig.startsWith("<!do");

  // For binary STL, total bytes must equal 84 + 50 * triangleCount (little-endian)
  const triCount = view.getUint32(80, true);
  const expectedBinaryLength = 84 + 50 * triCount;
  const looksBinary = expectedBinaryLength === stlData.byteLength;
  const looksAscii = asciiSig.startsWith("solid");

  if (htmlSig || (!looksAscii && !looksBinary)) {
    // Provide a concise hint to the caller for easier debugging
    throw new Error(
      `URL did not return a valid STL (length=${stlData.byteLength}, head='${asciiSig}')`
    );
  }

  // Ensure we pass a typed array; some runtimes are stricter
  const pngData = stl2png(bytes, {
    width: size,
    height: size,
    materials: [mat],
    edgeMaterials: [edgemat],
  });

  return [pngData, stlData];
};
