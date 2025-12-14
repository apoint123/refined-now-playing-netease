import { atomWithStorage, createJSONStorage } from "jotai/utils";

const storage = createJSONStorage<any>(() => localStorage);

/**
 * @description 创建一个带有插件前缀 'refined-now-playing-' 的持久化 Atom
 */
export const atomWithPluginSetting = <T>(key: string, initialValue: T) => {
	const prefixedKey = `refined-now-playing-${key}`;
	return atomWithStorage<T>(prefixedKey, initialValue, storage);
};
