export type LogLevel = 'info' | 'log' | 'warn' | 'error';
export interface Logger {
    info: (...args: any[]) => void;
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}
/**
 * 创建带前缀的日志器
 */
export declare function createLogger(prefix: string): Logger;
export default createLogger;
