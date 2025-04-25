import {RepoMap} from "../../repomap/RepoMap";
import * as logItem from "../base/types/log-item";

//*****************************************************************
// 需要人工配置的内容，每次发布新版本前都要检查一下
export const saveDir = {value: '.virtualme'} // 数据的保存位置
export const plugin_version = 'v0.3.0' // 插件版本
export const maxLogItemsNum = 1000 // 允许缓存的最大命令数量，超过后自动进行保存
export const logCheckInterval = 1000 // 自动保存的间隔时间，单位：毫秒
export const snapshotInterval = 1000 * 60 * 5 // 快照的间隔时间，单位：毫秒, 默认5分钟

//*****************************************************************

// 内部全局变量和状态
export let isCalculatingArtifact = {value: 0} // 防止调用相关API时的vs内部的文件开关事件被记录
export let isRecording: boolean = true // 是否正在记录，默认激活插件时开始记录
export let repoMap: RepoMap | undefined = undefined // 代码地图
export let logs: logItem.LogItem[] = []
export let extensionPath = '';

//*****************************************************************

// 以下是对外暴露的直接赋值API
export function setRepoMap(newRepoMap: RepoMap) {
    repoMap = newRepoMap;
}

export function setLogs(newLogs: logItem.LogItem[] = []) {
    logs = newLogs;
}

export function setExtensionPath(path: string) {
    extensionPath = path;
}

export function startRecording() {
    isRecording = true;
}

export function stopRecording() {
    isRecording = false;
}