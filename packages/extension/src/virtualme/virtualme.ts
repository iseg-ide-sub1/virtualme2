import * as vscode from 'vscode';
import * as utils from './base/utils';
import {deleteInnerCmdSeq} from './base/event-process/cmd-process';
import * as codeDiff from './base/code-diff/code-diff';

import { MessageSender } from './views/utils/MessageSender';
import { ControlViewProvider } from './views/ControlViewProvider';

import {RepoMap} from "../repomap/RepoMap";
import {
    logCheckInterval,
    logs,
    maxLogItemsNum,
    repoMap,
    saveDir,
    setExtensionPath,
    setRepoMap,
    snapshotInterval
} from "./core/global";

import {saveLogCommand, startCommand, stopCommand} from './core/commands';
import {
    changeActiveTextDocumentWatcher,
    closeTextDocumentWatcher,
    openTextDocumentWatcher,
    renameFileWatcher
} from './core/watchers/file-watchers';
import {addLastSelectLog, hoverCollector, selectTextWatcher} from './core/watchers/cursor-watchers';
import {changeTextDocumentWatcher} from './core/watchers/content-watchers';
import {
    terminalChangeWatcher,
    terminalCloseWatcher,
    terminalExecuteEndWatcher,
    terminalExecuteStartWatcher,
    terminalOpenWatcher
} from './core/watchers/terminal-watchers';
import {IDECommandWatcher} from "./core/watchers/ide-cmd-watchers";


function checkVersion() {
    try {
        const CommandWatcher = vscode.commands.onDidExecuteCommand((event: vscode.Command) => {
        });
    } catch (error) {
        vscode.window.showErrorMessage('VirtualMe 无法运行，请检查 VS Code 是否为定制内核！');
        return false;
    }
    return true;
}

// 初始化图形界面
function initViews(context: vscode.ExtensionContext) {
    const controlViewProvider = new ControlViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ControlViewProvider.viewType,
            controlViewProvider,
            {webviewOptions: { retainContextWhenHidden: true }}
        )
    );
}

export async function activate(context: vscode.ExtensionContext) {
    if (!checkVersion()) {
        return;
    }

    // 保存扩展路径
    setExtensionPath(context.extensionPath);

    // 初始化调试界面
    initViews(context);

    //注册命令
    context.subscriptions.push(
        startCommand,
        stopCommand,
        saveLogCommand
    );

    //注册文件监听器
    context.subscriptions.push(
        openTextDocumentWatcher,
        closeTextDocumentWatcher,
        changeActiveTextDocumentWatcher,
        renameFileWatcher
    );

    // 注册光标监听器
    context.subscriptions.push(
        selectTextWatcher,
        hoverCollector
    );

    // 注册文件内容监听器
    context.subscriptions.push(
        changeTextDocumentWatcher
    );

    // 注册终端监听器
    context.subscriptions.push(
        terminalOpenWatcher,
        terminalCloseWatcher,
        terminalChangeWatcher,
        terminalExecuteStartWatcher,
        terminalExecuteEndWatcher
    );

    // 注册IDE命令监听器
    context.subscriptions.push(
        IDECommandWatcher
    );

    //---------------------其他初始化任务--------------------------
    // 初始化repoMap
    setRepoMap(new RepoMap(context));
    if (repoMap) {
        repoMap.dynamicInit().then((res: any) => {
            console.log('repoMap inited:', res);
        }).catch(async (err: any) => {
            console.error(err);
            vscode.window.showErrorMessage('repoMap clear error:', err.message ? err.message : err);
        });
    } else {
        console.error('no repoMap found');
        vscode.window.showErrorMessage('repoMap clear error: no repoMap found');
    }

    // 初始化internal-git
    codeDiff.init().then((res) => {
        console.log(res);
    }).catch((err: any) => {
        console.error(err);
    });

    /** 每隔 logCheckInterval ms 更新一次日志数量和上一次操作的事件类型 */
    const logUpdater = setInterval(() => {
        deleteInnerCmdSeq(logs);
        if (logs.length >= maxLogItemsNum) {
            utils.saveLog().catch(e => {
                console.error(e);
            });
        }
        MessageSender.logsNumber(logs.length);
        MessageSender.logsPrev(
            logs.length === 0 ? "null" : logs[logs.length - 1].eventType.toString()
        );
    }, logCheckInterval);

    /** 每隔 snapshotInterval ms 保存一次快照 */
    const snapshotUpdater = setInterval(async () => {
        codeDiff.snapshot().then((res) => {
            console.log(res);
        }).catch(err => {
            console.error(err);
        });
    }, snapshotInterval);

    /** 销毁时清除定时任务 */
    context.subscriptions.push({
        dispose: () => {
            clearInterval(logUpdater);
            clearInterval(snapshotUpdater);
            console.log('Interval cleared.');
        },
    });
}


export function deactivate() {
    if (logs.length > 0) { // 如果还有没有保存的内容则自动保存
        addLastSelectLog();
        utils.saveLog().catch(e => {
            console.error(e);
        });
    }
}





