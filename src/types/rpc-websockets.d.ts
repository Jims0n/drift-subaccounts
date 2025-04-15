declare module 'rpc-websockets/dist/lib/client' {
  export class Client {
    constructor(address: string, options?: any);
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    call(method: string, params?: any): Promise<any>;
    subscribe(event: string): Promise<any>;
    unsubscribe(event: string): Promise<any>;
    close(): void;
  }
  export default { Client };
}

declare module 'rpc-websockets/dist/lib/client/websocket' {
  export class Client {
    constructor(address: string, options?: any);
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    call(method: string, params?: any): Promise<any>;
    subscribe(event: string): Promise<any>;
    unsubscribe(event: string): Promise<any>;
    close(): void;
  }
  export default { Client };
} 