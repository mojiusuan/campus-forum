/**
 * 模块类型声明（当 @types 未安装时的回退，例如 NODE_ENV=production 时 devDependencies 被跳过）
 */
declare module 'pg' {
  export class Pool {
    constructor(config?: {
      connectionString?: string;
      max?: number;
      min?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
      [key: string]: unknown;
    });
    query(...args: unknown[]): Promise<{ rows: unknown[] }>;
    connect(): Promise<unknown>;
    end(): Promise<void>;
  }
}
