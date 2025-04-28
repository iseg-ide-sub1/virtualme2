import {EdgeType} from "../../../repomap/_repoMap_/type";

export enum ArtifactType {
    File = "File",
    Module = "Module",
    Namespace = "Namespace",
    Package = "Package",
    Class = "Class",
    Method = "Method",
    Property = "Property",
    Field = "Field",
    Constructor = "Constructor",
    Enum = "Enum",
    Interface = "Interface",
    Function = "Function",
    Variable = "Variable",
    Constant = "Constant",
    String = "String",
    Number = "Number",
    Boolean = "Boolean",
    Array = "Array",
    Object = "Object",
    Key = "Key",
    Null = "Null",
    EnumMember = "EnumMember",
    Struct = "Struct",
    Event = "Event",
    Operator = "Operator",
    TypeParameter = "TypeParameter",
    Terminal = "Terminal",
    MenuItem = "MenuItem",
    Unknown = "Unknown"
}


export class Artifact {
    public constructor(
        public name: string,
        public type: ArtifactType,
        public startPosition?: number,
        public endPosition?: number,
        public hierarchy?: Artifact[],
    ) {
    }


    equals(other: Artifact): boolean {
        return !(this.name !== other.name || this.type !== other.type);


    }

    toString(): string {
        return JSON.stringify({
            name: this.name,
            type: this.type,
            startPosition: this.startPosition,
            endPosition: this.endPosition,
            hierarchy: this.hierarchy?.map(a => a.toString())
        })
    }

    toJSONObject(): any {
        return {
            name: this.name,
            type: this.type,
            startPosition: this.startPosition,
            endPosition: this.endPosition,
            hierarchy: this.hierarchy?.map(a => a.toJSONObject())
        }
    }
}

// 工件之间的联系
export class Edge {
    constructor(
        public source: Artifact,
        public target: Artifact,
        public edgeType: EdgeType, //与repomap的定义对齐
    ) {
    }

    equals(other: Edge): boolean {
        return this.source.equals(other.source) && this.target.equals(other.target) && this.edgeType === other.edgeType
    }

    toString(): string {
        return `${this.source.name} ---${this.edgeType.toString()}--> ${this.target.name}`
    }

}