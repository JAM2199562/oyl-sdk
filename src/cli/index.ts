import { Command } from 'commander'
import * as utxo from '../utxo'
import * as btc from '../btc'
import * as brc20 from '../brc20'
import * as collectible from '../collectible'
import * as rune from '../rune'
import * as alkanes from '../alkanes'

import 'dotenv/config'
import {
  generateMnemonic,
  getHDPaths,
  getWalletPrivateKeys,
  HDPaths,
  mnemonicToAccount,
} from '..'

import * as bitcoin from 'bitcoinjs-lib'
import { Provider } from '..'
import { Signer } from '..'
import { AssetType, MarketplaceOffers } from '..'
import { OylTransactionError } from '../errors'

const defaultProvider = {
  bitcoin: new Provider({
    url: 'https://mainnet.sandshrew.io',
    version: 'v2',
    projectId: process.env.SANDSHREW_PROJECT_ID!,
    network: bitcoin.networks.bitcoin,
    networkType: 'mainnet',
    apiUrl: 'https://staging-api.oyl.gg',
    //opiUrl: 'https://mainnet-opi.sandshrew.io/v1'
  }),
  regtest: new Provider({
    url: 'http://localhost:3000',
    projectId: 'regtest',
    network: bitcoin.networks.regtest,
    networkType: 'regtest',
    apiUrl: 'https://staging-api.oyl.gg',
    //opiUrl: 'https://mainnet-opi.sandshrew.io/v1'
  }),
}

const program = new Command()

program
  .name('default')
  .description('All functionality for oyl-sdk in a cli-wrapper')
  .version('0.0.1')

const privateKeysCommand = new Command('privateKeys')
  .description('Returns private keys for an account object')
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .option(
    '-i, --index <index>',
    'index you want to derive your account keys from'
  )
  .requiredOption(
    '-n, --network <network>',
    'the network you want to derive keys on'
  )
  .action((options) => {
    const privateKeys = getWalletPrivateKeys({
      mnemonic: options.mnemonic,
      opts: {
        index: options.index,
        network: bitcoin.networks[options.network],
      },
    })
    console.log(privateKeys)
  })

/* @dev example call 
  oyl account mnemonicToAccount \
  --mnemonic "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about" \
  --network regtest \
  --index 1 \
  --wallet-standard bip44_standard
*/
const mnemonicToAccountCommand = new Command('mnemonicToAccount')
  .description('Returns an account from a mnemonic')
  .requiredOption('-m, --mnemonic <mnemonic>', 'BIP39 mnemonic')
  .option('-n, --network <network>', 'The bitcoin network (default: bitcoin)')
  .option('-i, --index <index>', 'Account index (default: 0)')
  .option('-w, --wallet-standard <walletStandard>', 'Wallet standard')
  .action((options) => {
    let hdPaths: HDPaths
    if (options.walletStandard) {
      hdPaths = getHDPaths(
        options.index,
        bitcoin.networks[options.network],
        options.walletStandard
      )
    }

    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        index: options.index,
        network: bitcoin.networks[options.network],
        hdPaths,
      },
    })
    console.log(account)
  })

const generateMnemonicCommand = new Command('generateMnemonic')
  .description('Returns a new mnemonic phrase')
  .action(() => {
    const mnemonic = generateMnemonic()
    console.log(mnemonic)
  })

const signPsbt = new Command('sign')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when signing the network psbt'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )

  .requiredOption('-f, --finalize <finalize>', 'flag to finalize and push psbt')
  .requiredOption('-e, --extract <finalize>', 'flag to extract transaction')

  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )

  /* @dev example call 
  oyl account sign 
  -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' 
  -native '4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3'
  -p regtest 
  -f yes
  -e yes
*/

  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })

    let finalize = options.finalize == 'yes' ? true : false
    let extract = options.extract == 'yes' ? true : false
    const { signedHexPsbt, signedPsbt } = await signer.signAllInputs({
      rawPsbtHex: process.env.PSBT_HEX,
      finalize,
    })

    if (extract) {
      const extractedTx =
        bitcoin.Psbt.fromHex(signedHexPsbt).extractTransaction()
      console.log('extracted tx', extractedTx)
      console.log('extracted tx hex', extractedTx.toHex())
    }
    console.log('signed hex psbt', signedHexPsbt)
    console.log('--------------------------------------')
    console.log('signed psbt', signedPsbt)
  })

const accountUtxosToSpend = new Command('accountUtxos')
  .description('Returns available utxos to spend')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  /* @dev example call
    oyl utxo accountUtxos -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -p regtest
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]

    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: { network: provider.network },
    })
    console.log(
      await utxo.accountUtxos({
        account,
        provider,
      })
    )
  })

const accountAvailableBalance = new Command('balance')
  .description('Returns available utxos to spend')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  /* @dev example call
    oyl utxo balance -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'  -p regtest
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: { network: provider.network },
    })
    console.log(
      await utxo.accountBalance({
        account,
        provider,
      })
    )
  })

const addressBRC20Balance = new Command('addressBRC20Balance')
  .description('Returns all BRC20 balances')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-a, --address <address>',
    'address you want to get utxos for'
  )

  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    console.log((await provider.api.getBrc20sByAddress(options.address)).data)
  })

const addressUtxosToSpend = new Command('addressUtxos')
  .description('Returns available utxos to spend')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-a, --address <address>',
    'address you want to get utxos for'
  )
  /* @dev example call
    oyl utxo addressUtxos -a bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx -p regtest
  */
  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    console.log(
      await utxo.addressUtxos({
        address: options.address,
        provider,
      })
    )
  })

const btcSend = new Command('send')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-amt, --amount <amount>', 'amount you want to send')
  .requiredOption('-t, --to <to>', 'address you want to send to')
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')

  /* @dev example call 
  oyl btc send -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3 -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361 -p regtest -t bcrt1qzr9vhs60g6qlmk7x3dd7g3ja30wyts48sxuemv -amt 1000 -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })

    const { accountSpendableTotalUtxos } = await utxo.accountUtxos({
      account,
      provider,
    })

    console.log(
      await btc.send({
        utxos: accountSpendableTotalUtxos,
        toAddress: options.to,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
        amount: options.amount,
      })
    )
  })

const brc20Send = new Command('send')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-amt, --amount <amount>', 'amount you want to send')
  .requiredOption('-t, --to <to>', 'address you want to send to')
  .requiredOption('-tick', '--ticker <ticker>', 'brc20 ticker to send')
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')

  /* @dev example call 
  oyl brc20 send -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3 -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361 -p regtest -t bcrt1qzr9vhs60g6qlmk7x3dd7g3ja30wyts48sxuemv -tick toyl -amt 1000 -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })

    const { accountSpendableTotalUtxos, accountSpendableTotalBalance } =
      await utxo.accountUtxos({ account, provider })

    console.log(
      await brc20.send({
        gatheredUtxos: {
          utxos: accountSpendableTotalUtxos,
          totalAmount: accountSpendableTotalBalance,
        },
        ticker: options.ticker,
        toAddress: options.to,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
        amount: options.amount,
      })
    )
  })

const collectibleSend = new Command('send')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-t, --to <to>', 'address you want to send to')
  .requiredOption(
    '-inscId, --inscriptionId <inscriptionId>',
    'inscription to send'
  )
  .requiredOption(
    '-inscAdd, --inscriptionAddress <inscriptionAddress>',
    'current holder of inscription to send'
  )
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')

  /* @dev example call 
  oyl collectible send 
  -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' 
  -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3
  -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361
  -p regtest 
  -t bcrt1qzr9vhs60g6qlmk7x3dd7g3ja30wyts48sxuemv 
  -inscId d0c21b35f27ba6361acd5172fcfafe8f4f96d424c80c00b5793290387bcbcf44i0
  -inscAdd bcrt1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqvg32hk
  -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })
    const gatheredUtxos = await utxo.accountUtxos({ account, provider })
    console.log(
      await collectible.send({
        gatheredUtxos: {
          utxos: gatheredUtxos.accounts['nativeSegwit'].spendableUtxos,
          totalAmount:
            gatheredUtxos.accounts['nativeSegwit'].spendableTotalBalance,
        },
        inscriptionId: options.inscriptionId,
        inscriptionAddress: options.inscriptionAddress,
        toAddress: options.to,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
      })
    )
  })

const runeSend = new Command('send')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-t, --to <to>', 'address you want to send to')
  .requiredOption('-runeId, --runeId <runeId>', 'runeId to send')
  .requiredOption(
    '-inscAdd, --inscriptionAddress <inscriptionAddress>',
    'current holder of inscription to send'
  )
  .requiredOption('-amt, --amount <amount>', 'amount of runes you want to send')
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')

  /* @dev example call 
  oyl rune send 
  -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' 
  -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3
  -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361
  -p regtest 
  -t bcrt1qzr9vhs60g6qlmk7x3dd7g3ja30wyts48sxuemv 
  -amt 100
  -runeId 279:1
  -inscAdd bcrt1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqvg32hk
  -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })
    const { accountSpendableTotalUtxos, accountSpendableTotalBalance } =
      await utxo.accountUtxos({
        account,
        provider,
      })
    console.log(
      await rune.send({
        gatheredUtxos: {
          utxos: accountSpendableTotalUtxos,
          totalAmount: accountSpendableTotalBalance,
        },
        runeId: options.runeId,
        amount: options.amount,
        inscriptionAddress: options.inscriptionAddress,
        toAddress: options.to,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
      })
    )
  })

const runeMint = new Command('mint')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-runeId, --runeId <runeId>', 'runeId to send')
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')

  /* @dev example call 
  oyl rune mint 
  -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' 
  -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3
  -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361
  -p regtest 
  -runeId 279:1
  -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })
    const gatheredUtxos = await utxo.accountSpendableUtxos({
      account,
      provider,
    })
    console.log(
      await rune.mint({
        gatheredUtxos,
        runeId: options.runeId,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
      })
    )
  })

const runeEtchCommit = new Command('etchCommit')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-rune-name, --rune-name <runeName>', 'name of rune to etch')

  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')

  /* @dev example call 
oyl rune etch -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3 -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361 -p regtest -feeRate 2 -divisibility 3 -cap 100000 -pre 1000 -symbol Z -rune-name OYLTESTER -per-mint-amount 500
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })
    const { accountSpendableTotalUtxos, accountSpendableTotalBalance } =
      await utxo.accountUtxos({ account, provider })

    console.log(
      await rune.etchCommit({
        gatheredUtxos: {
          utxos: accountSpendableTotalUtxos,
          totalAmount: accountSpendableTotalBalance,
        },
        runeName: options.runeName,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
      })
    )
  })

const runeEtchReveal = new Command('etchReveal')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption('-commitId, --commitId <commitId>', 'commitId')
  .requiredOption('-scrp, --script <script>', 'commit script to spend')
  .requiredOption('-symbol, --symbol <symbol>', 'symbol for rune to etch')
  .requiredOption('-rune-name, --rune-name <runeName>', 'name of rune to etch')
  .requiredOption(
    '-per-mint-amount, --per-mint-amount <perMintAmount>',
    'the amount of runes each mint'
  )
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')
  .option('-turbo, --turbo <turbo>', 'use turbo')
  .option(
    '-divisibility, --divisibility <divisibility>',
    'divisibility of rune'
  )
  .option('-cap, --cap <cap>', 'cap / total number of rune')
  .option('-pre, --premine <premine>', 'premined amount of rune')

  /* @dev example call 
oyl rune etch -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3 -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361 -p regtest -feeRate 2 -divisibility 3 -cap 100000 -pre 1000 -symbol Z -rune-name OYLTESTER -per-mint-amount 500
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })

    console.log(
      await rune.etchReveal({
        commitTxId: options.commitId,
        script: options.script,
        symbol: options.symbol,
        premine: options.premine,
        perMintAmount: options.perMintAmount,
        turbo: Boolean(Number(options.turbo)),
        divisibility: Number(options.divisibility),
        runeName: options.runeName,
        feeRate: options.feeRate,
        account,
        signer,
        provider,
      })
    )
  })

const alkaneFactoryDeploy = new Command('factoryDeploy')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )

  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')
  .requiredOption('-address, --address <address>', 'address you want to fund')

  /* @dev example call 
oyl alkane factoryDeploy -address -address bcrt1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqvg32hk -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3 -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361 -p regtest -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })

    const waitFiveSeconds = async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })
    const { accountSpendableTotalUtxos, accountSpendableTotalBalance } =
      await utxo.accountUtxos({ account, provider })

    const commit = await alkanes.deployCommit({
      gatheredUtxos: {
        utxos: accountSpendableTotalUtxos,
        totalAmount: accountSpendableTotalBalance,
      },
      feeRate: options.feeRate,
      account,
      signer,
      provider,
    })

    const mempool = await provider.sandshrew.bitcoindRpc.getRawMemPool(true)
    const mempoolTxs = Object.keys(mempool)
    console.log('mempool transactions: ', mempoolTxs)
    const blockHash = await provider.sandshrew.bitcoindRpc.generateBlock(
      options.address,
      mempoolTxs
    )
    console.log('Processed block: ', blockHash)
    console.log({ mempoolTxs, blockHash })
    waitFiveSeconds()

    const reveal = await alkanes.deployReveal({
      commitTxId: commit.txId,
      script: commit.script,
      account,
      provider,
      feeRate: options.feeRate,
      signer,
    })

    console.log({ commit: commit, reveal: reveal })
  })

const alkaneExecute = new Command('execute')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )

  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option('-feeRate, --feeRate <feeRate>', 'fee rate')
  .requiredOption('-address, --address <address>', 'address you want to fund')

  /* @dev example call 
oyl alkane execute -m 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' -native 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3 -taproot 41f41d69260df4cf277826a9b65a3717e4eeddbeedf637f212ca096576479361 -p regtest -feeRate 2
*/

  .action(async (options) => {
    const provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })

    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
      },
    })
    const { accountSpendableTotalUtxos, accountSpendableTotalBalance } =
      await utxo.accountUtxos({ account, provider })

    console.log(
      await alkanes.execute({
        gatheredUtxos: {
          utxos: accountSpendableTotalUtxos,
          totalAmount: accountSpendableTotalBalance,
        },
        feeRate: options.feeRate,
        calldata: [
          BigInt(6),
          BigInt(0x0ffe),
          0n,
          100000000n,
          100000n,
          200000000n,
          BigInt(0x414243),
          BigInt(0x414243),
        ],
        account,
        signer,
        provider,
      })
    )
  })

const getRuneByName = new Command('getRuneByName')
  .description('Returns rune details based on name provided')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption('-name, --name <name>', 'name of the rune you want to fetch')
  /* @dev example call
    oyl rune getRuneByName -name ETCHSGSXCUMYO -p regtest
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    console.log(await provider.ord.getRuneByName(options.name))
  })

const multiCallSandshrewProviderCall = new Command('sandShrewMulticall')
  .description('Returns available utxos to spend')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )

  .requiredOption(
    '-c, --calls <calls>',
    'calls in this format: {method: string, params: string[]}'
  )

  /* @dev example call
    oyl provider sandShrewMulticall -c '[{"method":"esplora_tx","params":["688f5c239e4e114af461dc1331d02ad5702e795daf2dcf397815e0b05cd23dbc"]},{"method":"btc_getblockcount", "params":[]}]' -p bitcoin
  */
  .action(async (options) => {
    type Call = { method: string; params: string[] }

    let isJson: Call[] = []
    try {
      isJson = JSON.parse(options.calls)

      const multiCall: (string | string[])[][] = isJson.map((call: Call) => {
        return [call.method, call.params]
      })

      const provider: Provider = defaultProvider[options.provider]
      console.log(await provider.sandshrew.multiCall(multiCall))
    } catch (error) {
      console.log(error)
    }
  })

const apiProviderCall = new Command('api')
  .description('Returns data based on api method invoked')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use to access the network.'
  )
  .requiredOption(
    '-method, --method <method>',
    'name of the method you want to call for the api.'
  )
  .option(
    '-params, --parameters <parameters>',
    'parameters for the api method you are calling.'
  )
  /* @dev example call
    oyl provider api -method getUnisatTickerOffers -params '{"ticker":"ordi"}' -p bitcoin

    please note the json format if you need to pass an object.
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    let isJson: object
    try {
      isJson = JSON.parse(options.parameters)
      console.log(await provider.api[options.method](isJson))
    } catch (error) {
      console.log(await provider.api[options.method](options.parameters))
    }
  })

const alkanesProvider = new Command('alkanes')
  .description('Returns data based on alkanes method invoked')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use to access the network.'
  )
  .requiredOption(
    '-method, --method <method>',
    'name of the method you want to call for the api.'
  )
  .option(
    '-params, --parameters <parameters>',
    'parameters for the api method you are calling.'
  )
  /* @dev example call
    oyl provider alkanes -method getAlkanesByAddress -params '{"address":"brct21...", protocolTag:"1"}' -p regtest
    please note the json format if you need to pass an object.

       oyl provider alkanes -method simulate -params '{ "alkanes": [],"transaction": "0x", "block": "0x", "height": "20000", "txindex": 0, "target": {"block": "2", "tx": "1"}, "inputs": ["101"],"pointer": 0, "refundPointer": 0, "vout": 0}' -p regtest
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    let isJson: object
    try {
      isJson = JSON.parse(options.parameters)
      console.log(
        JSON.stringify(await provider.alkanes[options.method](isJson), null, 2)
      )
    } catch (error) {
      console.log(await provider.alkanes[options.method](options.parameters))
    }
  })

const ordProviderCall = new Command('ord')
  .description('Returns data based on ord method invoked')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use to access the network.'
  )
  .requiredOption(
    '-method, --method <method>',
    'name of the method you want to call for the api.'
  )
  .option(
    '-params, --parameters <parameters>',
    'parameters for the ord method you are calling.'
  )
  /* @dev example call
    oyl provider ord -method getTxOutput -params '{"ticker":"ordi"}' -p bitcoin

    please note the json format if you need to pass an object.
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    let isJson: object
    try {
      isJson = JSON.parse(options.parameters)
      console.log(await provider.ord[options.method](isJson))
    } catch (error) {
      console.log(await provider.ord[options.method](options.parameters))
    }
  })

const opiProviderCall = new Command('opi')
  .description('Returns data based on opi query')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use to access the network.'
  )
  .requiredOption(
    '-method, --method <method>',
    'name of the method you want to call for the api.'
  )
  .option(
    '-params, --parameters <parameters>',
    'parameters for the ord method you are calling.'
  )
  /* @dev example call
    oyl provider opi -method getBrc20Balance -params '{"address":"bcrt1qzr9vhs60g6qlmk7x3dd7g3ja30wyts48sxuemv","ticker":"ordi"}' -p bitcoin

    please note the json format if you need to pass an object.
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    let isJson: object
    try {
      isJson = JSON.parse(options.parameters)
      console.log(await provider.opi[options.method](isJson))
    } catch (error) {
      console.log(await provider.opi[options.method](options.parameters))
    }
  })

const marketPlaceBuy = new Command('buy')

  .description('Returns rune details based on name provided')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use to access the network.'
  )
  .requiredOption(
    '-m, --mnemonic <mnemonic>',
    'mnemonic you want to get private keys from'
  )
  .requiredOption(
    '-type, --asset-type <assetType>',
    'pass BRC20, COLLECTIBLE or RUNE'
  )
  .requiredOption('-feeRate, --feeRate <feeRate>', 'fee rate')
  .requiredOption(
    '-tick --ticker <ticker>',
    'Asset ticker to fetch quotes for.'
  )
  .option('-legacy, --legacy <legacy>', 'legacy private key')
  .option('-taproot, --taproot <taproot>', 'taproot private key')
  .option(
    '-nested, --nested-segwit <nestedSegwit>',
    'nested segwit private key'
  )
  .option(
    '-native, --native-segwit <nativeSegwit>',
    'native segwit private key'
  )
  .option(
    '-receive, --receive-address <receiveAddress>',
    'address to receieve the assets.'
  )

  /* @dev example call
    oyl marketplace buy -type BRC20 -tick ordi -feeRate 30 -native <nativePrivateKey> -p bitcoin

    please note the json format if you need to pass an object.
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    const signer = new Signer(provider.network, {
      segwitPrivateKey: options.nativeSegwit,
      taprootPrivateKey: options.taproot,
      nestedSegwitPrivateKey: options.nestedSegwit,
      legacyPrivateKey: options.legacy,
    })
    const account = mnemonicToAccount({
      mnemonic: options.mnemonic,
      opts: {
        network: provider.network,
        spendStrategy: {
          addressOrder: ['taproot', 'nativeSegwit'],
          utxoSortGreatestToLeast: true,
          changeAddress: 'taproot',
        },
      },
    })
    let quotes: MarketplaceOffers[]
    switch (options.assetType) {
      case 'BRC20':
        options.assetType = AssetType.BRC20
        quotes = await provider.api.getBrc20Offers({
          ticker: options.ticker,
        })

        break
      case 'RUNES':
        options.assetType = AssetType.RUNES
        quotes = await provider.api.getRuneOffers({
          ticker: options.ticker,
        })
        break
      case 'COLLECTIBLE':
        options.assetType = AssetType.COLLECTIBLE
        break
      default:
        throw new OylTransactionError(Error('Incorrect asset type'))
    }
    // const marketplace: Trade = new Trade({
    //   provider: provider,
    //   receiveAddress:
    //     options.receiveAddress === undefined
    //       ? account.taproot.address
    //       : options.receiveAddress,
    //   account: account,
    //   assetType: options.assetType,
    //   signer,
    //   feeRate: Number(options.feeRate),
    // })
    // const offersToBuy = await marketplace.processAllOffers(quotes)
    // const signedTxs = await marketplace.buyMarketPlaceOffers(offersToBuy)
    // console.log(signedTxs)
  })

const fundAddress = new Command('fund')
  .description('Funds regtest address')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption('-address, --address <address>', 'address you want to fund')
  /* @dev example call
    oyl regtest fund -address "bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx" -p regtest
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    console.log(
      await provider.sandshrew.bitcoindRpc.generateToAddress(
        200,
        options.address
      )
    )
  })

const genBlock = new Command('genBlock')
  .description('Blocks to generate')
  .requiredOption(
    '-p, --provider <provider>',
    'provider to use when querying the network for utxos'
  )
  .requiredOption('-address, --address <address>', 'address you want to fund')
  /* @dev example call
    oyl regtest genBlock -address "bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx" -p regtest
  */
  .action(async (options) => {
    const provider: Provider = defaultProvider[options.provider]
    const mempool = await provider.sandshrew.bitcoindRpc.getRawMemPool(true)
    const mempoolTxs = Object.keys(mempool)
    console.log('mempool transactions: ', mempoolTxs)
    const blockHash = await provider.sandshrew.bitcoindRpc.generateBlock(
      options.address,
      mempoolTxs
    )
    console.log('Processed block: ', blockHash)
    console.log({ mempoolTxs, blockHash })
  })

const regtestCommand = new Command('regtest')
  .description('Regtest commands')
  .addCommand(fundAddress)
  .addCommand(genBlock)

const accountCommand = new Command('account')
  .description('Manage accounts')
  .addCommand(mnemonicToAccountCommand)
  .addCommand(signPsbt)
  .addCommand(privateKeysCommand)
  .addCommand(generateMnemonicCommand)

const utxosCommand = new Command('utxo')
  .description('Examine utxos')
  .addCommand(accountUtxosToSpend)
  .addCommand(addressUtxosToSpend)
  .addCommand(accountAvailableBalance)
const btcCommand = new Command('btc')
  .description('Functions for sending bitcoin')
  .addCommand(btcSend)

const brc20Command = new Command('brc20')
  .description('Functions for brc20')
  .addCommand(brc20Send)
  .addCommand(addressBRC20Balance)
const collectibleCommand = new Command('collectible')
  .description('Functions for collectibles')
  .addCommand(collectibleSend)
const runeCommand = new Command('rune')
  .description('Functions for runes')
  .addCommand(runeSend)
  .addCommand(runeMint)
  .addCommand(runeEtchCommit)
  .addCommand(runeEtchReveal)
  .addCommand(getRuneByName)

const alkaneCommand = new Command('alkane')
  .description('Functions for alkanes')
  .addCommand(alkaneFactoryDeploy)
  .addCommand(alkaneExecute)

const providerCommand = new Command('provider')
  .description('Functions avaialble for all provider services')
  .addCommand(apiProviderCall)
  .addCommand(ordProviderCall)
  .addCommand(opiProviderCall)
  .addCommand(multiCallSandshrewProviderCall)
  .addCommand(alkanesProvider)

const marketPlaceCommand = new Command('marketplace')
  .description('Functions for marketplace')
  .addCommand(marketPlaceBuy)

program.addCommand(regtestCommand)
program.addCommand(alkaneCommand)
program.addCommand(utxosCommand)
program.addCommand(accountCommand)
program.addCommand(btcCommand)
program.addCommand(brc20Command)
program.addCommand(collectibleCommand)
program.addCommand(runeCommand)
program.addCommand(providerCommand)
program.addCommand(marketPlaceCommand)

program.parse(process.argv)
