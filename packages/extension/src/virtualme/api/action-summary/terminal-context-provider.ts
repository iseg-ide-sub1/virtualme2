import {compareTimestamps, concatJSONFiles, getLogFilesRecent} from "./utils";
import path from "path";
import {getRepoFolder} from "../user-profile/utils";
import {saveLog} from "../../base/utils";

const sysPrompt = `
User: 
请提供最近几次终端执行记录，每条记录以以下格式呈现：
- 记录前缀包含执行命令的类型（如 [git]、[npm]、[python]、[docker] 等）和执行结果（✅成功/❌失败）。
- 记录主体是实际执行的命令及其输出摘要。

Agent: 
请基于提供的终端执行记录，分析开发者的行为并总结如下：

---
## **1. 执行情况概述**
- **(1) 任务目标**：
    - 推测程序员的核心任务，如代码提交、环境配置、构建部署等。
- **(2) 执行统计**：
  - ✅ **成功**：X / 总 Y 条
  - ❌ **失败**：Z / 总 Y 条
- **(3) 成功的影响**：归纳成功执行的命令如何影响代码库、环境或项目进展。
- **(4) 失败的主要原因**（若有）：总结导致失败的关键因素，如权限问题、缺失依赖等。

## **2. 行为链分析**
\`\`\`
[初始化] → [修改代码] → [git add] → [git commit] → (失败) [git push] ❌ → (改正错误) → [npm install] → [npm build] → (失败) [docker build] ❌
\`\`\`
---
请确保在大量执行记录的情况下，提炼关键行为，而非逐条复述。

`


export async function terminalContextProvider(getRawData: boolean = true, recentHours: number = 3): Promise<string> {
    return new Promise(async (resolve, reject) => {
        const repoFolder = getRepoFolder()
        if (!repoFolder) {
            return reject('No repository found');
        }

        saveLog(true).catch(e => {
            return reject(e)
        }).then(() => {
            const eventRoot = path.join(repoFolder, '.virtualme', 'event');
            const eventFiles = getLogFilesRecent(eventRoot, recentHours)
            if (eventFiles.length === 0) {
                return reject('No recent event files found');
            }

            const eventLogsConcat = concatJSONFiles(eventFiles, eventRoot)

            let terminalEvents: any[] = []
            for (const event of eventLogsConcat) {
                if (event['eventType'] === 'ExecuteTerminalCommand') {
                    terminalEvents.push(event)
                }
            }
            if (terminalEvents.length === 0) {
                return reject('No recent terminal events found');
            }
            terminalEvents.sort((a, b) => compareTimestamps(b['timeStamp'], a['timeStamp']))
            let terminalConcat = ''
            for (const event of terminalEvents) {
                const command = event['context']['content']['before']
                const stdout = event['context']['content']['after']
                terminalConcat += `${command}\n${stdout}\n`
            }

            if (getRawData) {
                return resolve(terminalConcat)
            }
            return reject('no chatbot')
        })
    })
}