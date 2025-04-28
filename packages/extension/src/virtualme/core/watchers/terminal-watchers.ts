import * as vscode from "vscode";
import {isRecording, logs} from "../global";
import * as terminalProcess from "../../base/event-process/terminal-process";
import {
    getLogItemFromChangeTerminal,
    getLogItemFromCloseTerminal,
    getLogItemFromOpenTerminal,
    getLogItemFromTerminalExecute,
    TerminalInfo
} from "../../base/event-process/terminal-process";

let terminal_cache: terminalProcess.TerminalInfo[] = []
let currentTerminal: vscode.Terminal | undefined; // 记录当前活动终端


/** 打开终端 */
export const terminalOpenWatcher = vscode.window.onDidOpenTerminal(async (terminal: vscode.Terminal) => {
    if (!isRecording) return;

    const log = await getLogItemFromOpenTerminal(terminal)
    logs.push(log)
})

/** 关闭终端 */
export const terminalCloseWatcher = vscode.window.onDidCloseTerminal(async (terminal: vscode.Terminal) => {
    if (!isRecording) return;

    const log = await getLogItemFromCloseTerminal(terminal)
    logs.push(log)
})

/** 切换终端 */
export const terminalChangeWatcher = vscode.window.onDidChangeActiveTerminal(async (terminal: vscode.Terminal | undefined) => {
    if (!isRecording) return;

    if (!terminal) return; // 如果没有活动终端，则不记录
    const log = await getLogItemFromChangeTerminal(currentTerminal, terminal)
    currentTerminal = terminal; // 更新当前终端
    logs.push(log)
})


/** 终端执行开始，记录命令、输出 */
export const terminalExecuteStartWatcher = vscode.window.onDidStartTerminalShellExecution(async (event: vscode.TerminalShellExecutionStartEvent) => {
    if (!isRecording) return;

    const processId_ori = await event.terminal.processId;
    const processId = processId_ori ? processId_ori.toString() : 'unknown'
    const execution = event.execution;
    const cmd = execution.commandLine.value;
    const stream = execution.read();
    let output = '';

    let terminal_log = new TerminalInfo(
        processId,
        cmd,
        output,
    )
    terminal_cache.push(terminal_log)

    // console.log('terminal execute record start')
    for await (const data of stream) {
        output += data.toString();
    }
    // console.log('terminal execute record end')
    if (terminal_log.output.length > 0) { // 另一个watcher已经记录了成功情况
        output = terminal_log.output.concat(output)
        const log = getLogItemFromTerminalExecute(processId, cmd, output)
        logs.push(log)
        // 删除缓存中的这条记录
        for (let i = 0; i < terminal_cache.length; i++) {
            if (terminal_cache[i].equals(terminal_log)) {
                terminal_cache.splice(i, 1);
            }
        }
    } else { // 尚未记录成功情况，该记录留在缓存中
        terminal_log.output = output
    }
})

/** 终端执行结束，记录执行成功或失败 */
export const terminalExecuteEndWatcher = vscode.window.onDidEndTerminalShellExecution(async (event: vscode.TerminalShellExecutionEndEvent) => {
    if (!isRecording) return;

    const processId_ori = await event.terminal.processId;
    const processId = processId_ori ? processId_ori.toString() : 'unknown'
    const execution = event.execution;
    const exitCode = event.exitCode;
    const cmd = execution.commandLine.value;

    // 检查已缓存的terminal_logs中与之对应的命令，倒序遍历
    for (let i = terminal_cache.length - 1; i >= 0; i--) {
        const terminal_log = terminal_cache[i];
        if (terminal_log.processId === processId && terminal_log.cmd === cmd) { // 找到对应的记录，更新其输出内容和状态
            let tag = ''
            if (exitCode === undefined) {
                tag = 'Executed Unknown'
            } else if (exitCode === 0) {
                tag = 'Executed Successfully'
            } else {
                tag = 'Executed Failed'
            }

            if (terminal_log.output.length > 0) { // 另一个watcher已经记录了输出情况，对应另一个watcher的else分支
                const output = `<|${tag}|>${terminal_log.output}`
                const log = getLogItemFromTerminalExecute(processId, cmd, output)
                logs.push(log)
                // 从缓存中删除该记录
                terminal_cache.splice(i, 1)
            } else { // 尚未记录输出情况，对应另一个watcher的if分支
                terminal_log.output = `<|${tag}|>`
            }
            return
        }
    }
    console.warn('terminal execute end, no corresponding log found')
})
