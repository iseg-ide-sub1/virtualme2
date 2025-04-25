import {exec} from "child_process";
import { promisify } from 'util';
import path from "path";
import fs from "fs";
const execPromise = promisify(exec);
export function compareTimestamps(a: string, b: string): number {
    // 将时间戳字符串转换为 Date 对象
    const dateA = new Date(a);
    const dateB = new Date(b);

    // 比较两个 Date 对象
    if (dateA < dateB) {
        return -1; // a 在 b 之前
    } else if (dateA > dateB) {
        return 1; // a 在 b 之后
    } else {
        return 0; // a 和 b 相同
    }
}

export async function runPythonScript(pyEnv: string, scriptPath: string, args: string[]): Promise<string> {
    const argsStr = args.join(" ");
    const command = `${pyEnv} ${scriptPath} ${argsStr}`;

    try {
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
            throw new Error(stderr);
        }
        // console.log('stdout', stdout.length);
        return stdout;
    } catch (error) {
        throw new Error(`Error running Python script: ${error}`);
    }
}

export function concatJSONFiles(files: string[], root: string): any[] {
    let ret: any[] = [];
    for (const file of files) {
        const filepath = path.join(root, file);
        let fileContent = fs.readFileSync(filepath, 'utf8');
        let fileData = JSON.parse(fileContent);
        ret = ret.concat(fileData);
    }
    return ret;
}

export function getLogFilesRecent(logRoot: string, recentHours: number = 3): string[] {
    const now = new Date();

    try {
        const allSnapshotFiles = fs.readdirSync(logRoot)
        return allSnapshotFiles.filter(file => {
            const fileStats = fs.statSync(path.join(logRoot, file));
            const fileDate = new Date(fileStats.mtime);
            const diffHours = Math.abs(now.getTime() - fileDate.getTime()) / 36e5;
            return diffHours <= recentHours;
        });
    } catch (e) {
        console.error(e);
        return [];
    }
}