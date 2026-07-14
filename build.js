/**
 * Obsidian 插件打包脚本
 *
 * 用法：
 *   node build.js            # 按 manifest.json 当前版本打包
 *   node build.js 1.1.0      # 先更新 manifest.json / versions.json 的版本号，再打包
 *
 * 输出：dist/<id>-<version>.zip
 *
 * 包含：main.js, manifest.json, styles.css, README.md, README.zh.md, LICENSE, docs/
 * 排除：.git, node_modules, data.json(本地设置), dist/, *.zip, build.js 自身
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;

// ---------- 可选：更新版本号 ----------
const newVersion = process.argv[2];
const manifestPath = path.join(root, 'manifest.json');
const versionsPath = path.join(root, 'versions.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (newVersion && newVersion !== manifest.version) {
    manifest.version = newVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0).replace(/^{/, '{\n  ').replace(/}$/, '\n}') + '\n');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    versions[newVersion] = manifest.minAppVersion;
    fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + '\n');
    console.log(`🔖 版本已更新为 ${newVersion}`);
}

const { id, version } = manifest;

// ---------- 收集要打包的文件 ----------
const include = ['main.js', 'manifest.json', 'styles.css', 'README.md', 'README.zh.md', 'LICENSE', 'docs'];
const excludeNames = new Set(['.git', 'node_modules', 'dist', 'data.json', 'build.js']);

const files = [];
function walk(rel) {
    const abs = path.join(root, rel);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
        for (const e of fs.readdirSync(abs)) {
            if (excludeNames.has(e)) continue;
            walk(path.posix.join(rel, e));
        }
    } else {
        files.push(rel);
    }
}
for (const item of include) {
    const p = path.join(root, item);
    if (fs.existsSync(p)) walk(item);
}

// 移除任何遗留的 .zip
const cleanFiles = files.filter(f => !f.endsWith('.zip'));

// ---------- 打包 ----------
const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });
const zipName = `${id}-${version}.zip`;
const zipPath = path.join(distDir, zipName);
if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });

const psArray = '@(' + cleanFiles.map(f => `'${f}'`).join(',') + ')';
const ps = `Compress-Archive -Path ${psArray} -DestinationPath '${zipPath.replace(/\\/g, '/')}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { cwd: root, stdio: 'inherit' });

console.log(`✅ 已打包 ${cleanFiles.length} 项 -> ${path.relative(root, zipPath)}`);
console.log(`   文件: ${cleanFiles.join(', ')}`);
