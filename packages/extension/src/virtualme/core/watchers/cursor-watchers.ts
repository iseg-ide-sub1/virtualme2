import vscode from "vscode";
import {isRecording, logs} from "../global";
import * as contextProcess from "../../base/event-process/context-process";
import * as logItem from "../../base/types/log-item";

// 用于合并选择操作
let lastSelectStamp: number = 0;
let lastSelectStart: vscode.Position;
let lastSelectEnd: vscode.Position;
let lastSelectLog: logItem.LogItem;

/** 用光标选择文本内容 */
export const selectTextWatcher = vscode.window.onDidChangeTextEditorSelection(async event => {
    if (!isRecording) return;

    const selection = event.selections[0] // 只考虑第一个选区
    if (selection.isEmpty) return // 只有选择内容不为空才记录
    if (event.textEditor.document.uri.scheme !== 'file') return // 非文件不记录
    const start = selection.start // 选择开始位置
    const end = selection.end // 选择结束位置
    const document = event.textEditor.document // 当前编辑的文件
    const log = await contextProcess.getLogItemFromSelectedText(document, start, end)
    if (lastSelectStamp !== 0) {
        if (new Date().getTime() - lastSelectStamp > 2000 || start.compareTo(lastSelectStart) > 0 || end.compareTo(lastSelectEnd) < 0) {
            // 不满足合并条件，不能合并，将上一次选区操作放入记录
            logs.push(lastSelectLog)
        }
    }
    // console.log(log)
    // 满足条件合并上一次选区记录
    lastSelectLog = log
    lastSelectStamp = new Date().getTime()
    lastSelectStart = start
    lastSelectEnd = end
})

export function addLastSelectLog() {
    if (lastSelectLog) logs.push(lastSelectLog);
}

/** 鼠标悬停触发hover事件 */
export const hoverCollector = vscode.languages.registerHoverProvider('*', {
    async provideHover(document: vscode.TextDocument,
                       position: vscode.Position,
                       token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
        if (!isRecording) return;

        // 等待2秒，为了减少hover事件的触发频率
        const hoverTimeout = new Promise<{ cancelled: boolean }>((resolve) => {
            const timer = setTimeout(() => resolve({cancelled: false}), 1000); // 1秒延迟
            token.onCancellationRequested(() => {
                clearTimeout(timer);
                resolve({cancelled: true}); // 如果取消请求，则清除计时器
            });
        })

        // 如果1秒内被取消，返回 undefined，否则继续处理
        const timedOut = await hoverTimeout;
        if (timedOut.cancelled) {
            return undefined; // 悬停时间不足，退出
        }

        // 延迟后继续执行逻辑
        const log = await contextProcess.getLogItemsFromHoverCollector(document, position)
        logs.push(log)
        return undefined;
    }
})