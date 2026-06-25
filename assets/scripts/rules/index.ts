/**
 * rules 层公共 API 汇总导出。引擎无关，禁止 import `cc`。
 * 供 game 状态机、ai 决策与 ui 提示复用。
 */

export * from './card';
export * from './rng';
export * from './deal';
export * from './pattern';
export * from './compare';
export * from './moves';
export * from './result';
