import {concatJSONFiles, getLogFilesRecent} from "./utils";
import path from "path";
import {getRepoFolder} from "../user-profile/utils";
import {saveLog} from "../../base/utils";

const sysPrompt = `
User: 
请提供近期的几次 Git commit 记录，每条记录包含：
- 提交信息（commit message）
- 代码变更摘要（diff 关键部分）

Agent: 
请基于提供的 Git commit 记录，总结代码变更的主要内容，并以以下格式输出：

---
## **1. 代码变更摘要**
- **(1) 任务目标**：推测程序员执行的任务（如修复 Bug、新增功能、优化性能等）。
- **(2) 变更动机**：分析可能的原因（如用户反馈、代码重构、依赖升级等）。
- **(3) 影响范围**：
  - **受影响模块**：列出涉及的主要文件或模块（如 auth.js, database.js）。
  - **潜在影响**：推测此变更可能对系统的影响（如功能增强、潜在风险等）。

## **2. 行为链分析（Chain of Actions）**
\`\`\`
[开始修改] → [调整 auth.js 修复 token 解析] → [优化 sessionManager.js 处理错误] → [新增 exportData.js 处理数据导出] → [更新 dashboard.js UI 添加导出按钮] → [提交代码]
\`\`\`
---
请确保在处理大量 commit 记录时，提炼核心变更内容，并通过行为链分析体现开发者的操作顺序。

`

/**
 * 从最近的快照文件中获取代码差异的上下文。
 *
 * @param getRawData - (可选) 是否获取原始数据，默认为 true。是则获取"总结prompt + raw data"，此供调试使用。否则内部调用大模型获取"总结摘要"。
 * @param recentHours - (可选) 用于确定文件是否为最近的时间范围（以小时为单位），默认为 3。
 * @returns 一个 Promise，解析为包含代码差异上下文的字符串。
 */
export async function codeDiffContextProvider(getRawData: boolean = true, recentHours: number = 3): Promise<string> {
    return new Promise(async (resolve, reject) => {
        const repoFolder = getRepoFolder()
        if (!repoFolder) {
            return reject('No repository found');
        }
        saveLog(true).catch(e => {
            return reject(e)
        }).then(() => {
            const snapshotRoot = path.join(repoFolder, '.virtualme', 'snapshot');
            const snapshotFiles = getLogFilesRecent(snapshotRoot, recentHours)
            if (snapshotFiles.length === 0) {
                return reject('No recent snapshot files found');
            }

            const snapShotConcat: string = JSON.stringify(concatJSONFiles(snapshotFiles, snapshotRoot))

            if (getRawData) {
                return resolve(snapShotConcat)
            }
            return reject('no chatbot')
        })
    })
}