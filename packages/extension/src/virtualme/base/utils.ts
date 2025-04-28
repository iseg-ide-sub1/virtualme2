import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import * as logItem from './types/log-item'
import {EventType} from './types/event-types'
import * as vscode from 'vscode'
import * as contextProcess from "./event-process/context-process";
import {logs, plugin_version, repoMap, saveDir} from '../core/global'
import * as git from "./code-diff/code-diff";
import {updateUserProfile} from "../api/user-profile/user-profile-updater";
import {deleteInnerCmdSeq} from "./event-process/cmd-process";
import {generateTrainData} from "./artifact-prediction/train-seq-preprocess";


export function concatEditLogs(log1: logItem.LogItem, log2: logItem.LogItem): logItem.LogItem[] {
    // 如果两个操作显然不能合并, 则直接返回两个操作
    if (log1.eventType != log2.eventType ||
        !log1.artifact.equals(log2.artifact) ||
        !log1.context ||
        !log2.context) {
        return [log1, log2]
    }
    const eventType = log1.eventType

    // 仅支持 AddTextDocument 和 DeleteTextDocument 的合并操作
    if (eventType != EventType.AddTextDocument && eventType != EventType.DeleteTextDocument) {
        return [log1, log2]
    } else {
        let log = new logItem.LogItem(log1.eventType, log1.artifact)
        // 如果log1.context.content.after包含以下字符，则说明上一次添加编辑有完成标志，此时不能合并，直接返回两个操作
        if (eventType == EventType.AddTextDocument &&
            (log1.context.content.after.includes('\n') ||
                log1.context.content.after.includes('\r') ||
                log1.context.content.after.includes('\t') ||
                log1.context.content.after.includes(' '))) {
            return [log1, log2]
        }
        // 合并上下文
        else {
            log.context = contextProcess.concatContexts(log1.context, log2.context)
        }
        return [log]
    }
}


/**
 * 获取格式化的当前时间字符串，包括年月日时分秒和毫秒。
 * @returns {string} 格式化的当前时间。
 * @param fileName 是否需要符合文件系统的命名格式
 */
export function getFormattedTime(fileName: boolean = false): string {
    const now = new Date()
    // 获取年月日小时分钟秒和毫秒
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // getMonth() 返回的月份从0开始，所以需要加1
    const day = now.getDate()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const milliseconds = now.getMilliseconds()

    // 格式化月份、日期、小时、分钟、秒和毫秒，不足两位数的前面补零
    const formattedMonth = month.toString().padStart(2, '0')
    const formattedDay = day.toString().padStart(2, '0')
    const formattedHours = hours.toString().padStart(2, '0')
    const formattedMinutes = minutes.toString().padStart(2, '0')
    const formattedSeconds = seconds.toString().padStart(2, '0')
    const formattedMilliseconds = milliseconds.toString().padStart(3, '0')

    // 组合成最终的字符串
    if (fileName) {
        return `${year}-${formattedMonth}-${formattedDay}-${formattedHours}.${formattedMinutes}.${formattedSeconds}.${formattedMilliseconds}`
    }
    return `${year}-${formattedMonth}-${formattedDay}-${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`

}

/**
 * 将日志列表转换为文本字符串
 * @param logs 日志列表
 * @returns 日志列表的字符串
 */
function logsToString(logs: logItem.LogItem[]): string {
    return JSON.stringify(logs, (key, value) => {
        return value;
    }, 2);
}

/**
 * 将内容保存到指定路径文件夹中
 * @param sync 是否等待代码快照保存完成，默认不等待
 */
export async function saveLog(sync: boolean = false): Promise<any> {
    return new Promise(async (resolve, reject) => {
        deleteInnerCmdSeq(logs)
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return reject('No workspace folder found.');
        }
        const saveDirectory = path.join(workspaceFolders[0].uri.fsPath, saveDir.value);

        if (!fs.existsSync(path.join(saveDirectory, 'event/'))) {
            fs.mkdirSync(path.join(saveDirectory, 'event/'), {recursive: true})
        }
        // 名称用日期
        const fileName = plugin_version + '_' + getFormattedTime(true)

        // 保存event===============================================
        const filePath = path.join(saveDirectory, "event", fileName + '.json')
        fs.writeFileSync(filePath, logsToString(logs), 'utf8')
        console.log('save event successfully.')

        // 保存snapshot============================================
        if (sync) {
            await git.saveSnapshotLog(saveDirectory, fileName)
        }else {
            git.saveSnapshotLog(saveDirectory, fileName).then(() => {
                console.log("save snapshot log success")
            }).catch(err => {
                reject(err)
            })
        }

        // 保存repomap=============================================
        if (!repoMap || !repoMap.isInitialized()) {
            console.error("repoMap is not initialized when save log")
        } else {
            const repoMapLogDir = path.join(saveDirectory, "repomap")
            if (!fs.existsSync(repoMapLogDir)) {
                fs.mkdirSync(repoMapLogDir, {recursive: true})
            }
            repoMap.exportRepoMap(path.join(repoMapLogDir, `${fileName}_repomap.json`)).then(() => {
                console.log("export repoMap success")
            }).catch((err: any) => {
                reject(err)
            })
        }

        //更新用户画像，传入副本防止后面清空导致logs变化====================
        updateUserProfile([...logs]).then(res => {
            console.log(res)
        }).catch(err => {
            reject(err)
        })

        // 生成用于工件预测的train data
        generateTrainData([...logs]).then(res => {
            console.log('generate train data success')
            const trainDataDir = path.join(saveDirectory, "train-data")
            fs.mkdirSync(trainDataDir, {recursive: true})
            fs.writeFileSync(path.join(trainDataDir, `${fileName}_train.json`), JSON.stringify(res), 'utf8')
        }).catch(err => {
            console.error(err)
            reject(err)
        })

        //清空logs
        logs.length = 0
        return resolve("log saved")
    })
}


// 辅助函数：将本地路径转换为file://格式的URL
export function convertToFilePathUri(filePath: string) {
    // 使用path模块规范化路径
    const normalizedPath = path.normalize(filePath)
    // 将路径中的反斜杠替换为正斜杠
    const slashPath = normalizedPath.replace(/\\/g, '/')
    // 使用url模块将路径转换为file://格式的URL
    const fileUri = url.format({
        protocol: 'file',
        slashes: true,
        pathname: slashPath
    })
    return fileUri
}


export class IntervalCalculateTimer {
    private intervalId: NodeJS.Timeout | null = null;

    constructor(private callback: () => void, private interval: number = 5 * 60 * 1000) {}

    start(): void {
        if (this.intervalId) {
            console.log('计时器已经在运行');
            return;
        }
        this.intervalId = setInterval(() => {
            this.stop();
            this.callback();
            this.start();
        }, this.interval);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}