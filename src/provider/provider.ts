import { SandshrewBitcoinClient } from '../rpclient/sandshrew'
import { EsploraRpc } from '../rpclient/esplora'
import { OrdRpc } from '../rpclient/ord'
import { Opi } from '../rpclient/opi'
import { OylApiClient } from '../apiclient'
import * as bitcoin from 'bitcoinjs-lib'
import { waitForTransaction } from '../shared/utils'
import { defaultNetworkOptions } from '../shared/constants'

export type ProviderConstructorArgs = {
  url: string
  projectId: string
  network: bitcoin.networks.Network
  networkType: 'signet' | 'mainnet' | 'testnet' | 'regtest'
  version?: string
  apiUrl?: string
  opiUrl?: string
}

export class Provider {
  public sandshrew: SandshrewBitcoinClient
  public esplora: EsploraRpc
  public ord: OrdRpc
  public opi: Opi
  public api: OylApiClient
  public network: bitcoin.networks.Network
  public networkType: string

  constructor({
    url,
    projectId,
    network,
    networkType,
    version = 'v1',
    apiUrl,
    opiUrl,
  }: ProviderConstructorArgs) {
    let isTestnet: boolean
    let isRegtest: boolean
    switch (network) {
      case bitcoin.networks.testnet:
        isTestnet = true

      case bitcoin.networks.regtest:
        isRegtest = true
    }
    const masterUrl = `${url}/${version}/${projectId}`
    this.sandshrew = new SandshrewBitcoinClient(masterUrl)
    this.esplora = new EsploraRpc(masterUrl)
    this.ord = new OrdRpc(masterUrl)
    this.opi = new Opi(
      opiUrl ? opiUrl : defaultNetworkOptions[networkType].opiUrl
    )
    this.api = new OylApiClient({
      network: networkType,
      host: apiUrl ? apiUrl : defaultNetworkOptions[networkType].apiUrl,
      testnet: isTestnet ? true : null,
      regtest: isRegtest ? true : null,
      apiKey: projectId,
    })
    this.api.setAuthToken(process.env.API_TOKEN)
    this.network = network
    this.networkType = networkType
  }

  async pushPsbt({
    psbtHex,
    psbtBase64,
  }: {
    psbtHex?: string
    psbtBase64?: string
  }) {
    if (!psbtHex && !psbtBase64) {
      throw new Error('Please supply psbt in either base64 or hex format')
    }
    if (psbtHex && psbtBase64) {
      throw new Error('Please select one format of psbt to broadcast')
    }
    let psbt: bitcoin.Psbt
    if (psbtHex) {
      psbt = bitcoin.Psbt.fromHex(psbtHex, {
        network: this.network,
      })
    }

    if (psbtBase64) {
      psbt = bitcoin.Psbt.fromBase64(psbtBase64, {
        network: this.network,
      })
    }
    let extractedTx: bitcoin.Transaction
    try {
      extractedTx = psbt.extractTransaction()
    } catch (error) {
      throw new Error('Transaction could not be extracted do to invalid Psbt.')
    }
    const txId = extractedTx.getId()
    const rawTx = extractedTx.toHex()

    const [result] = await this.sandshrew.bitcoindRpc.testMemPoolAccept([rawTx])

    if (!result.allowed) {
      throw new Error(result['reject-reason'])
    }
    await this.sandshrew.bitcoindRpc.sendRawTransaction(rawTx)

    await waitForTransaction({
      txId,
      sandshrewBtcClient: this.sandshrew,
    })

    const txInMemPool = await this.sandshrew.bitcoindRpc.getMemPoolEntry(txId)
    const fee = txInMemPool.fees['base'] * 10 ** 8

    return {
      txId,
      rawTx,
      size: txInMemPool.vsize,
      weight: txInMemPool.weight,
      fee: fee,
      satsPerVByte: (fee / (txInMemPool.weight / 4)).toFixed(2),
    }
  }
}
