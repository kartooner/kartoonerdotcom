/**
 * Viking Design Framework Context Loader
 * Scans for PRODUCT.md and DESIGN.md to provide project context.
 */

import fs from 'node:fs';
import path from 'node:path';

const PRODUCT_NAMES = ['PRODUCT.md', 'Product.md', 'product.md'];
const DESIGN_NAMES = ['DESIGN.md', 'Design.md', 'design.md'];
const FALLBACK_DIRS = ['.viking/context', 'docs'];

export function loadContext(cwd = process.cwd()) {
  const resolveDir = (dir) => {
    if (firstExisting(dir, [...PRODUCT_NAMES, ...DESIGN_NAMES])) return dir;
    for (const rel of FALLBACK_DIRS) {
      const candidate = path.resolve(dir, rel);
      if (firstExisting(candidate, [...PRODUCT_NAMES, ...DESIGN_NAMES])) return candidate;
    }
    return dir;
  };

  const contextDir = resolveDir(cwd);
  const productPath = firstExisting(contextDir, PRODUCT_NAMES);
  const designPath = firstExisting(contextDir, DESIGN_NAMES);

  const product = productPath ? fs.readFileSync(productPath, 'utf-8') : null;
  const design = designPath ? fs.readFileSync(designPath, 'utf-8') : null;

  return {
    hasProduct: !!product,
    product,
    productPath: productPath ? path.relative(cwd, productPath) : null,
    hasDesign: !!design,
    design,
    designPath: designPath ? path.relative(cwd, designPath) : null,
    contextDir,
  };
}

function firstExisting(dir, names) {
  for (const name of names) {
    const abs = path.join(dir, name);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

if (process.argv[1]?.endsWith('viking-context.mjs')) {
  console.log(JSON.stringify(loadContext(), null, 2));
}
