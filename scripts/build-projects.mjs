// Quét mọi folder có option.json ở gốc repo -> ghi projects.json
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
const list = [];
for (const d of readdirSync('.', { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith('.') || d.name === 'node_modules' || d.name === 'scripts') continue;
  const f = `${d.name}/option.json`;
  if (!existsSync(f)) continue;
  try {
    const o = JSON.parse(readFileSync(f, 'utf8'));
    list.push({
      id: o.id || d.name,
      name: o.name || d.name,
      thumbnail: o.thumbnail || '',
      date: o.date || new Date(statSync(f).mtime).toISOString().slice(0, 10),
      display: o.display || 'iframe',
      entry: o.entry || 'index.html',
      folder: d.name
    });
  } catch (e) { console.warn(`Bỏ qua ${f}: ${e.message}`); }
}
writeFileSync('projects.json', JSON.stringify(list, null, 2));
console.log(`Đã ghi ${list.length} dự án.`);
