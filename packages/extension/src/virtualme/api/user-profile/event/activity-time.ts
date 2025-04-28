import {LogItem} from "../../../base/types/log-item";
import {userProfilePath} from "../utils";
import path from "path";
import fs from "fs";


export function getActivityTimeConfigPath() {
    const activityTimeConfigPath = path.join(userProfilePath, 'event', "activity-time.json");
    if (!fs.existsSync(activityTimeConfigPath)) {
        fs.writeFileSync(activityTimeConfigPath, JSON.stringify({}), 'utf8')
    }
    return activityTimeConfigPath;
}

function getIndexOfPer5Minutes(minute: number): number {
    return Math.floor(minute / 5)
}

export enum ActivityTimePer {
    Month = "Month",
    Day = "Day"
}

export async function updateActivityTime(logs: LogItem[]): Promise<any> {
    return new Promise(async (resolve) => {
        const activityTimeConfigPath = getActivityTimeConfigPath();
        const activityTimeConfig = JSON.parse(fs.readFileSync(activityTimeConfigPath, 'utf8'));

        for (const log of logs) {
            const timestamp = new Date(log.timeStamp);

            const year = timestamp.getFullYear();
            const month = timestamp.getMonth() + 1;
            const day = timestamp.getDate();
            const hour = timestamp.getHours();
            const minute = timestamp.getMinutes();

            if (!activityTimeConfig[year]) {
                activityTimeConfig[year] = {};
            }
            if (!activityTimeConfig[year][month]) {
                activityTimeConfig[year][month] = {};
            }
            if (!activityTimeConfig[year][month][day]) {
                activityTimeConfig[year][month][day] = {};
            }
            if (!activityTimeConfig[year][month][day][hour]) {
                //采用one-hot编码，共12个元素，分别表示12个5分钟时间段。不需要再细，因为强度粒度到hour，且事件数量有时不可控。
                activityTimeConfig[year][month][day][hour] = new Array(12).fill(0);
            }

            const indexOfPer5Minutes = getIndexOfPer5Minutes(minute);
            activityTimeConfig[year][month][day][hour][indexOfPer5Minutes] = 1;

        }

        fs.writeFileSync(activityTimeConfigPath, JSON.stringify(activityTimeConfig), 'utf8');
        resolve("update activity time success");
    })
}
