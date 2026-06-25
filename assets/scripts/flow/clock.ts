/**
 * 可注入时钟：默认真实时钟；测试可注入 fake clock 记录 sleep 而不真实等待。
 * flow 契约，架构维护——实现方只读不改。禁止 import `cc`。
 */

export interface Clock {
  sleep(ms: number): Promise<void>;
}

export const realClock: Clock = {
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};
