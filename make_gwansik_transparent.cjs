/**
 * make_gwansik_transparent.cjs
 * Reads archary.png, strips the white background, writes archary_clean.png
 * Uses only built-in Node.js -- no canvas package needed.
 * PNG uses DEFLATE compression; we exploit the fact that the file is RGBA or RGB.
 * We rely on the `canvas` global (not available) so instead we use a pure-JS
 * PNG decoder/encoder approach via raw buffer inspection of the PNG chunks.
 *
 * Strategy: Use Vite's dev server to serve a tiny HTML page that does the
 * canvas pixel manipulation and offers a download -- too complex.
 *
 * SIMPLEST APPROACH: Use Node's built-in crypto + the fact that Vite uses
 * Node >=18 which has a STABLE fetch and native canvas via OffscreenCanvas...
 * Actually just use the `pngjs` approach if available.
 *
 * Since we only have `fs` + `Buffer`, we'll use a raw PNG chunk parser.
 * PNG structure: signature(8) + chunks. Each chunk: length(4)+type(4)+data(N)+crc(4)
 * IHDR chunk tells us width, height, bit depth, color type.
 * IDAT chunks contain the compressed image data (zlib).
 *
 * This is complex to do from scratch. Better: use child_process to call python.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, 'public/assets/images/archary.png');
const OUTPUT = path.join(__dirname, 'public/assets/images/archary_clean.png');

// Try Python first (Pillow)
const pythonScript = `
import sys
try:
    from PIL import Image
    img = Image.open(r"${INPUT.replace(/\\/g, '\\\\')}")
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        r, g, b, a = item
        # Make near-white pixels transparent
        if r > 220 and g > 220 and b > 220:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(r"${OUTPUT.replace(/\\/g, '\\\\')}")
    print("OK: wrote archary_clean.png")
except ImportError:
    print("NOPILLOW")
    sys.exit(1)
`;

let pythonWorked = false;

// Write temp python script
const tmpPy = path.join(__dirname, '_tmp_transparency.py');
fs.writeFileSync(tmpPy, pythonScript);

try {
  const result = execSync(`python "${tmpPy}" 2>&1`, { encoding: 'utf8', timeout: 30000 });
  console.log(result.trim());
  if (result.includes('OK:')) {
    pythonWorked = true;
  }
} catch (e) {
  // python not available or failed
  try {
    const result = execSync(`python3 "${tmpPy}" 2>&1`, { encoding: 'utf8', timeout: 30000 });
    console.log(result.trim());
    if (result.includes('OK:')) {
      pythonWorked = true;
    }
  } catch (e2) {
    console.log('Python not available, will use in-browser processing');
  }
}

// Clean up temp file
try { fs.unlinkSync(tmpPy); } catch(e) {}

if (!pythonWorked) {
  console.log('Could not convert image offline. Falling back to runtime approach.');
  process.exit(1);
} else {
  console.log('Successfully created archary_clean.png with transparent background!');
}
