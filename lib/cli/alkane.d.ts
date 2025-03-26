import { Command } from 'commander';
export declare const alkanesTrace: Command;
export declare const alkaneContractDeploy: Command;
export declare const alkaneTokenDeploy: Command;
export declare const alkaneExecute: Command;
export declare const alkaneRemoveLiquidity: Command;
export declare const alkaneSwap: Command;
export declare const alkaneSplit: Command;
export declare const alkaneSend: Command;
export declare const alkaneCreatePool: Command;
export declare const alkaneAddLiquidity: Command;
export declare const alkaneSimulate: Command;
export declare const alkaneGetAllPoolsDetails: Command;
/**
 * Command for bumping the fee of a transaction using RBF
 * @example
 * oyl alkane bump-fee -txid "6c17d0fc8b915aae2ce1a99b4bfd149f2ebc5e6762202a770a1329dff99ee0b1" -feeRate 5 -p regtest
 */
export declare const alkaneBumpFee: Command;
