import {AnalyzeResult} from "../utils";
import {getSnapshotHistoryConfig} from "./coding-productivity";
import fs from "fs";
import * as clustering from 'density-clustering';
import vscode from "vscode";
import path from "path";
import {runGitCommand} from "../../../base/code-diff/code-diff";


export interface SnapshotLines {
    timestamp: string;
    addedLines: number;
    removedLines: number;
}

export function dbscanByTimestamp(
    data: any[],
    eps: number, // 时间间隔阈值（毫秒）
    minPts: number // 最小邻居数量
): any[][] {
    // 如果输入为空，返回空数组
    if (!data || data.length === 0) return [];

    // 将数据转换为时间戳（毫秒）数组，并保持原始数据索引
    const timestamps = data.map(item => [new Date(item.timestamp).getTime()]);

    // 初始化 DBSCAN
    const dbscan = new clustering.DBSCAN();

    // 自定义距离函数：计算两个时间戳之间的毫秒差
    const distanceFunction = (a: number[], b: number[]) => {
        return Math.abs(a[0] - b[0]);
    };

    // 运行 DBSCAN 聚类
    const clusters = dbscan.run(timestamps, eps, minPts, distanceFunction);
    const noise = dbscan.noise;

    // 将聚类结果映射回原始数据
    const result: any[][] = clusters.map((cluster: any[]) =>
        cluster.map(index => data[index])
    );

    // 处理噪声点（可选：将每个噪声点作为单独的单点簇）
    if (noise.length > 0) {
        const noiseClusters = noise.map((index: string | number) => [data[index]]);
        result.push(...noiseClusters);
    }

    return result;
}

async function getSnapshotLinesFromUserGit(since?: Date): Promise<SnapshotLines[]> {
    return new Promise<SnapshotLines[]>(async (resolve, reject) => {
        // 执行 Git 命令获取日志
        const gitOutput = await runGitCommand([
            "log",
            "--pretty=format:%ad,%H", // 时间戳和 commit hash
            "--numstat",              // 添加和删除行数统计
            "--date=iso"              // ISO 格式时间戳
        ], true);

        if (!gitOutput.success) {
            console.error('runGitCommand error: ', gitOutput.data)
            return reject([])
        }

        try{
            // 将输出按行分割
            const lines = gitOutput.data.split("\n");
            let snapshots: SnapshotLines[] = [];
            let currentSnapshot: SnapshotLines | null = null;

            // 逐行解析输出
            for (const line of lines) {
                const trimmedLine = line.trim();

                // 如果是时间戳行（包含逗号且以数字开头）
                if (trimmedLine.includes(",") && /^\d/.test(trimmedLine)) {
                    const [timestamp] = trimmedLine.split(",", 1); // 只取时间戳部分
                    const date = new Date(timestamp);

                    // 跳过早于 since 的记录
                    if (since && date < since) {
                        continue;
                    }
                    currentSnapshot = {
                        timestamp: timestamp,
                        addedLines: 0,
                        removedLines: 0
                    };
                }
                // 如果是统计行（以数字开头）
                else if (currentSnapshot && /^\d/.test(trimmedLine)) {

                    const [added, removed] = trimmedLine.split("\t", 2); // 分割 added 和 removed
                    currentSnapshot.addedLines += parseInt(added, 10) || 0; // 转换为数字，处理 NaN
                    currentSnapshot.removedLines += parseInt(removed, 10) || 0;
                }
                // commit 结束行
                else {
                    if (currentSnapshot) {
                        snapshots.push(currentSnapshot);
                        currentSnapshot = null;
                    }
                }
            }

            // 添加最后一个 snapshot（如果有）
            if (currentSnapshot) {
                snapshots.push(currentSnapshot);
            }
            if (snapshots.length === 0) {
                return reject([])
            }

            return resolve(snapshots);
        } catch (e) {
            console.error('analysis error: ', e)
            return reject([])
        }
    })
}

export async function commitTypeAnalyze(since?: Date): Promise<AnalyzeResult> {
    return new Promise<AnalyzeResult>(async (resolve, reject) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return reject({
                success: false,
                error: "No workspace folder found."
            })
        }

        const gitDir = path.join(workspaceFolders[0].uri.fsPath, '.git/');
        if (!fs.existsSync(gitDir)) {
            return resolve({
                success: true,
                data: "User doesn't use git in this repository."
            })
        }

        //通过分析.git目录下的提交记录，计算commit类型分布
        await getSnapshotLinesFromUserGit(since).then(snapshotLines => {
            return resolve({
                success: true,
                data: JSON.stringify(snapshotLines)
            })
        }).catch(error => {
            return reject({
                success: false,
                error: error
            })
        })
    })
}

export function codingProdAnalyze(timeGranularity?: number): AnalyzeResult {
    const codingProdConfigPath = getSnapshotHistoryConfig()
    const codingProdConfig = JSON.parse(fs.readFileSync(codingProdConfigPath, 'utf8'))

    if (Object.keys(codingProdConfig).length === 0 || !codingProdConfig.history) {
        return {
            success: false,
            error: "No coding-productivity records found."
        }
    }
    timeGranularity = timeGranularity || 12 // 默认 12 小时为一个邻域

    if (timeGranularity < 1 || timeGranularity > 24) {
        return {
            success: false,
            error: "Time granularity should be between 1 and 24 hours."
        }
    }

    const snapshotHistory = codingProdConfig.history
    let clusteredSnapshots: SnapshotLines[][] = []

    try {
        clusteredSnapshots = dbscanByTimestamp(snapshotHistory, 1000 * 60 * 60 * timeGranularity, 1)
    } catch (e: any) {
        return {
            success: false,
            error: e.message,
        }
    }

    let maxProductivity = 0

    for (const cluster of clusteredSnapshots) {
        //净增加的代码行数 = 新增代码行数 - 删减代码行数，遍历clu中的每条记录，计算净增加的代码行数
        const addedLines = cluster.reduce((acc, cur) => acc + cur.addedLines, 0)
        const removedLines = cluster.reduce((acc, cur) => acc + cur.removedLines, 0)
        const netAddedLines = addedLines - removedLines
        const productivity = netAddedLines / timeGranularity
        maxProductivity = Math.max(maxProductivity, productivity)
    }

    return {
        success: true,
        data: `代码生产力推测最高峰值：${maxProductivity} 行/小时\n
        以下是原始的代码变更记录：\nsnapshotHistory: ${JSON.stringify(snapshotHistory)}`
    }
}