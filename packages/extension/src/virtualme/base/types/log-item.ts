import {getFormattedTime} from '../utils'
import {EventType} from './event-types'
import {Artifact} from "./artifact";

/**
 * 任务类型，用于标记开发者当前正在进行的任务状态
 */
export enum TaskType {
    /** 环境配置 */
    Configuration = "Configuration",
    /** 调查阅读 */
    View = "View",
    /** 编写内容 */
    Coding = "Coding",
    /** 执行验证 */
    Execution = "Execution",
    /** 中性操作 */
    Unknown = "Unknown"
}


export enum ContextType {
    Add = "Add",
    Delete = "Delete",
    Edit = "Edit",
    Redo = "Redo",
    Undo = "Undo",
    Select = "Select",
    Hover = "Hover",
    Terminal = "Terminal",
    Unknown = "Unknown"
}


export class Context {
    constructor(
        public type: ContextType,
        public content: { before: string, after: string },
        public start: { line: number, character: number },
        public end: { line: number, character: number }
    ) {
    }
}

export class LogItem {
    static #nextId = 1
    static currentTaskType: string = TaskType.Unknown
    id: number
    timeStamp: string
    eventType: EventType
    taskType: string
    artifact: Artifact
    context?: Context
    references?: Artifact[]

    constructor(eventType: EventType, artifact: Artifact, context?: Context, references?: Artifact[]) {
        this.id = LogItem.#nextId++
        this.taskType = LogItem.currentTaskType
        this.timeStamp = getFormattedTime()
        this.eventType = eventType
        this.artifact = artifact
        this.context = context
        this.references = references
    }

    toString(): string {
        let ret = ""
        // 如果需要，请对照 demo 重新实现一下
        return ret
    }
}
