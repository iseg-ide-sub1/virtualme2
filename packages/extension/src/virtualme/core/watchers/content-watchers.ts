import * as vscode from "vscode";
import {isRecording, logs, setLogs} from "../global";
import {isFileSkipped} from "../../base/event-process/file-process";
import {addFileToHistory} from "../../base/code-diff/code-diff";
import {getLogItemsFromChangedText} from "../../base/event-process/context-process";
import {concatEditLogs} from "../../base/utils";


let lastText: string // 保存上一次编辑后的代码
/** 修改文件内容(新增、删除、修改、Redo、Undo) */
export const changeTextDocumentWatcher = vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
    if (!isRecording) return;
    if (isFileSkipped(event.document.uri.fsPath.toString())) return
    addFileToHistory(event.document.uri.fsPath.toString())

    if (event.contentChanges.length === 0) { // 脏状态改变
        lastText = event.document.getText()
        return
    }
    if (event.document.uri.scheme !== 'file') return // 非文件不记录
    let changeLogs = await getLogItemsFromChangedText(event, lastText)
    lastText = event.document.getText()
    // 重写合并逻辑，当用户手敲代码时，每次敲击键盘会被单独记录一次，形成长度为1的changeLogs，只检查这种情况下能否合并
    if (changeLogs.length !== 1 || logs.length === 0) {
        setLogs(logs.concat(changeLogs))
        return
    }
    // 合并日志
    let curLog = changeLogs[0]
    let lastLog = logs[logs.length - 1]
    const concatLogs = concatEditLogs(lastLog, curLog)
    logs.pop()
    setLogs(logs.concat(concatLogs))
})
