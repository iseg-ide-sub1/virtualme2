import { EdgeType } from "./_repoMap_/type";

/**
 * 动态初始化的代码地图更新间隔时间
 */
export const updateInterval = 1000 * 60 * 5; //5 minutes

/**
 * 代码地图中父子关系的边类型，在获取相关工件时不消耗深度
 */
export const parentChildEdgeTypes: EdgeType[] = [EdgeType.ENCAPSULATE, EdgeType.OWN];

/**
 * 代码地图中依赖关系的边类型，在获取相关工件时消耗深度
 */
export const referenceEdgeTypes: EdgeType[] = Object.values(EdgeType).filter(type => !parentChildEdgeTypes.includes(type));