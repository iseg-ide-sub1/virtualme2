import * as logItem from "../types/log-item"
import {EventType} from '../types/event-types'
import {getArtifactFromRange} from "./context-process";
import {Artifact, ArtifactType} from "../types/artifact";

const skippedCommands = [
    "setContext",
    '_workbench_openFolderSettings_file_',
    'vscode_executeDocumentSymbolProvider',
    'virtualme',
    'deleteLeft',
    'deleteRight',
    'deleteWordLeft',
    'deleteWordRight',
    'deleteAllLeft',
]

const innerCmd: Set<string> = new Set([
    'vscode_executeDefinitionProvider',
    'vscode_executeDocumentSymbolProvider',
    'vscode_executeTypeDefinitionProvider',
    'vscode_executeReferenceProvider',
    'vscode_prepareCallHierarchy',
    'vscode_provideIncomingCalls',
    'OpenTextDocument',
])

export function isCommandSkipped(commandName: string) {
    commandName = formatCommandName(commandName)
    for (const skippedCommand of skippedCommands) {
        if (commandName.includes(skippedCommand) || commandName === 'type') {
            return true
        }
    }
    return false
}

function formatCommandName(commandName: string) {
    return commandName.replace(/[.\-:#~ ]/g, '_');
}

function getEventTypeForCommand(commandName: string) {
    for (const eventType in EventType) {
        if (eventType === commandName) {
            return EventType[eventType as keyof typeof EventType]
        }
    }
    console.warn(`Command ${commandName} not found in EventType`)
    return EventType.Unknown
}

async function getArtifactFromCommand(args: any[] | undefined) {
    if (!args || args.length === 0)
        return new Artifact('null', ArtifactType.Null)
    if (args.length === 1 && args[0].fsPath) {  // 单个文件, 0是uri
        return new Artifact(args[0].fsPath, ArtifactType.File)
    }
    if (args.length === 1 && args[0].uri) {// 单个工件
        return await getArtifactFromRange(args[0].uri, args[0].range.start, args[0].range.end)
    }
    if (args.length === 2) { // 单个工件但是uri是0, pos是1
        return await getArtifactFromRange(args[0], args[1], args[1])
    }
    return new Artifact('null', ArtifactType.Null)
}

export function deleteInnerCmdSeq(logs: logItem.LogItem[], thr = 10) {
    let seqCount = 0;
    let i = 0;
    while (i < logs.length) {
        if (innerCmd.has(logs[i].eventType.toString())) {
            // console.log(logs[i].id, logs[i].eventType.toString());
            seqCount += 1;
            i += 1;
        } else {
            if (seqCount > thr) {
                let start = i - seqCount;
                logs.splice(start, seqCount);
                // console.warn('delete inner seq length: ', seqCount);
                i = start;
            } else {
                i += 1;
            }
            seqCount = 0;
        }
    }
    if (seqCount > thr) {
        let start = logs.length - seqCount;
        logs.splice(start, seqCount);
        // console.warn('delete inner seq length at end: ', seqCount);
    }
}

export async function handleCommand(commandName: string, args: any[] | undefined) {
    commandName = formatCommandName(commandName)
    const artifact = await getArtifactFromCommand(args)
    const eventType = getEventTypeForCommand(commandName)
    return new logItem.LogItem(eventType, artifact)
}




