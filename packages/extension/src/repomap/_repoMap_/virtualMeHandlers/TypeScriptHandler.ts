import Parser from "web-tree-sitter"
import { MatchesHandler } from "../type";
import { _RepoMap_ } from "../_RepoMap_";
import path from "path";

export const typeScriptVirtualMeMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const externalPackages: Set<string> = new Set();

    for (const match of matches) {
        const pattern = match.pattern;

        if (pattern === 0) {
            const source = match.captures.find(c => c.name === "source")?.node.text.slice(1, -1);
            if (!source || source.startsWith(".")) {
                continue;
            }
            externalPackages.add(source.split("/")[0]);
        }
    }
    _repoMap_.addExternalPackages(externalPackages);
}