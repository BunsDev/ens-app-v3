import {ethers as $hgUW1$ethers} from "ethers";
import {BehaviorSubject as $hgUW1$BehaviorSubject, firstValueFrom as $hgUW1$firstValueFrom, switchMap as $hgUW1$switchMap, from as $hgUW1$from, filter as $hgUW1$filter, first as $hgUW1$first, tap as $hgUW1$tap} from "rxjs";
import $hgUW1$assertstrict from "assert/strict";
import {toUtf8String as $hgUW1$toUtf8String} from "ethers/lib/utils";





const $28ac839a9eca26f5$export$f18f28cb7f653f44 = ()=>new $28ac839a9eca26f5$export$93ee5758f32873e6("The user rejected the request.", 4001);
const $28ac839a9eca26f5$export$3ec1ce42a7e09129 = ()=>new $28ac839a9eca26f5$export$93ee5758f32873e6("The requested method and/or account has not been authorized by the user.", 4100);
const $28ac839a9eca26f5$export$a4f499402be1ad3b = ()=>new $28ac839a9eca26f5$export$93ee5758f32873e6("The Provider does not support the requested method.", 4200);
const $28ac839a9eca26f5$export$b7a9550aaaca2d17 = ()=>new $28ac839a9eca26f5$export$93ee5758f32873e6("The Provider is disconnected from all chains.", 4900);
const $28ac839a9eca26f5$export$189dbddd424c0816 = ()=>new $28ac839a9eca26f5$export$93ee5758f32873e6("The Provider is not connected to the requested chain.", 4901);
class $28ac839a9eca26f5$export$93ee5758f32873e6 extends Error {
    constructor(message, code){
        super(message);
        this.code = code;
        return this;
    }
}


class $a841c95339c04de5$export$4fae95256245c8c0 {
    listeners = Object.create(null);
    emit(eventName, ...args) {
        this.listeners[eventName]?.forEach((listener)=>{
            listener(...args);
        });
        return true;
    }
    on(eventName, listener) {
        this.listeners[eventName] ??= [];
        this.listeners[eventName]?.push(listener);
        return this;
    }
    off(eventName, listener) {
        const listeners = this.listeners[eventName] ?? [];
        for (const [i, listener_] of listeners.entries())if (listener === listener_) {
            listeners.splice(i, 1);
            break;
        }
        return this;
    }
    once(eventName, listener) {
        const cb = (...args)=>{
            this.off(eventName, cb);
            listener(...args);
        };
        return this.on(eventName, cb);
    }
}



class $bd1a38e082154942$export$9a258a485ae90475 extends (0, $a841c95339c04de5$export$4fae95256245c8c0) {
    #pendingRequests$;
    #wallets;
    constructor(privateKeys, chains, config = {}){
        super();
        this.chains = chains;
        this.#pendingRequests$ = new (0, $hgUW1$BehaviorSubject)([]);
        this.#wallets = [];
        this._rpc = {};
        this._authorizedRequests = {};
        this.#wallets = privateKeys.map((key)=>new (0, $hgUW1$ethers).Wallet(key));
        this._activeChainId = chains[0].chainId;
        this._config = Object.assign({
            debug: false,
            logger: console.log
        }, config);
    }
    async request({ method: method , params: params  }) {
        if (this._config.debug) this._config.logger({
            method: method,
            params: params
        });
        switch(method){
            case "eth_call":
            case "eth_estimateGas":
            case "eth_gasPrice":
            case "eth_blockNumber":
            case "eth_getBlockByNumber":
            case "eth_getTransactionByHash":
            case "eth_getTransactionReceipt":
            case "evm_increaseTime":
            case "evm_mine":
                return this.getRpc().send(method, params);
            case "eth_requestAccounts":
            case "eth_accounts":
                return this.waitAuthorization({
                    method: method,
                    params: params
                }, async ()=>{
                    const { chainId: chainId  } = this.getCurrentChain();
                    this.emit("connect", {
                        chainId: chainId
                    });
                    return Promise.all(this.#wallets.map((wallet)=>wallet.getAddress()));
                }, true, "eth_requestAccounts");
            case "eth_chainId":
                {
                    const { chainId: chainId  } = this.getCurrentChain();
                    return "0x" + chainId.toString(16);
                }
            case "net_version":
                {
                    const { chainId: chainId1  } = this.getCurrentChain();
                    return chainId1;
                }
            case "eth_sendTransaction":
                return this.waitAuthorization({
                    method: method,
                    params: params
                }, async ()=>{
                    const wallet = this.#getCurrentWallet();
                    const rpc = this.getRpc();
                    const { gas: gas , ...txRequest } = params[0];
                    const tx = await wallet.connect(rpc).sendTransaction(txRequest);
                    return tx.hash;
                });
            case "wallet_addEthereumChain":
                return this.waitAuthorization({
                    method: method,
                    params: params
                }, async ()=>{
                    const chainId = Number(params[0].chainId);
                    const rpcUrl = params[0].rpcUrls[0];
                    this.addNetwork(chainId, rpcUrl);
                    return null;
                });
            case "wallet_switchEthereumChain":
                if (this._activeChainId === Number(params[0].chainId)) return null;
                return this.waitAuthorization({
                    method: method,
                    params: params
                }, async ()=>{
                    const chainId = Number(params[0].chainId);
                    this.switchNetwork(chainId);
                    return null;
                });
            case "personal_sign":
                return this.waitAuthorization({
                    method: method,
                    params: params
                }, async ()=>{
                    const wallet = this.#getCurrentWallet();
                    const address = await wallet.getAddress();
                    (0, $hgUW1$assertstrict).equal(address, (0, $hgUW1$ethers).utils.getAddress(params[1]));
                    const message = (0, $hgUW1$toUtf8String)(params[0]);
                    const signature = await wallet.signMessage(message);
                    if (this._config.debug) this._config.logger("personal_sign", {
                        message: message,
                        signature: signature
                    });
                    return signature;
                });
            default:
                throw (0, $28ac839a9eca26f5$export$a4f499402be1ad3b)();
        }
    }
     #getCurrentWallet() {
        const wallet = this.#wallets[0];
        if (wallet == null) throw (0, $28ac839a9eca26f5$export$3ec1ce42a7e09129)();
        return wallet;
    }
    waitAuthorization(requestInfo, task, permanentPermission = false, methodOverride) {
        const method = methodOverride ?? requestInfo.method;
        if (this._authorizedRequests[method]) return task();
        return new Promise((resolve, reject)=>{
            const pendingRequest = {
                requestInfo: requestInfo,
                authorize: async ()=>{
                    if (permanentPermission) this._authorizedRequests[method] = true;
                    resolve(await task());
                },
                reject (err) {
                    reject(err);
                }
            };
            this.#pendingRequests$.next(this.#pendingRequests$.getValue().concat(pendingRequest));
        });
    }
    consumeRequest(requestKind) {
        return (0, $hgUW1$firstValueFrom)(this.#pendingRequests$.pipe((0, $hgUW1$switchMap)((a)=>(0, $hgUW1$from)(a)), (0, $hgUW1$filter)((request)=>{
            return request.requestInfo.method === requestKind;
        }), (0, $hgUW1$first)(), (0, $hgUW1$tap)((item)=>{
            this.#pendingRequests$.next($bd1a38e082154942$var$without(this.#pendingRequests$.getValue(), item));
        })));
    }
    consumeAllRequests() {
        const a = this.#pendingRequests$.getValue();
        this.#pendingRequests$.next([]);
        return a;
    }
    getPendingRequests() {
        return this.#pendingRequests$.getValue().map((r)=>r.requestInfo);
    }
    getPendingRequestCount(requestKind) {
        const pendingRequests = this.#pendingRequests$.getValue();
        if (requestKind == null) return pendingRequests.length;
        return pendingRequests.filter((request)=>request.requestInfo.method === requestKind).length;
    }
    async authorize(requestKind) {
        const pendingRequest = await this.consumeRequest(requestKind);
        return pendingRequest.authorize();
    }
    async reject(requestKind, reason = (0, $28ac839a9eca26f5$export$f18f28cb7f653f44)()) {
        const pendingRequest = await this.consumeRequest(requestKind);
        return pendingRequest.reject(reason);
    }
    authorizeAll() {
        this.consumeAllRequests().forEach((request)=>request.authorize());
    }
    rejectAll(reason = (0, $28ac839a9eca26f5$export$f18f28cb7f653f44)()) {
        this.consumeAllRequests().forEach((request)=>request.reject(reason));
    }
    async changeAccounts(privateKeys) {
        this.#wallets = privateKeys.map((key)=>new (0, $hgUW1$ethers).Wallet(key));
        this.emit("accountsChanged", await Promise.all(this.#wallets.map((wallet)=>wallet.getAddress())));
    }
    getCurrentChain() {
        const chainConn = this.chains.find(({ chainId: chainId  })=>chainId === this._activeChainId);
        if (!chainConn) throw (0, $28ac839a9eca26f5$export$b7a9550aaaca2d17)();
        return chainConn;
    }
    getRpc() {
        const chain = this.getCurrentChain();
        let rpc = this._rpc[chain.chainId];
        if (!rpc) {
            rpc = new (0, $hgUW1$ethers).providers.JsonRpcProvider(chain.rpcUrl, chain.chainId);
            this._rpc[chain.chainId] = this._rpc[chain.chainId];
        }
        return rpc;
    }
    getNetwork() {
        return this.getCurrentChain();
    }
    getNetworks() {
        return this.chains;
    }
    addNetwork(chainId, rpcUrl) {
        this.chains.push({
            chainId: chainId,
            rpcUrl: rpcUrl
        });
    }
    switchNetwork(chainId_) {
        const chainConn = this.chains.findIndex(({ chainId: chainId  })=>chainId === chainId_);
        if (!~chainConn) throw (0, $28ac839a9eca26f5$export$189dbddd424c0816)();
        this._activeChainId = chainId_;
        this.emit("chainChanged", chainId_);
    }
}
function $bd1a38e082154942$var$without(list, item) {
    const idx = list.indexOf(item);
    if (~idx) return list.slice(0, idx).concat(list.slice(idx + 1));
    return list;
}


function $1120e00ed629344c$export$dd9cb72ba0cb6288(privateKeys, chainId, rpcUrl, evaluate = async ()=>{}, config) {
    const chainRpc = new (0, $hgUW1$ethers).providers.JsonRpcProvider(rpcUrl, chainId);
    const web3Provider = new (0, $bd1a38e082154942$export$9a258a485ae90475)(privateKeys, [
        {
            chainId: chainId,
            rpcUrl: rpcUrl
        }, 
    ], config);
    $1120e00ed629344c$var$relayEvents(web3Provider, evaluate);
    return web3Provider;
}
function $1120e00ed629344c$var$relayEvents(eventEmitter, execute) {
    const emit_ = eventEmitter.emit;
    eventEmitter.emit = (eventName, ...args)=>{
        execute("emit", eventName, ...args);
        return emit_.apply(eventEmitter, [
            eventName,
            ...args
        ]);
    };
}



async function $2a57447ca0c92b27$export$f29fb92ef0e8100(page, privateKeys, chainId, chainRpcUrl, config) {
    const evaluate = async (method, ...args)=>{
        return page.evaluate(([method, args])=>{
            const ethereum = window.ethereum;
            const fn = ethereum[method];
            if (typeof fn == "function") // @ts-ignore
            return fn.apply(ethereum, args);
            return ethereum[method];
        }, [
            method,
            args
        ]);
    };
    const web3Provider = (0, $1120e00ed629344c$export$dd9cb72ba0cb6288)(privateKeys, chainId, chainRpcUrl, evaluate, config);
    await page.exposeFunction("__injectedHeadlessWeb3ProviderRequest", (method, ...args)=>// @ts-expect-error
        web3Provider[method](...args));
    await page.addInitScript(()=>{
        class EventEmitter {
            listeners = Object.create(null);
            emit(eventName, ...args) {
                this.listeners[eventName]?.forEach((listener)=>{
                    listener(...args);
                });
                return true;
            }
            on(eventName, listener) {
                this.listeners[eventName] ??= [];
                this.listeners[eventName]?.push(listener);
                return this;
            }
            off(eventName, listener) {
                const listeners = this.listeners[eventName] ?? [];
                for (const [i, listener_] of listeners.entries())if (listener === listener_) {
                    listeners.splice(i, 1);
                    break;
                }
                return this;
            }
            once(eventName, listener) {
                const cb = (...args)=>{
                    this.off(eventName, cb);
                    listener(...args);
                };
                return this.on(eventName, cb);
            }
        }
        const proxyableMethods = [
            "request"
        ];
        // @ts-expect-error
        window.ethereum = new Proxy(new EventEmitter(), {
            get (target, prop) {
                if (proxyableMethods.includes(prop)) return (...args)=>{
                    // @ts-expect-error
                    return window.__injectedHeadlessWeb3ProviderRequest(prop, ...args);
                };
                // @ts-expect-error
                return Reflect.get(...arguments);
            }
        });
    });
    return web3Provider;
}


let $fab42eb3dee39b5b$export$4877da6c4f8db487;
(function(Web3RequestKind) {
    Web3RequestKind["RequestAccounts"] = "eth_requestAccounts";
    Web3RequestKind["Accounts"] = "eth_accounts";
    Web3RequestKind["SendTransaction"] = "eth_sendTransaction";
    Web3RequestKind["SwitchEthereumChain"] = "wallet_switchEthereumChain";
    Web3RequestKind["AddEthereumChain"] = "wallet_addEthereumChain";
    Web3RequestKind["SignMessage"] = "personal_sign";
})($fab42eb3dee39b5b$export$4877da6c4f8db487 || ($fab42eb3dee39b5b$export$4877da6c4f8db487 = {}));





export {$1120e00ed629344c$export$dd9cb72ba0cb6288 as makeHeadlessWeb3Provider, $2a57447ca0c92b27$export$f29fb92ef0e8100 as injectHeadlessWeb3Provider, $fab42eb3dee39b5b$export$4877da6c4f8db487 as Web3RequestKind, $bd1a38e082154942$export$9a258a485ae90475 as Web3ProviderBackend};
//# sourceMappingURL=module.mjs.map
