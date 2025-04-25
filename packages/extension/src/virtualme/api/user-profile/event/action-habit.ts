import path from "path";
import {userProfilePath} from "../utils";
import fs from "fs";
import {LogItem} from "../../../base/types/log-item";
import {EventType} from "../../../base/types/event-types";


export function getActionHabitConfigPath() {
    const actionHabitConfigPath = path.join(userProfilePath, 'event', "action-habit.json");
    if (!fs.existsSync(actionHabitConfigPath)) {
        fs.writeFileSync(actionHabitConfigPath, JSON.stringify({
            autoCompleteTriggerTimestamps: [],
            usualIDEEventTypes: []
        }), 'utf8')
    }
    return actionHabitConfigPath;
}

const autoCompleteEventTypes = [
    "editor_action_inlineSuggest_trigger",
    "editor_action_inlineSuggest_triggerInlineEditExplicit",
    "editor_action_inlineSuggest_triggerInlineEdit"
]

const usualIDEEventTypes = [
    "CreateFile",
    "DeleteFile",
    "AddTextDocument",
    "AddTextDocument",
    "DeleteTextDocument",
    "EditTextDocument",
    "RedoTextDocument",
    "UndoTextDocument",
    "SelectText",
    "MouseHover",
    "ExecuteTerminalCommand",
    "undo",
    "redo",
    "editor_action_selectAll",
    "tab",
    "deleteLeft",
    "deleteRight",
    "editor_action_quickFix",
    "editor_action_refactor",
    "editor_action_sourceAction",
    "editor_action_organizeImports",
    "editor_action_autoFix",
    "editor_action_fixAll",
    "editor_action_formatDocument",
    "editor_action_formatSelection",
    "editor_action_format",
    "editor_action_commentLine",
    "editor_action_addCommentLine",
    "editor_action_removeCommentLine",
    "autoComplete"
]

export function updateActionHabit(logs: LogItem[]): Promise<any> {
    return new Promise((resolve, reject) => {
        const actionHabitConfigPath = getActionHabitConfigPath();
        const actionHabitConfig = JSON.parse(fs.readFileSync(actionHabitConfigPath, 'utf8'))

        for (const log of logs) {
            const eventType = log.eventType

            if (autoCompleteEventTypes.includes(eventType)) { //统计代码补全的使用间隔
                if (!actionHabitConfig.autoCompleteTriggerTimestamps || actionHabitConfig.autoCompleteTriggerTimestamps.length === 0) {
                    actionHabitConfig.autoCompleteTriggerTimestamps = [log.timeStamp]
                } else {
                    actionHabitConfig.autoCompleteTriggerTimestamps.push(log.timeStamp)
                    if (actionHabitConfig.autoCompleteTriggerTimestamps.length > 300) {
                        actionHabitConfig.autoCompleteTriggerTimestamps.shift()
                    }
                }

                if (!actionHabitConfig.usualIDEEventTypes ||
                    actionHabitConfig.usualIDEEventTypes.length === 0 ||
                    !actionHabitConfig.usualIDEEventTypes.some((event: {
                        name: string;
                        count: number;
                    }) => event.name === "autoComplete")) {
                    actionHabitConfig.usualIDEEventTypes = [{name: "autoComplete", count: 1}]
                } else {
                    actionHabitConfig.usualIDEEventTypes.forEach((event: { name: "autoComplete"; count: number; }) => {
                        if (event.name === "autoComplete") {
                            event.count += 1
                        }
                    })
                }
            } else if (usualIDEEventTypes.includes(eventType)) { //统计常用IDE的事件类型
                if (!actionHabitConfig.usualIDEEventTypes || actionHabitConfig.usualIDEEventTypes.length === 0) {
                    actionHabitConfig.usualIDEEventTypes = [{name: eventType, count: 1}]
                    continue
                }

                actionHabitConfig.usualIDEEventTypes.forEach((event: { name: EventType; count: number; }) => {
                    if (event.name === eventType) {
                        event.count += 1
                    }
                })
            }
        }

        try {
            fs.writeFileSync(actionHabitConfigPath, JSON.stringify(actionHabitConfig), 'utf8')
            return resolve("Action habit updated successfully")
        } catch (error) {
            return reject(error)
        }
    })
}