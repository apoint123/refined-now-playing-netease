import { atom } from "jotai";

/**
 * @description 概览模式 (复制模式) 开关
 */
export const overviewModeAtom = atom(false);

/**
 * @description 派生 Atom，用于控制是否正在滚动概览视图
 */
export const overviewScrollingAtom = atom(false);
