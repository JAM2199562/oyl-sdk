import fetch from 'node-fetch'
import * as bitcoin from 'bitcoinjs-lib'
import { AddressType, IBlockchainInfoUTXO } from '../shared/interface'
import { addressFormats } from '../wallet/accounts'

export const getBtcPrice = async () => {
  try {
    const response = await fetch(`https://blockchain.info/ticker`, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch btc price from binance`)
    }

    const jsonResponse = await response.json()

    return jsonResponse
  } catch (error) {
    console.log(error)
  }
}

export const calculateBalance = function (utxos): number {
  let balance = 0
  for (let utxo = 0; utxo < utxos.length; utxo++) {
    balance += utxos[utxo].value
  }
  return balance / 1e8 // Convert from satoshis to BTC
}

export const convertUsdValue = async (amount) => {
  const pricePayload = await getBtcPrice()
  const btcPrice = parseFloat(pricePayload.USD.last)
  const amountInBTC = parseFloat(amount) * btcPrice
  return amountInBTC.toFixed(2)
}

export const getMetaUtxos = async (
  address: string,
  utxos: IBlockchainInfoUTXO[],
  inscriptions
) => {
  const formattedData = []
  for (const utxo of utxos) {
    const formattedUtxo = {
      txId: utxo.tx_hash_big_endian,
      outputIndex: utxo.tx_output_n,
      satoshis: utxo.value,
      scriptPk: utxo.script,
      confirmations: utxo.confirmations,
      addressType: getAddressType(address),
      address: address,
      inscriptions: [],
    }

    for (const inscription of inscriptions) {
      if (inscription.detail.location.includes(utxo.tx_hash_big_endian)) {
        formattedUtxo.inscriptions.push(inscription.detail)
      }
    }

    formattedData.push(formattedUtxo)
  }

  return formattedData
}

export function getAddressType(address: string): AddressType | null {
  if (addressFormats.mainnet.p2pkh.test(address) || addressFormats.testnet.p2pkh.test(address) || addressFormats.regtest.p2pkh.test(address)) {
    return AddressType.P2PKH;
  }
  else if (addressFormats.mainnet.p2tr.test(address) || addressFormats.testnet.p2tr.test(address) || addressFormats.regtest.p2tr.test(address)) {
    return AddressType.P2TR;
  }
  else if (addressFormats.mainnet.p2sh.test(address) || addressFormats.testnet.p2sh.test(address) || addressFormats.regtest.p2sh.test(address)) {
    return AddressType.P2SH_P2WPKH;
  }
  else if (addressFormats.mainnet.p2wpkh.test(address) || addressFormats.testnet.p2wpkh.test(address) || addressFormats.regtest.p2wpkh.test(address)) {
    return AddressType.P2WPKH;
  }
 
  else {
    return null;
  }
}

export const validateTaprootAddress = ({ address, type }) => {
  try {
    const decodedBech32 = bitcoin.address.fromBech32(address)
    if (decodedBech32.version === 1 && decodedBech32.data.length === 32) {
      return type === 'taproot'
    }
  } catch (error) {
    // Address is not in Bech32 format
    return false
  }

  return false
}

export const validateSegwitAddress = ({ address, type }) => {
  try {
    const decodedBech32 = bitcoin.address.fromBech32(address)
    if (decodedBech32.version === 0) {
      return type === 'segwit'
    }
  } catch (error) {
    // Address is not in Bech32 format
    return false
  }

  return false
}
