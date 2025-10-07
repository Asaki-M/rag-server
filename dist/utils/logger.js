/**
 * 创建带前缀的日志器
 */
export function createLogger(prefix) {
    const formatPrefix = `[${prefix}]:`;
    return {
        info: (...args) => {
            console.info(formatPrefix, ...args);
        },
        log: (...args) => {
            console.log(formatPrefix, ...args);
        },
        warn: (...args) => {
            console.warn(formatPrefix, ...args);
        },
        error: (...args) => {
            console.error(formatPrefix, ...args);
        },
    };
}
// 默认导出创建函数
export default createLogger;
//# sourceMappingURL=logger.js.map