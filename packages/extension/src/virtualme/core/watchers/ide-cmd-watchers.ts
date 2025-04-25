import * as vscode from "vscode";
import {isCalculatingArtifact, isRecording, logs} from "../global";
import {handleCommand, isCommandSkipped} from "../../base/event-process/cmd-process";

/** IDE命令执行 */
export const IDECommandWatcher = vscode.commands.onDidExecuteCommand(async (event: vscode.Command) => {
    if (isCalculatingArtifact.value) {
        console.warn('Calculating artifact, skip command:', event.command)
        return
    }
    if (!isRecording) return
    if (isCommandSkipped(event.command)) {
        // console.warn('Command skipped:', event.command)
        return
    }

    const log = await handleCommand(event.command, event.arguments)
    logs.push(log)
})