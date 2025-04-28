// build.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyDir(src, dest) {
    try {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await copyDir(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    } catch (error) {
        console.error(`Error copying directory ${src}:`, error);
        throw error;
    }
}

async function build() {
    try {
        // 确保输出目录存在
        const outDir = path.join(__dirname, 'out', 'extension');
        await fs.mkdir(outDir, { recursive: true });

        const outResourcesDir = path.join(outDir);
        const repoMapEsDir = path.join(__dirname, 'res', 'repo-map');
        // 拷贝 repomap相关依赖
        await copyDir(repoMapEsDir, outResourcesDir);

        console.log('copy repo-map refs completed!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();