import { SyntaxNode } from "web-tree-sitter";
import * as fs from 'fs';

export function hasAncestor(parentType: string[], astNode: SyntaxNode): SyntaxNode | undefined {
    let parent = astNode.parent;
    while (parent) {
        if (parentType.includes(parent.type)) {
            return parent;
        }
        parent = parent.parent;
    }
    return undefined;
}

export function hasNamedChild(childType: string, astNode: SyntaxNode): SyntaxNode | undefined {
    for (const child of astNode.namedChildren) {
        if (child.type === childType) {
            return child;
        }
    }
    return undefined;
}

export function getFileLineCount(path: string): number {
    const stats = fs.statSync(path);
    if (!stats.isFile()) {
        return 1;
    }
    const fileContent = fs.readFileSync(path, 'utf-8');
    const lines = fileContent.split('\n');
    return lines.length;
}

