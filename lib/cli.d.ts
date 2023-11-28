import "dotenv/config";
export declare function loadRpc(options: any): Promise<void>;
export declare function testMarketplaceBuy(): Promise<void>;
export declare function testAggregator(): Promise<void>;
export declare function viewPsbt(): Promise<void>;
export declare function callAPI(command: any, data: any, options?: {}): Promise<any>;
export declare function swapFlow(): Promise<void>;
export declare function runCLI(): Promise<any>;
