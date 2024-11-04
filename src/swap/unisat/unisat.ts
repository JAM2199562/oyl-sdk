import { AddressType, AssetType, MarketplaceOffer } from "../../shared/interface"
import { Signer } from '../../signer'
import { Provider } from "../../provider"
import { OylTransactionError, getAddressType } from "../.."
import { signBip322Message } from "./BIP322"
import { GetListingPsbtRequest, ProcessListingOptions, ProcessListingResponse, ProcessOfferOptions, ProcessOfferResponse, Marketplaces, GetListingPsbtInfo, GetListingPsbtResponse, SubmitListingPsbtRequest, SubmitListingResponse } from "../types"

export interface UnsignedUnisatBid {
  address: string
  auctionId: string | string[]
  bidPrice: number | number[]
  pubKey: string
  receiveAddress: string
  altAddressSignature?: string
  feerate: number
  provider: Provider
  assetType: AssetType
}

export interface SignedUnisatBid {
  psbtHex: string
  auctionId: string
  bidId: string
  provider: Provider
  assetType: AssetType
}

export async function getSellerPsbt(unsignedBid: UnsignedUnisatBid) {
  switch (unsignedBid.assetType) {
    case AssetType.BRC20:
      return await unsignedBid.provider.api.initSwapBid(unsignedBid)

    case AssetType.RUNES:
      return await unsignedBid.provider.api.initRuneSwapBid(unsignedBid)

    case AssetType.COLLECTIBLE:
      return await unsignedBid.provider.api.initCollectionSwapBid(unsignedBid)
  }
}

export async function submitBuyerPsbt(signedBid: SignedUnisatBid) {
  switch (signedBid.assetType) {
    case AssetType.BRC20:
      return await signedBid.provider.api.submitSignedBid({ ...signedBid, psbtBid: signedBid.psbtHex })

    case AssetType.RUNES:
      return await signedBid.provider.api.submitSignedRuneBid({ ...signedBid, psbtBid: signedBid.psbtHex })

    case AssetType.COLLECTIBLE:
      return await signedBid.provider.api.submitSignedCollectionBid({ ...signedBid, psbtBid: signedBid.psbtHex })

  }
}

export async function processUnisatOffer({
  address,
  offer,
  receiveAddress,
  feeRate,
  pubKey,
  assetType,
  provider,
  utxos,
  signer
}: ProcessOfferOptions
): Promise<ProcessOfferResponse> {
  let dummyTxId: string | null = null;
  let purchaseTxId: string | null = null;
  const unsignedBid: UnsignedUnisatBid = {
    address,
    auctionId: offer.offerId,
    bidPrice: offer.totalPrice,
    pubKey,
    receiveAddress,
    feerate: feeRate,
    provider,
    assetType
  }
  if (
    address != receiveAddress
  ) {
    const signature = await getMessageSignature({ address, provider, receiveAddress, signer })
    unsignedBid['signature'] = signature
  }
  const psbt_ = await getSellerPsbt(unsignedBid)

  if (psbt_?.error) {
    throw new OylTransactionError(psbt_?.error)
  }
  if (psbt_.psbtDummy) {
    const unsignedDummyPsbt = psbt_.psbtDummy
    const signedDummyPsbt = await signer.signAllInputs({
      rawPsbtHex: unsignedDummyPsbt, 
      finalize: true,
    })
    await provider.pushPsbt({ psbtBase64: signedDummyPsbt.signedPsbt })
  }
  const unsignedPsbt: string = psbt_.psbtBid
  const signedPsbt = await signer.signAllInputs({
    rawPsbtHex: unsignedPsbt,
    finalize: false,
  })
  const data = await submitBuyerPsbt({
    psbtHex: signedPsbt.signedHexPsbt,
    auctionId: offer.offerId,
    bidId: psbt_.bidId,
    assetType,
    provider
  })
  if (data.txid) {
    purchaseTxId = data.txid
  }

  return {
    dummyTxId,
    purchaseTxId
  }
}


export async function processUnisatListing({
  address,
  listing,
  receiveBtcAddress,
  pubKey,
  receiveBtcPubKey,
  assetType,
  provider,
  signer,
}: ProcessListingOptions): Promise<ProcessListingResponse> {

  const listings: GetListingPsbtInfo[] = []
  const marketplaceType = listing.marketplace;

  listings.push({
    inscriptionId: listing?.inscriptionId,
    price: listing?.price,
    unitPrice: listing?.unitPrice,
    totalPrice: listing?.totalPrice,
    sellerReceiveAddress: receiveBtcAddress,
    utxo: listing?.outpoint
  })

  const unisatGetListingPsbt: GetListingPsbtRequest =  {
    marketplaceType,
    assetType,
    sellerAddress: address,
    sellerPublicKey: pubKey,
    listings
  }

  const listingPsbtResponse = await provider.api.getListingPsbt(unisatGetListingPsbt);
    if (listingPsbtResponse.statusCode != 200) {
        throw new Error(`Failed to get listing psbt: ${listingPsbtResponse.error}`)
    }

    const listingPsbt: GetListingPsbtResponse = listingPsbtResponse.data;
    const listingId = listingPsbt.additionalData.auctionId;
    const { signedHexPsbt } = await signer.signAllInputs({
        rawPsbtHex: listingPsbt.psbt,
        finalize: false,
    })

    const unisatSubmitListingPsbt: SubmitListingPsbtRequest = {
      marketplaceType,
      assetType,
      sellerAddress: address,
      sellerPublicKey: pubKey,
      signedPsbt: signedHexPsbt,
      orderId: listingId
    }


  const submitListingPsbtResponse = await provider.api.submitListingPsbt(unisatSubmitListingPsbt);
  if (submitListingPsbtResponse.statusCode != 200) {
      throw new Error(`Failed to submit listing psbt: ${submitListingPsbtResponse.error}`)
  }

  const submitListingPsbt: SubmitListingResponse = submitListingPsbtResponse.data


  return {
    success: submitListingPsbt.success,
    listingId
  }
}


export async function getMessageSignature({
  address,
  receiveAddress,
  signer,
  provider
}: {
  address: string,
  receiveAddress: string,
  signer: Signer,
  provider: Provider
}): Promise<string> {
  const message = `Please confirm that\nPayment Address: ${address}\nOrdinals Address: ${receiveAddress}`
  if (getAddressType(receiveAddress) == AddressType.P2WPKH) {
    const keyPair = signer.segwitKeyPair
    const privateKey = keyPair.privateKey
    const signature = await signBip322Message({
      message,
      network: provider.networkType,
      privateKey,
      signatureAddress: receiveAddress,
    })
    return signature
  } else if (getAddressType(receiveAddress) == AddressType.P2TR) {
    const keyPair = signer.taprootKeyPair
    const privateKey = keyPair.privateKey
    const signature = await signBip322Message({
      message,
      network: provider.networkType,
      privateKey,
      signatureAddress: receiveAddress,
    })
    return signature
  }
}