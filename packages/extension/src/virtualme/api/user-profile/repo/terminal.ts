import {LogItem} from "../../../base/types/log-item";
import {checkBaseConfigPath, getRepoFolder, userProfilePath} from "../utils";
import fs from "fs";
import path from "path";
import {EventType} from "../../../base/types/event-types";

function getTerminalConfigPath() {
    const repoPath = getRepoFolder();
    if (!repoPath) {
        return undefined;
    }
    checkBaseConfigPath(repoPath)

    const terminalConfigPath = path.join(userProfilePath, 'repo', path.basename(repoPath), "terminal.json");
    if (!fs.existsSync(terminalConfigPath)) {
        fs.writeFileSync(terminalConfigPath, '', 'utf8')
    }
    return terminalConfigPath;
}

class TerminalCommandInfo {
    public fixedTime: number[]
    public avgFixTime: number

    constructor(
        public cmdType: string,
        public count: number,
        public successCount: number,
        public successRate: number,
    ) {
        this.fixedTime = new Array(30).fill(0) // 每个类型的命令记录最近30次的修复用时, 单位为分钟
        this.avgFixTime = 0
    }

    addFixedTime(fixedTime: number[]) {
        fixedTime.forEach(time => {
            if (this.fixedTime.length >= 30) {
                this.fixedTime.shift()
            }
            this.fixedTime.push(time)
        })
    }

    setFixedTime(fixedTime: number[]) {
        this.fixedTime = fixedTime
    }

    setAvgFixTime(avgFixTime: number) {
        this.avgFixTime = avgFixTime
    }

    toJSONObject() {
        return {
            cmdType: this.cmdType,
            count: this.count,
            successCount: this.successCount,
            successRate: this.successRate,
            fixedTime: this.fixedTime,
            avgTime: this.avgFixTime
        }
    }
}

export function getInfoFromCommand(cmd: string, output: string): { cmdType: string, success: number } {
    const cmdFeatureMatch = cmd.match(/<\|[^|]*\|><\|([^|]*)\|>/);
    const cmdType = cmdFeatureMatch ? cmdFeatureMatch[1] : '';

    const tagMatch = output.match(/<\|([^|]*)\|>/);
    const tag = tagMatch ? tagMatch[1] : '';


    return {
        cmdType: cmdType,
        success: tag === 'Executed Successfully' ? 1 : 0
    };
}

export function updateTerminal(logs: LogItem[]): Promise<any> {
    return new Promise((resolve, reject) => {
        const terminalConfigPath = getTerminalConfigPath();
        if (!terminalConfigPath) {
            return reject("No terminal config found");
        }

        // 遍历日志，统计各命令类型执行次数和成功率
        let terminalCommands: TerminalCommandInfo[] = [];
        let notFixedCommands: { cmd: string, timeStamp: string }[] = [];

        function isNotFixed(cmd: string) {
            for (const notFixedCommand of notFixedCommands) {
                if (notFixedCommand.cmd === cmd) {
                    return true;
                }
            }
            return false;
        }

        function add2NotFixedCommands(cmd: string, timeStamp: string) {
            if (isNotFixed(cmd)) return
            notFixedCommands.push({cmd, timeStamp});
        }

        function remove2NotFixedCommands(cmd: string, timestamp: string): string {
            for (const notFixedCommand of notFixedCommands) {
                if (notFixedCommand.cmd === cmd) {
                    notFixedCommands.splice(notFixedCommands.indexOf(notFixedCommand), 1);
                    // console.log(`remove2NotFixedCommands: ${cmd}, ${timestamp}`)
                    return notFixedCommand.timeStamp;
                }
            }
            return timestamp;
        }

        for (const log of logs) {
            if (log.eventType !== EventType.ExecuteTerminalCommand) continue

            const timestamp = log.timeStamp;
            const cmd = log.context?.content.before;
            const output = log.context?.content.after;
            if (!cmd || !output) continue;

            const typeAndSuccess = getInfoFromCommand(cmd, output);
            const cmdType = typeAndSuccess.cmdType;
            const success = typeAndSuccess.success;
            let fixedTime = 0.0;

            if (!success) { // 如果该命令执行失败，则记录该命令类型和时间戳，以便后续计算该命令被解决用时
                add2NotFixedCommands(cmd, timestamp);
                // console.log(`add2NotFixedCommands: ${cmd}, ${timestamp}`)
            } else {
                fixedTime = Math.abs(
                        new Date(timestamp).getTime() - new Date(remove2NotFixedCommands(cmd, timestamp)).getTime())
                    / 60000;
                // console.log(`fixedTime: ${fixedTime} minutes`)
            }

            let terminalCommand = terminalCommands.find(tc => tc.cmdType === cmdType);
            if (!terminalCommand) { // 该次日志中第一次出现该命令类型
                terminalCommand = new TerminalCommandInfo(cmdType, 1, success, 0);
                terminalCommands.push(terminalCommand);
            } else { // 该次日志中已经出现过该命令类型
                terminalCommand.count++;
                terminalCommand.successCount += success;
                if (fixedTime > 0) { //如果该命令之前失败过，那么fixedTime会大于0，则记录这个修复用时，归类到该命令类型中
                    terminalCommand.addFixedTime([fixedTime]);
                }
            }
        }

        // 从terminalConfigPath中读取已有JSON数据
        let terminalConfig: TerminalCommandInfo[] = [];
        try {
            terminalConfig = JSON.parse(fs.readFileSync(terminalConfigPath, 'utf8'));
            // 转为TerminalCommandInfo[]
            terminalConfig = terminalConfig.map(tc => {
                const terminalCommandInfo = new TerminalCommandInfo(tc.cmdType, tc.count, tc.successCount, tc.successRate);
                terminalCommandInfo.setFixedTime(tc.fixedTime);
                terminalCommandInfo.setAvgFixTime(tc.avgFixTime);
                return terminalCommandInfo;
            });
        } catch (err) {
            terminalConfig = [];
            console.error('terminalConfig maybe empty: ', err);
        }


        // 更新terminalConfig
        for (const terminalCommand of terminalCommands) {
            const existTerminalCommand = terminalConfig.find(tc => tc.cmdType === terminalCommand.cmdType);
            if (existTerminalCommand) { // 已有数据中有该命令类型
                existTerminalCommand.count += terminalCommand.count;
                existTerminalCommand.successCount += terminalCommand.successCount;
                existTerminalCommand.addFixedTime(terminalCommand.fixedTime);
            } else { // 已有数据中没有该命令类型
                terminalConfig.push(terminalCommand);
            }
        }

        // 更新各命令类型成功率、平均修复用时
        for (const terminalCommand of terminalConfig) {
            if (terminalCommand.count === 0) {
                terminalCommand.successRate = 0;
            } else {
                terminalCommand.successRate = terminalCommand.successCount / terminalCommand.count;
            }
            // 除以非0即有意义的记录数量，计算平均修复用时
            terminalCommand.avgFixTime = terminalCommand.fixedTime.reduce((acc, cur) => acc + cur, 0) /
                terminalCommand.fixedTime.filter(t => t > 0).length;
        }

        // 更新terminalConfig
        try {
            // 写入terminalConfigPath
            fs.writeFileSync(terminalConfigPath, JSON.stringify(
                terminalConfig.map(tc => tc.toJSONObject())
                , null, 2), 'utf8');
        } catch (err) {
            return reject(err);
        }
        resolve('Update terminal config successfully')
    })
}