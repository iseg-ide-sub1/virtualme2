import {LogItem} from "../../../base/types/log-item";
import {Artifact, ArtifactType} from "../../../base/types/artifact";

function artifactIsFileOrSmaller(artifactType: ArtifactType): boolean {
    return artifactType !== ArtifactType.Null &&
        artifactType !== ArtifactType.Unknown &&
        artifactType !== ArtifactType.Terminal
}

function getFileNameFromArtifact(artifact: Artifact): string {
    if (artifact.hierarchy) {
        return artifact.hierarchy[0].name;
    }
    return artifact.name
}

export function updateCyclissity(logs: LogItem[]): Promise<string> {
    return new Promise((resolve, reject) => {
        let fileArtifactStack: string[] = new Array<string>();
        let cyclissity: number[] = new Array<number>();

        function calculateCyclissity(curArtifactName: string) {
            const curIndex = fileArtifactStack.indexOf(curArtifactName)
            if (curIndex === -1) {
                return
            }

            cyclissity.push(curIndex / curArtifactName.length)
        }

        for (const log of logs) {
            if (!artifactIsFileOrSmaller(log.artifact.type)) {
                continue
            }

            const fileArtifactName = getFileNameFromArtifact(log.artifact)
            if (!fileArtifactStack.includes(fileArtifactName)) {
                fileArtifactStack.push(fileArtifactName)
            }

            calculateCyclissity(fileArtifactName)
        }

        const avgCyclissity = cyclissity.reduce((acc, cur) => acc + cur, 0) / cyclissity.length

        resolve(avgCyclissity.toFixed(2).toString())
    })
}