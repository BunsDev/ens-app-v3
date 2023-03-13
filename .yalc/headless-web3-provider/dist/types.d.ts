import { Page } from "@playwright/test";
export interface IWeb3Provider {
    isMetaMask?: boolean;
    request(args: {
        method: 'eth_accounts';
        params: [];
    }): Promise<string[]>;
    request(args: {
        method: 'eth_requestAccounts';
        params: [];
    }): Promise<string[]>;
    request(args: {
        method: 'net_version';
        params: [];
    }): Promise<number>;
    request(args: {
        method: 'eth_chainId';
        params: [];
    }): Promise<string>;
    request(args: {
        method: 'personal_sign';
        params: string[];
    }): Promise<string>;
    request(args: {
        method: string;
        params?: any[];
    }): Promise<any>;
    emit(eventName: string, ...args: any[]): void;
    on(eventName: string, listener: (eventName: string) => void): void;
}
interface PendingRequest {
    requestInfo: {
        method: string;
        params: any[];
    };
    reject: (err: {
        message?: string;
        code?: number;
    }) => void;
    authorize: () => Promise<void>;
}
declare class EventEmitter {
    emit(eventName: string, ...args: any[]): boolean;
    on(eventName: string, listener: (...args: any[]) => void): this;
    off(eventName: string, listener: (...args: any[]) => void): this;
    once(eventName: string, listener: (...args: any[]) => void): this;
}
export enum Web3RequestKind {
    RequestAccounts = "eth_requestAccounts",
    Accounts = "eth_accounts",
    SendTransaction = "eth_sendTransaction",
    SwitchEthereumChain = "wallet_switchEthereumChain",
    AddEthereumChain = "wallet_addEthereumChain",
    SignMessage = "personal_sign"
}
declare class ErrorWithCode extends Error {
    code?: number | undefined;
    constructor(message?: string, code?: number | undefined);
}
interface ChainConnection {
    chainId: number;
    rpcUrl: string;
}
interface Web3ProviderConfig {
    debug?: boolean;
    logger?: typeof console.log;
}
export class Web3ProviderBackend extends EventEmitter implements IWeb3Provider {
    #private;
    constructor(privateKeys: string[], chains: ChainConnection[], config?: Web3ProviderConfig);
    request(args: {
        method: 'eth_accounts';
        params: [];
    }): Promise<string[]>;
    request(args: {
        method: 'eth_requestAccounts';
        params: string[];
    }): Promise<string[]>;
    request(args: {
        method: 'net_version';
        params: [];
    }): Promise<number>;
    request(args: {
        method: 'eth_chainId';
        params: [];
    }): Promise<string>;
    request(args: {
        method: 'personal_sign';
        params: string[];
    }): Promise<string>;
    waitAuthorization<T>(requestInfo: PendingRequest['requestInfo'], task: () => Promise<T>, permanentPermission?: boolean, methodOverride?: string): Promise<unknown>;
    getPendingRequests(): PendingRequest['requestInfo'][];
    getPendingRequestCount(requestKind?: Web3RequestKind): number;
    authorize(requestKind: Web3RequestKind): Promise<void>;
    reject(requestKind: Web3RequestKind, reason?: ErrorWithCode): Promise<void>;
    authorizeAll(): void;
    rejectAll(reason?: ErrorWithCode): void;
    changeAccounts(privateKeys: string[]): Promise<void>;
    getNetwork(): ChainConnection;
    getNetworks(): ChainConnection[];
    addNetwork(chainId: number, rpcUrl: string): void;
    switchNetwork(chainId_: number): void;
}
type Fn = (...args: any[]) => any;
export function makeHeadlessWeb3Provider(privateKeys: string[], chainId: number, rpcUrl: string, evaluate?: <T extends keyof IWeb3Provider>(method: T, ...args: IWeb3Provider[T] extends Fn ? Parameters<IWeb3Provider[T]> : []) => Promise<void>, config?: Web3ProviderConfig): Web3ProviderBackend;
declare global {
    interface Window {
        ethereum: IWeb3Provider;
    }
}
export function injectHeadlessWeb3Provider(page: Page, privateKeys: string[], chainId: number, chainRpcUrl: string, config?: Web3ProviderConfig): Promise<import("Web3ProviderBackend").Web3ProviderBackend>;

//# sourceMappingURL=types.d.ts.map
