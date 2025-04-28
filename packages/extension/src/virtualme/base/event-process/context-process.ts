import * as vscode from 'vscode'
import * as logItem from "../types/log-item"
import {EventType} from '../types/event-types'
import {Artifact, ArtifactType} from "../types/artifact";

/**
 * 将 SymbolKind 枚举值转换为对应的 ArtifactType 枚举描述。
 * @param kind SymbolKind 枚举值。
 * @returns 对应的 ArtifactType 枚举值。
 */
function getArtifactTypeFromSymbolKind(kind: vscode.SymbolKind): ArtifactType {
    switch (kind) {
        case vscode.SymbolKind.File:
            return ArtifactType.File
        case vscode.SymbolKind.Module:
            return ArtifactType.Module
        case vscode.SymbolKind.Namespace:
            return ArtifactType.Namespace
        case vscode.SymbolKind.Package:
            return ArtifactType.Package
        case vscode.SymbolKind.Class:
            return ArtifactType.Class
        case vscode.SymbolKind.Method:
            return ArtifactType.Method
        case vscode.SymbolKind.Property:
            return ArtifactType.Property
        case vscode.SymbolKind.Field:
            return ArtifactType.Field
        case vscode.SymbolKind.Constructor:
            return ArtifactType.Constructor
        case vscode.SymbolKind.Enum:
            return ArtifactType.Enum
        case vscode.SymbolKind.Interface:
            return ArtifactType.Interface
        case vscode.SymbolKind.Function:
            return ArtifactType.Function
        case vscode.SymbolKind.Variable:
            return ArtifactType.Variable
        case vscode.SymbolKind.Constant:
            return ArtifactType.Constant
        case vscode.SymbolKind.String:
            return ArtifactType.String
        case vscode.SymbolKind.Number:
            return ArtifactType.Number
        case vscode.SymbolKind.Boolean:
            return ArtifactType.Boolean
        case vscode.SymbolKind.Array:
            return ArtifactType.Array
        case vscode.SymbolKind.Object:
            return ArtifactType.Object
        case vscode.SymbolKind.Key:
            return ArtifactType.Key
        case vscode.SymbolKind.Null:
            return ArtifactType.Null
        case vscode.SymbolKind.EnumMember:
            return ArtifactType.EnumMember
        case vscode.SymbolKind.Struct:
            return ArtifactType.Struct
        case vscode.SymbolKind.Event:
            return ArtifactType.Event
        case vscode.SymbolKind.Operator:
            return ArtifactType.Operator
        case vscode.SymbolKind.TypeParameter:
            return ArtifactType.TypeParameter
        default:
            return ArtifactType.Unknown
    }
}

/**
 * 获取文件的对于给定范围的工件信息（包含当前位置的工件信息和当前位置的工件层级）
 * @param uri 给定文件的uri即路径
 * @param start 给定范围开始位置
 * @param end 给定范围结束位置
 * @param getRef 是否获取引用信息
 * @returns 给定范围的工件信息
 */
export async function getArtifactFromRange(
    uri: vscode.Uri,
    start: vscode.Position,
    end: vscode.Position,
): Promise<Artifact> {

    let hierarchy: Artifact[] = [
        new Artifact(uri.fsPath.toString(), ArtifactType.File)
    ]
    // isCalculatingArtifact.value += 1 // 标记计算引用信息开始
    // 获取该文件的符号表
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider', uri
    )

    if (!symbols) {
        // isCalculatingArtifact.value -= 1
        return hierarchy[0]
    } // 没有符号，直接返回
    let curSymbols = symbols // 当前层级的符号表
    let symbolSelf: vscode.DocumentSymbol | undefined
    while (curSymbols.length > 0) {
        let isFind: boolean = false
        for (const symbol of curSymbols) {
            if (symbol.range.contains(start) && symbol.range.contains(end)) {
                // 构造hierarchy
                hierarchy.push(new Artifact(
                    symbol.name,
                    getArtifactTypeFromSymbolKind(symbol.kind),
                    symbol.range.start.line,
                    symbol.range.end.line,
                ))
                // 继续查找下一层级
                curSymbols = symbol.children
                symbolSelf = symbol
                isFind = true
                break
            }
        }
        if (!isFind) break // 没有找到，退出循环
    }
    // console.log('hierarchy =',hierarchy)
    const artifactSelf = hierarchy[hierarchy.length - 1]
    const startPos = symbolSelf?.range.start.line || 0
    const endPos = symbolSelf?.range.end.line || 0
    // console.log('startPos',startPos,'endPos',endPos)
    return new Artifact(
        artifactSelf.name,
        artifactSelf.type,
        startPos,
        endPos,
        hierarchy,
    )
}

/**
 * 从选中的文本中获取 LogItem 对象
 * @param document 当前文本文件的文件对象
 * @param start 选择开始位置
 * @param end 选择结束位置
 * @returns 返回 LogItem 对象
 */
export async function getLogItemFromSelectedText(
    document: vscode.TextDocument,
    start: vscode.Position,
    end: vscode.Position
): Promise<logItem.LogItem> {
    const eventType = EventType.SelectText
    const artifact = await getArtifactFromRange(document.uri, start, end)
    const context = new logItem.Context(
        logItem.ContextType.Select,
        {
            before: '',
            after: document.getText(new vscode.Range(start, end))
        },
        {
            line: start.line + 1,
            character: start.character + 1
        },
        {
            line: end.line + 1,
            character: end.character + 1
        }
    )
    return new logItem.LogItem(eventType, artifact, context);
}


export function concatContexts(
    context1: logItem.Context,
    context2: logItem.Context
): logItem.Context {
    if (context1.type !== context2.type)
        throw new Error('Cannot concat contexts of different types')
    const contextType = context1.type
    let content = {before: "", after: ""}
    const start = {
        line: Math.min(context1.start.line, context2.start.line),
        character: Math.min(context1.start.character, context2.start.character)
    };
    const end = {
        line: Math.max(context1.end.line, context2.end.line),
        character: Math.max(context1.end.character, context2.end.character)
    };

    if (contextType === logItem.ContextType.Add) {
        content.before = context1.content.before
        content.after = context1.content.after + context2.content.after
    } else if (contextType === logItem.ContextType.Delete) {
        content.before = context2.content.before + context1.content.before
        content.after = context2.content.after
    } else {
        throw new Error('Unsupported context type')
    }

    return new logItem.Context(
        contextType,
        content,
        start,
        end
    )
}

/**
 * 从文本内容改变事件中获取 LogItem 对象
 * @param event 文本内容改变事件
 * @param lastText 文本内容改变之前的内容
 * @returns 返回 LogItem 对象
 */
export async function getLogItemsFromChangedText(
    event: vscode.TextDocumentChangeEvent,
    lastText: string
): Promise<logItem.LogItem[]> {
    let logItems: logItem.LogItem[] = [] // 存放返回的 LogItem，每个修改对应一个 LogItem
    let document = event.document
    let reason = event.reason // 文件修改的原因，可能是 Undo、Redo 和 Undefined
    for (let change of event.contentChanges) { // 遍历每次修改的内容
        let start = change.range.start
        let end = change.range.end
        let eventType: EventType = EventType.EditTextDocument
        let contextType: logItem.ContextType = logItem.ContextType.Edit
        let before: string = ''
        let after: string = change.text // 增加的内容

        if (change.rangeLength > 0) { // 说明有删除内容
            // console.log('lastText: ', lastText)
            try {
                before = lastText.substring(change.rangeOffset, change.rangeOffset + change.rangeLength)
            } catch (e) {
                console.error(e)
            }
        }
        if (reason === vscode.TextDocumentChangeReason.Undo) {
            eventType = EventType.UndoTextDocument
            contextType = logItem.ContextType.Undo
        } else if (reason === vscode.TextDocumentChangeReason.Redo) {
            eventType = EventType.RedoTextDocument
            contextType = logItem.ContextType.Redo
        } else {
            if (before !== '' && after !== '') { // 删除和增加内容均有，说明是修改操作
                eventType = EventType.EditTextDocument
                contextType = logItem.ContextType.Edit
            } else if (before !== '') { // 只有删除内容，说明是删除操作
                eventType = EventType.DeleteTextDocument
                contextType = logItem.ContextType.Delete
            } else if (after !== '') { // 只有增加内容，说明是增加操作
                eventType = EventType.AddTextDocument
                contextType = logItem.ContextType.Add
            }
        }

        // console.log('before',before,'after',after)
        const artifact = await getArtifactFromRange(document.uri, start, end)
        const context = new logItem.Context(
            contextType,
            {
                before,
                after
            },
            {
                line: start.line + 1,
                character: start.character + 1
            },
            {
                line: end.line + 1,
                character: end.character + 1
            }
        )
        logItems.push(new logItem.LogItem(eventType, artifact, context))
    }
    return logItems
}

/**
 * 从光标悬停事件中获取 LogItem 对象
 * @param document 鼠标悬停对于的文档
 * @param position  鼠标悬停的位置
 * @returns 返回 LogItem 对象
 */
export async function getLogItemsFromHoverCollector(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<logItem.LogItem> {
    let range = document.getWordRangeAtPosition(position)
    if (!range) range = new vscode.Range(position, position.translate(0, 1))
    const eventType = EventType.MouseHover
    const artifact = await getArtifactFromRange(document.uri, range.start, range.end)
    const context = new logItem.Context(
        logItem.ContextType.Hover,
        {
            before: '',
            after: document.getText(range)
        },
        {
            line: range.start.line + 1,
            character: range.start.character + 1
        },
        {
            line: range.end.line + 1,
            character: range.end.character + 1
        }
    )
    return new logItem.LogItem(eventType, artifact, context);
}

/**
 * 从 Debug Console 输出中获取 LogItem 对象
 * @param output Debug Console 输出对象
 * @returns LogItem 对象
 */
export async function getLogItemFromDebugConsole(
    output: { output: string, category?: string, line?: number }
): Promise<logItem.LogItem> {
    const eventType = EventType.DebugConsoleOutput

    // 获取当前活动的编辑器和文档
    const editor = vscode.window.activeTextEditor
    let artifact: Artifact

    if (editor) {
        // 如果有活动的编辑器，获取当前文件的工件信息
        artifact = await getArtifactFromRange(
            editor.document.uri,
            editor.selection.start,
            editor.selection.end,
        )
    } else {
        // 如果没有活动的编辑器，创建一个基础的工件信息
        artifact = new Artifact(
            'Debug Console',
            ArtifactType.Unknown
        )
    }

    // 创建上下文信息
    const context = new logItem.Context(
        logItem.ContextType.Unknown,
        {
            before: '',
            after: output.output
        },
        {
            line: output.line || 0,
            character: 0
        },
        {
            line: output.line || 0,
            character: output.output.length
        }
    )

    return new logItem.LogItem(eventType, artifact, context)
}
