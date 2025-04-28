import {AnalyzeResult} from "../utils";
import {getActionHabitConfigPath} from "./action-habit";
import fs from "fs";
import {dbscanByTimestamp} from "../snapshot/coding-prod-analyze";


export function actionHabitAnalyze(timeGranularity: number = 10): AnalyzeResult {
    const actionHabitConfigPath = getActionHabitConfigPath()
    const actionHabitConfig = JSON.parse(fs.readFileSync(actionHabitConfigPath, "utf-8"))

    const usualIDEEventTypes = actionHabitConfig.usualIDEEventTypes
    usualIDEEventTypes.sort((a: {
                                 name: string,
                                 count: number;
                             },
                             b: {
                                 name: string,
                                 count: number;
                             }) => b.count - a.count).slice(0, 10) //取前10个最常用的功能类型

    const autoCompleteTriggerTimestamps = actionHabitConfig.autoCompleteTriggerTimestamps

    try {
        //聚类时间段，防止过长时间内的自动补全之间的时间间隔被算入平均间隔
        const atCls = dbscanByTimestamp(
            autoCompleteTriggerTimestamps.map(timestamp => ({timestamp: timestamp})),
            1000 * 60 * timeGranularity, //默认10分钟为一个时间段
            1
        )
        let autoCompleteTriggerInterval = 0.0 //单位：分钟，保留两位小数
        for (const cls of atCls) {
            autoCompleteTriggerInterval += cls.slice(1).map((timestamp, index) => {
                return (new Date(timestamp.timestamp).getTime() - new Date(cls[index].timestamp).getTime()) / 1000 / 60 //单位：分钟
            }).reduce((acc, cur) => acc + cur, 0) / cls.length
        }
        autoCompleteTriggerInterval /= atCls.length //计算autoCompleteTriggerTimestamps的平均间隔时间

        return {
            success: true,
            data: JSON.stringify({
                "平均自动补全间隔时间(分钟)": autoCompleteTriggerInterval.toFixed(2),
                "常用功能类型次数排名": usualIDEEventTypes
            })
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message? error.message : error
        }
    }
}