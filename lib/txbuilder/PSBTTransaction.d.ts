import * as bitcoin from 'bitcoinjs-lib';
import { AddressType, UnspentOutput, TxOutput, ToSignInput } from '../shared/interface';
export declare class PSBTTransaction {
    private inputs;
    outputs: TxOutput[];
    private changeOutputIndex;
    private signer;
    private address;
    changedAddress: string;
    private network;
    private feeRate;
    private pubkey;
    private addressType;
    private enableRBF;
    constructor(signer: any, address: string, pubkey: string, addressType: AddressType, feeRate?: number);
    setEnableRBF(enable: boolean): void;
    setChangeAddress(address: string): void;
    addInput(utxo: UnspentOutput): void;
    getTotalInput(): number;
    getTotalOutput(): number;
    getUnspent(): number;
    isEnoughFee(): Promise<boolean>;
    calNetworkFee(): Promise<number>;
    addOutput(address: string, value: number): void;
    getOutput(index: number): TxOutput;
    addChangeOutput(value: number): void;
    getChangeOutput(): TxOutput;
    getChangeAmount(): number;
    removeChangeOutput(): void;
    removeRecentOutputs(count: number): void;
    formatOptionsToSignInputs: (_psbt: string | bitcoin.Psbt) => Promise<ToSignInput[]>;
    createSignedPsbt(): Promise<bitcoin.Psbt>;
    signPsbt(psbt: bitcoin.Psbt, autoFinalized?: boolean): Promise<bitcoin.Psbt>;
    generate(autoAdjust: boolean): Promise<{
        fee: number;
        rawtx: string;
        toSatoshis: number;
        estimateFee: number;
    }>;
    dumpTx(psbt: any): Promise<void>;
}
