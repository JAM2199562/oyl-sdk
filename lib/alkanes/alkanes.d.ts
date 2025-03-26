/// <reference types="node" />
/// <reference types="node" />
import { Provider } from '../provider/provider';
import { Account, Signer } from '..';
import { GatheredUtxos, AlkanesPayload } from '../shared/interface';
export declare const createExecutePsbt: ({ alkaneUtxos, gatheredUtxos, account, protostone, provider, feeRate, fee, }: {
    alkaneUtxos?: {
        alkaneUtxos: any[];
        totalSatoshis: number;
    };
    gatheredUtxos: GatheredUtxos;
    account: Account;
    protostone: Buffer;
    provider: Provider;
    feeRate?: number;
    fee?: number;
}) => Promise<{
    psbt: string;
    psbtHex: string;
}>;
export declare const createDeployCommitPsbt: ({ payload, gatheredUtxos, tweakedPublicKey, account, provider, feeRate, fee, }: {
    payload: AlkanesPayload;
    gatheredUtxos: GatheredUtxos;
    tweakedPublicKey: string;
    account: Account;
    provider: Provider;
    feeRate?: number;
    fee?: number;
}) => Promise<{
    psbt: string;
    script: Buffer;
}>;
export declare const deployCommit: ({ payload, gatheredUtxos, account, provider, feeRate, signer, }: {
    payload: AlkanesPayload;
    gatheredUtxos: GatheredUtxos;
    account: Account;
    provider: Provider;
    feeRate?: number;
    signer: Signer;
}) => Promise<{
    script: string;
    txId: string;
    rawTx: string;
    size: any;
    weight: any;
    fee: number;
    satsPerVByte: string;
}>;
export declare const createDeployRevealPsbt: ({ protostone, receiverAddress, script, feeRate, tweakedPublicKey, provider, fee, commitTxId, }: {
    protostone: Buffer;
    receiverAddress: string;
    script: Buffer;
    feeRate: number;
    tweakedPublicKey: string;
    provider: Provider;
    fee?: number;
    commitTxId: string;
}) => Promise<{
    psbt: string;
    fee: number;
}>;
export declare const deployReveal: ({ protostone, commitTxId, script, account, provider, feeRate, signer, }: {
    protostone: Buffer;
    commitTxId: string;
    script: string;
    account: Account;
    provider: Provider;
    feeRate?: number;
    signer: Signer;
}) => Promise<{
    txId: string;
    rawTx: string;
    size: any;
    weight: any;
    fee: number;
    satsPerVByte: string;
}>;
export declare const findAlkaneUtxos: ({ address, greatestToLeast, provider, alkaneId, targetNumberOfAlkanes, }: {
    address: string;
    greatestToLeast: boolean;
    provider: Provider;
    alkaneId: {
        block: string;
        tx: string;
    };
    targetNumberOfAlkanes: number;
}) => Promise<{
    alkaneUtxos: {
        txId: string;
        txIndex: number;
        script: string;
        address: string;
        amountOfAlkanes: string;
        satoshis: number;
    }[];
    totalSatoshis: number;
    totalBalanceBeingSent: number;
}>;
export declare const actualTransactRevealFee: ({ protostone, tweakedPublicKey, commitTxId, receiverAddress, script, provider, feeRate, }: {
    protostone: Buffer;
    tweakedPublicKey: string;
    commitTxId: string;
    receiverAddress: string;
    script: Buffer;
    provider: Provider;
    feeRate?: number;
}) => Promise<{
    fee: number;
    vsize: number;
}>;
export declare const actualExecuteFee: ({ gatheredUtxos, account, protostone, provider, feeRate, alkaneUtxos, }: {
    gatheredUtxos: GatheredUtxos;
    account: Account;
    protostone: Buffer;
    provider: Provider;
    feeRate: number;
    alkaneUtxos?: {
        alkaneUtxos: any[];
        totalSatoshis: number;
    };
}) => Promise<{
    fee: number;
    vsize: number;
}>;
export declare const executePsbt: ({ alkaneUtxos, gatheredUtxos, account, protostone, provider, feeRate, }: {
    alkaneUtxos?: {
        alkaneUtxos: any[];
        totalSatoshis: number;
    };
    gatheredUtxos: GatheredUtxos;
    account: Account;
    protostone: Buffer;
    provider: Provider;
    feeRate?: number;
}) => Promise<{
    psbt: string;
    fee: number;
}>;
export declare const execute: ({ alkaneUtxos, gatheredUtxos, account, protostone, provider, feeRate, signer, }: {
    alkaneUtxos?: {
        alkaneUtxos: any[];
        totalSatoshis: number;
    };
    gatheredUtxos: GatheredUtxos;
    account: Account;
    protostone: Buffer;
    provider: Provider;
    feeRate?: number;
    signer: Signer;
}) => Promise<{
    txId: string;
    rawTx: string;
    size: any;
    weight: any;
    fee: number;
    satsPerVByte: string;
}>;
export declare const createTransactReveal: ({ protostone, receiverAddress, script, feeRate, tweakedPublicKey, provider, fee, commitTxId, }: {
    protostone: Buffer;
    receiverAddress: string;
    script: Buffer;
    feeRate: number;
    tweakedPublicKey: string;
    provider: Provider;
    fee?: number;
    commitTxId: string;
}) => Promise<{
    psbt: string;
    fee: number;
}>;
/**
 * Calculate the correct fee for bumping a transaction fee
 * @param txid - Transaction ID to bump
 * @param account - Wallet account
 * @param provider - Network provider
 * @param newFeeRate - New fee rate in sat/vB
 * @param signer - Wallet signer
 * @returns Object containing the calculated fee
 */
export declare const actualBumpFeeFee: ({ txid, account, provider, newFeeRate, signer, }: {
    txid: string;
    account: Account;
    provider: Provider;
    newFeeRate: number;
    signer: Signer;
}) => Promise<{
    fee: number;
}>;
/**
 * Create a PSBT for bumping transaction fee
 * @param txid - Transaction ID to bump
 * @param account - Wallet account
 * @param provider - Network provider
 * @param newFeeRate - New fee rate in sat/vB
 * @param fee - Optional specific fee amount (if not provided, calculated from newFeeRate)
 * @returns Object containing the base64 encoded PSBT
 */
export declare const createBumpFeePsbt: ({ txid, account, provider, newFeeRate, fee, }: {
    txid: string;
    account: Account;
    provider: Provider;
    newFeeRate: number;
    fee?: number;
}) => Promise<{
    psbt: string;
}>;
/**
 * Bump the fee of a transaction using RBF
 * @param txid - Transaction ID to bump
 * @param newFeeRate - New fee rate in sat/vB
 * @param account - Wallet account
 * @param provider - Network provider
 * @param signer - Wallet signer
 * @returns Result of the transaction broadcast
 */
export declare const bumpFee: ({ txid, newFeeRate, account, provider, signer, }: {
    txid: string;
    newFeeRate: number;
    account: Account;
    provider: Provider;
    signer: Signer;
}) => Promise<{
    txId: string;
    rawTx: string;
    size: any;
    weight: any;
    fee: number;
    satsPerVByte: string;
}>;
