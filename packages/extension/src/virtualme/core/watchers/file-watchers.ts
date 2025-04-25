import vscode from "vscode";
import {isCalculatingArtifact, isRecording, logs} from "../global";
import * as fileProcess from "../../base/event-process/file-process";
import * as codeDiff from "../../base/code-diff/code-diff";
import * as utils from "../../base/utils";
import path from "path";

let openFile: boolean = false // 是否打开了文件

/** 打开文件 */
export const openTextDocumentWatcher = vscode.workspace.onDidOpenTextDocument(doc => {
    if (!isRecording) return;

    openFile = true
    if (fileProcess.isFileSkipped(doc.uri.fsPath.toString())) return
    const log = fileProcess.getLogItemFromOpenTextDocument(doc.uri.fsPath.toString())
    if (!isCalculatingArtifact.value) {
        logs.push(log)
    }
})

/** 关闭文件 */
export const closeTextDocumentWatcher = vscode.workspace.onDidCloseTextDocument(doc => {
    if (!isRecording) return;

    if (fileProcess.isFileSkipped(doc.uri.fsPath.toString())) return
    const log = fileProcess.getLogItemFromCloseTextDocument(doc.uri.fsPath.toString())
    if (!isCalculatingArtifact.value) {
        logs.push(log)
    }
})

/** 切换当前文件 */
export const changeActiveTextDocumentWatcher = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (!isRecording) return;

    // 若当前关闭所有编辑视图，editor 值为 undefined
    // 切换编辑视图，会触发两次此事件，第一次 editor 值为 undefined
    if (editor === undefined || openFile) {
        openFile = false
        return
    }
    openFile = false
    const log = fileProcess.getLogItemFromChangeTextDocument(editor.document.uri.fsPath.toString())
    logs.push(log)
})

if (vscode.workspace.workspaceFolders) {
    const filesWatcher = vscode.workspace.createFileSystemWatcher('**/*')
    /** 文件保存 */
    filesWatcher.onDidChange(uri => {
        if (!isRecording) return;
        if (fileProcess.isFileSkipped(uri.fsPath.toString())) return
        codeDiff.addFileToHistory(uri.fsPath.toString())

        const log = fileProcess.getLogItemFromSaveFile(uri.fsPath.toString())
        logs.push(log)
    })
    /** 文件创建 */
    filesWatcher.onDidCreate(uri => {
        if (!isRecording) return;
        if (fileProcess.isFileSkipped(uri.fsPath.toString())) return
        codeDiff.addFileToHistory(uri.fsPath.toString())

        const log = fileProcess.getLogItemFromCreateFile(uri.fsPath.toString())
        logs.push(log)
    })
    /** 文件删除 */
    filesWatcher.onDidDelete(uri => {
        if (!isRecording) return;
        if (fileProcess.isFileSkipped(uri.fsPath.toString())) return
        codeDiff.addFileToHistory(uri.fsPath.toString())

        const log = fileProcess.getLogItemFromDeleteFile(uri.fsPath.toString())
        logs.push(log)
    })
} else {
    vscode.window.showInformationMessage('No workspace folders are open.')
}

/** 文件重命名或移动 */
export const renameFileWatcher = vscode.workspace.onDidRenameFiles((event) => {
    if (!isRecording) return;

    for (const rename of event.files) {
        const oldPath = rename.oldUri.fsPath
        const newPath = rename.newUri.fsPath
        const oldUri = utils.convertToFilePathUri(oldPath)
        const newUri = utils.convertToFilePathUri(newPath)
        if (fileProcess.isFileSkipped(oldUri.toString())) continue
        if (fileProcess.isFileSkipped(newUri.toString())) continue
        codeDiff.addFileToHistory(newUri.toString())

        // 检查路径是否发生变化
        if (path.dirname(oldPath) === path.dirname(newPath)) {
            // 文件名改变了，认为是重命名
            const log = fileProcess.getLogItemFromRenameFile(oldUri, newUri)
            logs.push(log)
        } else {
            // 路径改变了，认为是移动
            const log = fileProcess.getLogItemFromMoveFile(oldUri, newUri)
            logs.push(log)
        }
    }
})
