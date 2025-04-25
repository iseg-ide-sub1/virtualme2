import {isRecording, saveDir} from "../../core/global";
import path from 'path';
import vscode from "vscode";
import * as fs from "node:fs";
import {getFormattedTime} from "../utils";
import {isFileSkipped} from "../event-process/file-process";
import {updateCodingProductivity} from "../../api/user-profile/snapshot/coding-productivity";

const {execSync} = require('child_process');


let fileHistory = new Set<string>();  // 保存每隔一段时间的文件修改路径
// const timer = new IntervalCalculateTimer(snapshot);  // 实例化一个定时器，每隔一段时间执行一次snapshot()函数
export class SnapshotItem {
    timestamp: string;
    snapshot: string;

    constructor(timestamp: string, snapshot: string) {
        this.timestamp = timestamp;
        this.snapshot = snapshot;
    }
}

let snapshotLog: SnapshotItem[] = [];

export function addFileToHistory(filePath: string): void {
    if (isFileSkipped(filePath)) {
        return
    }
    fileHistory.add(filePath);
}

function checkFileHistory() {
    const workTree = getWorkTree();
    if (!workTree) {
        fileHistory.clear()
        return
    }
    for (const file of fileHistory) {
        if (!fs.existsSync(file)) {
            fileHistory.delete(file)
        }
        //检查file是否在workTree文件夹内
        if (!file.startsWith(workTree)) {
            fileHistory.delete(file)
        }

    }
}


function getGitDir(useRepoGit: boolean = false): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return undefined;
    }

    let gitDir = ''
    if (useRepoGit) {
        gitDir = path.join(workspaceFolders[0].uri.fsPath, '.git/');
    } else {
        gitDir = path.join(workspaceFolders[0].uri.fsPath, saveDir.value, '.internal-git/');
    }

    if (!fs.existsSync(gitDir)) {
        fs.mkdirSync(gitDir, {recursive: true})
    }
    return gitDir;
}

function getWorkTree(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
}

export interface GitOutput {
    success: boolean;
    data: string;
}

export async function runGitCommand(args: string[], useRepoGit: boolean = false): Promise<GitOutput> {
    return new Promise(async (resolve, reject) => {
        const gitDir = getGitDir(useRepoGit);
        if (!gitDir) {
            return resolve({
                success: false,
                data: 'Git Error: No workspace folder found.'
            })
        }
        const workTree = getWorkTree();
        if (!workTree) {
            return resolve({
                success: false,
                data: 'Git Error: No workspace folder found.'
            })
        }

        args.unshift(`--work-tree=${workTree}`)
        args.unshift(`--git-dir=${gitDir}`)
        args.unshift('git')
        const cmd = args.join(' ')

        try {
            const output = execSync(cmd, {encoding: 'utf8'})
            return resolve({
                success: true,
                data: output
            })
        } catch (error: any) {
            return resolve({
                success: false,
                data: `Git Error: ${error.message}`
            })
        }
    })
}

function alreadyInit(): boolean {
    const gitDir = getGitDir();
    if (!gitDir) {
        return false
    }
    const files = fs.readdirSync(gitDir);
    return files.length !== 0;

}

export function init(): Promise<GitOutput> {
    return new Promise(async (resolve, reject) => {
        const workSpace = getWorkTree();
        if (!workSpace) {
            return resolve({
                success: false,
                data: 'Error: No workspace folder found.'
            });
        }
        const gitDir = getGitDir();
        if (!gitDir) {
            return resolve({
                success: false,
                data: 'Error: No gitDir found.'
            });
        }
        const files = fs.readdirSync(gitDir);
        if (files.length !== 0) {
            return resolve({
                success: false,
                data: 'Warn: Git already initialized'
            });
        }

        const gitignorePath = path.join(workSpace, '.gitignore');
        // 如果没有.gitignore文件，则创建
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, '', {
                flag: 'a+',
                encoding: 'utf8'
            });
        }
        // 检查gitignorePath文件中是否有.virtualme/，如果没有则添加
        const gitignoreContent = fs.readFileSync(gitignorePath, {
            encoding: 'utf8'
        });
        if (!gitignoreContent.includes('.virtualme/')) {
            fs.writeFileSync(gitignorePath, '\n.virtualme/\n', {
                flag: 'a+',
                encoding: 'utf8'
            });
        }

        const result = await runGitCommand(['init']);

        resolve(result)
    });
}


async function commit(filePaths: string[], commitMessage?: string): Promise<GitOutput> {
    return new Promise(async (resolve, reject) => {
        if (!commitMessage) {
            // 去掉空格
            commitMessage = getFormattedTime(true)
        }

        const addRet = await runGitCommand(['add', '-f'].concat(filePaths))
        if (!addRet.success) {
            return resolve(addRet)
        }

        const commitRet = await runGitCommand(['commit', '-m', commitMessage])
        return resolve(commitRet)
    })
}

/**
 * 快照功能，记录当前文件修改情况，并提交到本地仓库
 * @param commitMessage
 * @returns 快照内容, 仅供log，成功的话已保存，不需要其他处理
 */
export async function snapshot(commitMessage?: string): Promise<GitOutput> {
    return new Promise(async (resolve, reject) => {
        if (!isRecording) {
            return resolve({
                success: false,
                data: 'Recording is not enabled.'
            })
        }
        if (!alreadyInit()) {
            const initRet = await init()
            if (!initRet.success) {
                return resolve(initRet)
            }
        }

        checkFileHistory()
        if (fileHistory.size === 0) {
            return resolve({
                success: false,
                data: 'No file to commit.'
            })
        }

        const commitRet = await commit(Array.from(fileHistory), commitMessage)
        if (!commitRet.success) {
            return resolve(commitRet)
        }
        fileHistory.clear()  // 清空本次的文件路径记录

        const diffRet = await runGitCommand(['show', '--no-color', 'HEAD'])
        if (!diffRet.success) {
            return resolve(diffRet)
        }
        snapshotLog.push(new SnapshotItem(getFormattedTime(), diffRet.data))  // 记录快照
        return resolve(diffRet) // 返回快照内容，返回值仅供log，已保存，不需要其他处理
    })
}

export async function saveSnapshotLog(saveDirectory: string, saveName: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
        const snapshotRet = await snapshot()
        if (!snapshotRet.success) {
            console.error(snapshotRet.data)
        }

        if (snapshotLog.length === 0) {
            return resolve('No snapshot to save.')
        }

        updateCodingProductivity(snapshotLog).then(res => {
            console.log(res)
        }).catch(err => {
            console.error(err)
        })

        const snapshotLogJSON = JSON.stringify(snapshotLog, (key, value) => {
            return value;
        }, 2);
        saveDirectory = path.join(saveDirectory, 'snapshot')
        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, {recursive: true})
        }
        const savePath = path.join(saveDirectory, saveName + '_snapshot.json')
        fs.writeFileSync(savePath, snapshotLogJSON, {
            flag: 'a+',
            encoding: 'utf8'
        })

        snapshotLog = []  // 清空快照记录
        return resolve("Snapshot saved.")
    })

}