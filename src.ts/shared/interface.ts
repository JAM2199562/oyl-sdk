export interface InscriptionResponse {
  address: string
  inscriptions?: string
  scriptPubkey: string
  transaction: string
  value: string
}

export type WitnessScriptOptions = {
  pubKeyHex: string
  mediaContent: string
  mediaType: string
  meta: any
  recover?: boolean
}

export enum RarityEnum {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
  MYTHIC = "mythic"
}

export type Rarity = `${RarityEnum}`

export interface Ordinal {
  number: number
  decimal: string
  degree: string
  name: string
  height: number
  cycle: number
  epoch: number
  period: number
  offset: number
  rarity: Rarity
  output: string
  start: number
  size: number
}

export interface Inscription {
  id: string
  outpoint: string
  owner: string
  genesis: string
  fee: number
  height: number
  number: number
  sat: number
  timestamp: number
  mediaType: string
  mediaSize: number
  mediaContent: string
  meta?: Record<string, any>
}

export interface UnspentOutput {
  txId: string
  outputIndex: number
  satoshis: number
  scriptPk: string
  addressType: AddressType
  address: string
  ords: {
    id: string
    offset: number
  }[]
}

export interface TxInput {
  data: {
    hash: string
    index: number
    witnessUtxo: { value: number; script: Buffer }
    tapInternalKey?: Buffer
  }
  utxo: UnspentOutput
}

export interface TxOutput {
  address: string
  value: number
}

export interface ToSignInput {
  index: number
  publicKey: string
  sighashTypes?: number[]
}

export interface PrevOut {
  hash: string
  index: number
}

export interface Input {
  prevout: PrevOut
  coin: {
    value: number
  }
}

export interface Output {
  value: number
  script: string
  address: string
}

export interface Transaction {
  inputs: Input[]
  outputs: Output[]
}

export enum AddressType {
  P2PKH,
  P2TR,
  P2SH_P2WPKH,
  P2WPKH,
}

export interface ProviderOptions {
  network: String
  host: String
  port: Number
  provider?: Providers
  auth?: String
}

export enum Providers {
  bcoin,
  oyl,
  electrum

}

export interface SwapBrcBid {
  address: String
  auctionId: String
  bidPrice: Number
  pubKey: String
}

export interface SignedBid {
    psbtBid: String
    auctionId: String
    bidId: String
}

export interface SwapBrc {
  address: String
  auctionId: String
  bidPrice: Number
  pubKey: String
  mnemonic: String
  hdPath: String
  type: String
}