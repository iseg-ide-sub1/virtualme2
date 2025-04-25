export class LangInfo {
    public lang: string; // 编程语言名称
    public file: number | undefined; // 文件数量
    public line: number | undefined; // 代码行数
    public blank: number | undefined; // 空白行数
    public comment: number | undefined; // 注释行数
    public features: Set<string> | undefined; // 语言特性
    public packages: Set<string> | undefined; // 相关包

    constructor(lang: string) {
        this.lang = lang;
    }

    equals(other: LangInfo) {
        return this.lang === other.lang
    }

    toJSONObject() {
        return {
            lang: this.lang,
            file: this.file,
            line: this.line,
            blank: this.blank,
            comment: this.comment,
            features: Array.from(this.features || []),
            packages: Array.from(this.packages || [])
        }
    }
}

export class FrameworkInfo {

    constructor(
        public name: string,
        public configFile: ConfigInfo[]
    ) {

    }

    toJSONObject() {
        return {
            name: this.name,
            configFile: this.configFile.map(config => config.toJSONObject())
        }
    }
}

export class ConfigInfo {
    constructor(
        public filePath: string,
        public content: string
    ) {
    }

    toJSONObject() {
        return {
            filePath: this.filePath,
            content: this.content
        }
    }
}