import {AnalyzeResult} from "../utils";
import {ActivityTimePer, getActivityTimeConfigPath} from "./activity-time";
import fs from "fs";

const activityTimePerMap = {
    [ActivityTimePer.Month]: 31,
    [ActivityTimePer.Day]: 24
}

function getActivityTimeMap(per: ActivityTimePer, since?: Date): number[] {
    const activityTimeConfigPath = getActivityTimeConfigPath();
    const activityTimeConfig = JSON.parse(fs.readFileSync(activityTimeConfigPath, 'utf8'));
    const activityTimeMap = new Array(activityTimePerMap[per]).fill(0);

    if (Object.keys(activityTimeConfig).length === 0) return activityTimeMap

    const filterYear = since ? since.getFullYear() : undefined;
    const filterMonth = since ? since.getMonth() + 1 : undefined;
    const filterDay = since ? since.getDate() : undefined;
    const filterHour = since ? since.getHours() : undefined;

    for (const year in activityTimeConfig) {
        if (filterYear && filterYear > parseInt(year)) continue;

        for (const month in activityTimeConfig[year]) {
            if (filterMonth && filterMonth > parseInt(month)) continue;

            for (const day in activityTimeConfig[year][month]) {
                if (filterDay && filterDay > parseInt(day)) continue;

                for (const hour in activityTimeConfig[year][month][day]) {
                    if (filterHour && filterHour > parseInt(hour)) continue;

                    // 累加hour内的每个5分钟时间段的强度
                    if (per === ActivityTimePer.Month) {
                        activityTimeMap[parseInt(day) - 1] +=
                            activityTimeConfig[year][month][day][hour].reduce((a: number, b: number) => a + b);
                    } else if (per === ActivityTimePer.Day) {
                        activityTimeMap[parseInt(hour) - 1] +=
                            activityTimeConfig[year][month][day][hour].reduce((a: number, b: number) => a + b);
                    }
                }
            }
        }
    }
    return activityTimeMap;
}

export function actTimeAnalyze(): AnalyzeResult {
    const actTimePerMonth = getActivityTimeMap(ActivityTimePer.Month)
    const actTimePerDay = getActivityTimeMap(ActivityTimePer.Day)

    if (actTimePerMonth.length === 0 || actTimePerDay.length === 0) {
        return {
            success: false,
            error: "No activity time data found"
        }
    }

    const res = `
    一个月内每天的平均活跃程度（按1号到31号排序，活跃值是相对值）：${actTimePerMonth}\n
    一天内每小时的平均活跃程度（按0点到23点排序，活跃值是相对值）：${actTimePerDay}\n`
    return {
        success: true,
        data: res
    }
}