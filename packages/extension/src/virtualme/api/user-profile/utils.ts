import vscode from "vscode";
import path from "path";
import fs from "fs";
import * as os from "node:os";

export interface AnalyzeResult {
    success: boolean;
    error?: string;
    data?: string;
}

export const userProfilePath = path.join(os.homedir(), ".virtual-me", "user-profile")
if (!fs.existsSync(userProfilePath)) fs.mkdirSync(userProfilePath, {recursive: true})

export function getRepoFolder() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
}

export function checkBaseConfigPath(repoPath: string): string {
    const baseConfigPath = path.join(userProfilePath, 'repo', path.basename(repoPath), "base.json");
    if (!fs.existsSync(baseConfigPath)) {
        fs.mkdirSync(path.join(userProfilePath, 'repo', path.basename(repoPath)), {recursive: true})
        fs.writeFileSync(baseConfigPath, JSON.stringify({
            "name": getRepoFolder(),
            "lastUpdate": '2011-10-10T14:48:00.000+09:00',
            "createdDate": new Date().toISOString(),
            "README": "",
            "cyclissity": ""
        }, null, 2), 'utf8');
    }
    return baseConfigPath;
}

export function* walkDir(dir: string): Generator<string> {
    const files = fs.readdirSync(dir, {withFileTypes: true});

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            yield* walkDir(fullPath);
        } else {
            yield fullPath;
        }
    }
}
