import {EventType} from "../types/event-types";
import {Artifact} from "../types/artifact";

// 为保证artifact和对应embed在双列表（candidate, past）中的顺序一致，使用Frame包裹
export class ArtifactFrame {
    constructor(
        public artifact: Artifact,
        public artifactEmbed: number[],
    ) {
    }

    equals(other: ArtifactFrame): boolean {
        return this.artifact.equals(other.artifact)
    }
}

export class Frame {
    constructor(
        //event中记录的时间戳，格式相同，视情况做归一化
        public timestamp: string,
        //事件类型，原始字符串，两种种表示方法候选其一输入模型：1. 词嵌入 2. 独热编码，或者有更好办法请从原始字符串中提取特征
        public eventType: EventType,
        //环境反馈，取值范围0或1，0表示遇到了困难，例如使用了退格键、终端报错等，1表示没有遇到困难
        public feedback: number,
        //当前工件，与artifactEmbed对应
        public artifact: Artifact | null,
        //当前工件与历史工件和相邻工件的依赖关系表征，从repomap算来，相当于这一时间步下，该工件的唯一标识符，
        public artifactEmbed: number[] | null,
        //候选工件，顺序与candidateEmbeds对应
        public candidates: Artifact[] | null,
        /**
         * 下一个工件的候选工件表征，其元素的格式是artifactEmbed，候选工件的数量不定，
         * 一般来说，下一个工件的embed会出自这里，如果不是，就认为该动作原则上无法预测，这个字段不输入模型
         * 基于该frame和前序frame，预测结果是下一个工件的embed，其结果出自candidate数组，是相似度匹配来的。
         */
        public candidateEmbeds: number[][] | null,
    ) {
    }

    public toJSONObject() {
        return {
            "timestamp": this.timestamp,
            "eventType": this.eventType.toString(),
            "feedback": this.feedback,
            "artifact": this.artifact?.toJSONObject(),
            "artifactEmbed": this.artifactEmbed,
            "candidates": this.candidates?.map(c => c.toJSONObject()),
            "candidateEmbeds": this.candidateEmbeds
        }
    }

}