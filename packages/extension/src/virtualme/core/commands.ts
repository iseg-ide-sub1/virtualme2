import * as vscode from "vscode";
import * as utils from '../base/utils'
import {startRecording, stopRecording} from "./global";


/** 命令：virtualme.start */
export const startCommand = vscode.commands.registerCommand('virtualme.start', () => {
    startRecording();
    vscode.window.showInformationMessage('VirtualMe 开始记录！');
});

/** 命令：virtualme.stop */
export const stopCommand = vscode.commands.registerCommand('virtualme.stop', () => {
    stopRecording();
    vscode.window.showInformationMessage('VirtualMe 暂停记录！');
});

/** 命令：保存日志 */
export const saveLogCommand = vscode.commands.registerCommand('virtualme.savelog', () => {
    utils.saveLog().catch(e => {
        console.error(e);
    });
    vscode.window.showInformationMessage('当前记录已保存');
});
