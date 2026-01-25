const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'src');
const exts = ['.js', '.jsx', '.ts', '.tsx'];

function readFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(readFiles(full));
    } else if (exts.includes(path.extname(full))) {
      results.push(full);
    }
  }
  return results;
}

function resolveImport(fromFile, imp) {
  if (!imp.startsWith('.') && !imp.startsWith('/')) return null; // external
  const base = path.dirname(fromFile);
  let candidate = path.resolve(base, imp);
  // try extensions and index
  const tries = [];
  if (exts.includes(path.extname(candidate))) tries.push(candidate);
  for (const e of exts) tries.push(candidate + e);
  for (const e of exts) tries.push(path.join(candidate, 'index' + e));
  for (const t of tries) {
    if (fs.existsSync(t)) return t;
  }
  return null;
}

const files = readFiles(root);
const imports = new Map();
for (const f of files) imports.set(f, new Set());

const importRegex = /import\s+(?:[^'";]+)from\s+["']([^"']+)["']/g;
const importRegex2 = /import\s+["']([^"']+)["']/g;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRegex.exec(src))) {
    const imp = m[1];
    const resolved = resolveImport(f, imp);
    if (resolved && imports.has(resolved)) imports.get(f).add(resolved);
  }
  importRegex.lastIndex = 0;
  while ((m = importRegex2.exec(src))) {
    const imp = m[1];
    const resolved = resolveImport(f, imp);
    if (resolved && imports.has(resolved)) imports.get(f).add(resolved);
  }
}

// detect cycles
const visited = new Set();
const stack = [];
const cycles = [];

function dfs(node) {
  if (stack.includes(node)) {
    const idx = stack.indexOf(node);
    cycles.push(stack.slice(idx).concat(node));
    return;
  }
  if (visited.has(node)) return;
  visited.add(node);
  stack.push(node);
  for (const neigh of imports.get(node) || []) dfs(neigh);
  stack.pop();
}

for (const f of files) dfs(f);

if (cycles.length === 0) {
  console.log('No cycles found');
} else {
  console.log('Cycles found:');
  for (const c of cycles) {
    console.log('----');
    for (const p of c) console.log(path.relative(root, p));
  }
}
