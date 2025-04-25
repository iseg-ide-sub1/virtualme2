import {SnapshotItem} from "../../../base/code-diff/code-diff";
import path from "path";
import {userProfilePath} from "../utils";
import fs from "fs";
import {SnapshotLines} from "./coding-prod-analyze";

export function getSnapshotHistoryConfig(): string {
    const commitTypeConfigPath = path.join(userProfilePath, 'snapshot', "snapshots.json");
    if (!fs.existsSync(commitTypeConfigPath)) {
        fs.writeFileSync(commitTypeConfigPath, JSON.stringify({}), 'utf8')
    }
    return commitTypeConfigPath;
}

function countDiffLines(snapshot: SnapshotItem): SnapshotLines {
    const timestamp: string = snapshot.timestamp, rawDiffOutput: string = snapshot.snapshot
    const lines = rawDiffOutput.split('\n');
    let addedLines = 0;
    let removedLines = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine === '' ||
            line.startsWith('diff ') ||
            line.startsWith('index ') ||
            line.startsWith('--- ') ||
            line.startsWith('+++ ') ||
            line.startsWith('@@ ')) {
            continue;
        }

        if (line.startsWith('+') && !line.startsWith('+++')) {
            addedLines++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            removedLines++;
        }
    }

    return {
        timestamp: timestamp,
        addedLines: addedLines,
        removedLines: removedLines
    }
}

export function updateCodingProductivity(snapshots: SnapshotItem[], since?: Date): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!snapshots || snapshots.length === 0) {
            reject("No snapshots found.");
            return;
        }

        const snapshotHistoryConfig = getSnapshotHistoryConfig();
        const snapshotHistory = JSON.parse(fs.readFileSync(snapshotHistoryConfig, 'utf8'));

        if (!snapshotHistory.history) {
            snapshotHistory.history = new Array<SnapshotLines>();
        }

        if (since) {
            snapshotHistory.history = snapshotHistory.history.filter((item: SnapshotLines) => new Date(item.timestamp) > since)
        }

        for (const snapshot of snapshots) {
            const snapshotLines = countDiffLines(snapshot)

            snapshotHistory.history.push(snapshotLines)
        }

        fs.writeFileSync(snapshotHistoryConfig, JSON.stringify(snapshotHistory), 'utf8')
        resolve("Commit type updated successfully.")
    })
}