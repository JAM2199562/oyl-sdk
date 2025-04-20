import { Provider } from '../provider/provider'
import * as dotenv from 'dotenv'
import * as bitcoin from 'bitcoinjs-lib'
import { EsploraUtxo, addressUtxos, selectUtxos } from './utxo'
import { FormattedUtxo } from '../shared/interface'
import { accountUtxos } from '../__fixtures__/utxos'

dotenv.config()

const provider = new Provider({
  url: 'https://mainnet.sandshrew.io',
  projectId: process.env.SANDSHREW_PROJECT_ID!,
  network: bitcoin.networks.bitcoin,
  networkType: 'mainnet',
})

const testFormattedUtxos: FormattedUtxo[] = [
  {
    txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
    outputIndex: 2,
    satoshis: 100000,
    confirmations: 3,
    scriptPk:
      'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    inscriptions: [],
  },
  {
    txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b275',
    outputIndex: 0,
    satoshis: 50000,
    confirmations: 3,
    scriptPk:
      'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    inscriptions: [],
  },
]

const testEsploraUtxos: EsploraUtxo[] = [
  // [0] Confirmed/indexed tx without inscriptions or runes
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
    vout: 2,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240702,
    },
    value: 100000,
  },
  // [1] Confirmed/indexed tx without inscriptions or runes
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b275',
    vout: 0,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240701,
    },
    value: 50000,
  },
  // [2] Confirmed tx that has not been indexed by ord
  {
    txid: '43c1fb9af87e2ef21d216da3e35727ee1dad32afd6fd73510fc6f42a48229a7f',
    vout: 0,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240701,
    },
    value: 546,
  },
  // [3] Unconfirmed tx
  {
    txid: 'ad90d820fc7f25e32c775ccf9f90d3669864fef436abcd44776f03d4a11540c4',
    vout: 0,
    status: {
      confirmed: false,
    },
    value: 50000,
  },
  // [4] Confirmed/indexed tx with inscriptions
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b276',
    vout: 1,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240703,
    },
    value: 546,
  },
  // [5] Confirmed/indexed tx with runes
  {
    txid: 'a24dd4edc2fdfa769ba45cb480d392b806ad12533b097c84285d808d65b9f923',
    vout: 1,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240704,
    },
    value: 546,
  },
]

const testOrdTxOutputs = [
  // [0] Confirmed/indexed tx without inscriptions or runes
  {
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    indexed: true,
    inscriptions: [],
    runes: {},
    sat_ranges: [[1956902243257152, 1956902243257698]],
    script_pubkey:
      'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    spent: false,
    transaction:
      '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
    value: 100000,
  },
  // [1] Confirmed/indexed tx without inscriptions or runes
  {
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    indexed: true,
    inscriptions: [],
    runes: {},
    sat_ranges: [[1956902243257152, 1956902243257698]],
    script_pubkey:
      'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    spent: false,
    transaction:
      '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b275',
    value: 50000,
  },
  // [2] Confirmed tx that has not been indexed by ord
  {
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    indexed: false,
    inscriptions: [],
    runes: {},
    sat_ranges: [],
    script_pubkey:
      'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    spent: false,
    transaction:
      '43c1fb9af87e2ef21d216da3e35727ee1dad32afd6fd73510fc6f42a48229a7f',
    value: 546,
  },
  // [3] Unconfirmed tx
  {
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    indexed: false,
    inscriptions: [],
    runes: {},
    sat_ranges: [],
    script_pubkey:
      'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    spent: false,
    transaction:
      'ad90d820fc7f25e32c775ccf9f90d3669864fef436abcd44776f03d4a11540c4',
    value: 546,
  },
  // [4] Confirmed/indexed tx with inscriptions
  {
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    indexed: true,
    inscriptions: [
      'e605df4731c8773902dd6f56bfbec815db26d530da00dbdc697e35a992269987i0',
    ],
    runes: {},
    sat_ranges: [[1956902243257152, 1956902243257698]],
    script_pubkey:
      'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    spent: false,
    transaction:
      '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b277',
    value: 25000,
  },
  // [5] Confirmed/indexed tx with runes
  {
    address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
    indexed: true,
    inscriptions: [],
    runes: {
      RUNE: {},
    },
    sat_ranges: [[1956902243257152, 1956902243257698]],
    script_pubkey:
      'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    spent: false,
    transaction:
      'a24dd4edc2fdfa769ba45cb480d392b806ad12533b097c84285d808d65b9f923',
    value: 546,
  },
]

const testEsploraTxInfo = [
  // [0] Confirmed/indexed tx without inscriptions or runes
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
    version: 2,
    locktime: 0,
    vin: [],
    vout: [
      {},
      {},
      {
        scriptpubkey:
          'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
        value: 200000,
      },
    ],
    size: 261,
    weight: 714,
    fee: 302,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240702,
    },
  },
  // [1] Confirmed/indexed tx without inscriptions or runes
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b275',
    version: 2,
    locktime: 0,
    vin: [],
    vout: [
      {
        scriptpubkey:
          'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_asm:
          'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_type: 'v1_p2tr',
        scriptpubkey_address:
          'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
        value: 50000,
      },
    ],
    size: 261,
    weight: 714,
    fee: 302,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240702,
    },
  },
  // [2] Confirmed tx that has not been indexed by ord
  {
    txid: '43c1fb9af87e2ef21d216da3e35727ee1dad32afd6fd73510fc6f42a48229a7f',
    version: 2,
    locktime: 0,
    vin: [],
    vout: [
      {
        scriptpubkey:
          'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_asm:
          'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_type: 'v1_p2tr',
        scriptpubkey_address:
          'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
        value: 546,
      },
    ],
    size: 261,
    weight: 714,
    fee: 302,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240702,
    },
  },
  // [3] Unconfirmed tx
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
    version: 2,
    locktime: 0,
    vin: [],
    vout: [
      {
        scriptpubkey:
          'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
        value: 546,
      },
    ],
    size: 261,
    weight: 714,
    fee: 302,
    status: {
      confirmed: false,
    },
  },
  // [4] Confirmed/indexed tx with inscriptions
  {
    txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b276',
    version: 2,
    locktime: 0,
    vin: [],
    vout: [
      {
        scriptpubkey:
          'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae1',
        scriptpubkey_asm:
          'OP_PUSHNUM_1 OP_PUSHBYTES_32 b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
        scriptpubkey_type: 'v1_p2tr',
        scriptpubkey_address:
          'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
        value: 25000,
      },
      {
        scriptpubkey: '0014c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
        value: 546,
      },
    ],
    size: 261,
    weight: 714,
    fee: 302,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240702,
    },
  },
  // [5] Confirmed/indexed tx with runes
  {
    txid: 'a24dd4edc2fdfa769ba45cb480d392b806ad12533b097c84285d808d65b9f923',
    version: 2,
    locktime: 0,
    vin: [],
    vout: [
      {},
      {
        scriptpubkey: '0014c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2',
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
        value: 546,
      },
    ],
    size: 261,
    weight: 714,
    fee: 302,
    status: {
      confirmed: true,
      block_height: 280,
      block_hash:
        '519a8fa6b439da658a83b231486958a26c76ca92811d1e5cc7bcb94bd574c20f',
      block_time: 1719240702,
    },
  },
]

// Add test alkane data for the updated implementation
const testAlkanes = [
  // No alkanes for the first two UTXOs (null values)
  null,
  null,
  // Alkane for third UTXO
  {
    outpoint: {
      txid: '3a7f22842a6ffc0135d76ffd2ad3add1ee72753ead36d21f22e7ef89afb1fc43',
      vout: 0,
    },
    output: {
      value: 546,
      script:
        'b7fbbedbe61b51bf4e41e3517b8232f31c64f3b67ffd2d8eecff12fc7db4cae5',
    },
  },
  // No alkane for unconfirmed tx
  null,
  // No alkane for inscription
  null,
  // No alkane for rune
  null,
]

// Mock the multicall results for the new implementation
const mockMultiCallResponses = [
  // First UTXO
  [
    { result: testOrdTxOutputs[0] }, // ord_output
    { result: testEsploraTxInfo[0] }, // esplora_tx
    { result: [] }, // alkanes_protorunesbyoutpoint
  ],
  // Second UTXO
  [
    { result: testOrdTxOutputs[1] },
    { result: testEsploraTxInfo[1] },
    { result: [] },
  ],
  // Third UTXO (with alkane)
  [
    { result: testOrdTxOutputs[2] },
    { result: testEsploraTxInfo[2] },
    { result: [testAlkanes[2]] },
  ],
  // Fourth UTXO (unconfirmed)
  [
    { result: testOrdTxOutputs[3] },
    { result: testEsploraTxInfo[3] },
    { result: [] },
  ],
  // Fifth UTXO (with inscription)
  [
    { result: testOrdTxOutputs[4] },
    { result: testEsploraTxInfo[4] },
    { result: [] },
  ],
  // Sixth UTXO (with rune)
  [
    { result: testOrdTxOutputs[5] },
    { result: testEsploraTxInfo[5] },
    { result: [] },
  ],
]

const mockSandshrewMultiCall = jest.fn().mockImplementation((calls) => {
  // First call is for retrieving UTXOs and block count
  if (calls[0][0] === 'esplora_address::utxo') {
    return Promise.resolve([{ result: testEsploraUtxos }, { result: 283 }])
  }
  // For UTXO processing, return mocked responses based on the txid:vout
  const txIdVout = calls[0][1][0]
  const index = testEsploraUtxos.findIndex(
    (utxo) => `${utxo.txid}:${utxo.vout}` === txIdVout
  )

  if (index >= 0 && index < mockMultiCallResponses.length) {
    return Promise.resolve(mockMultiCallResponses[index])
  }

  return Promise.resolve([])
})

const mockAlkanesByAddress = jest.fn().mockResolvedValue([])

jest.mock('../provider/provider', () => {
  return {
    Provider: jest.fn().mockImplementation(() => ({
      network: bitcoin.networks.bitcoin,
      sandshrew: {
        multiCall: (calls) => mockSandshrewMultiCall(calls),
      },
      esplora: {
        getTxInfo: () => Promise.resolve({}),
      },
      ord: {
        getTxOutput: () => Promise.resolve({}),
      },
      alkanes: {
        getAlkanesByAddress: () => mockAlkanesByAddress(),
      },
    })),
  }
})

describe('utxo', () => {
  it('addressUtxos', async () => {
    const result = await addressUtxos({
      address: 'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
      provider: provider,
    })

    expect(result.spendableUtxos).toEqual(testFormattedUtxos)
    expect(result.spendableTotalBalance).toEqual(150000)
    expect(mockSandshrewMultiCall).toHaveBeenCalled()
  })

  describe('selectUtxos', () => {
    it('returns the right utxos for smart spend (default)', async () => {
      const result = selectUtxos(accountUtxos, {
        addressOrder: ['nativeSegwit', 'nestedSegwit', 'taproot', 'legacy'],
        utxoSortGreatestToLeast: true,
        changeAddress: 'nativeSegwit',
      })

      // Native SegWit
      expect(result[0].address).toMatch(/bcrt1q/)
      expect(result[1].address).toMatch(/bcrt1q/)
      expect(result[0].satoshis).toBeGreaterThan(result[1].satoshis)

      // Nested Segwit
      expect(result[2].address).toMatch(/2N/)
      expect(result[3].address).toMatch(/2N/)
      expect(result[2].satoshis).toBeGreaterThan(result[3].satoshis)

      // Taproot
      expect(result[4].address).toMatch(/bcrt1p/)
      expect(result[5].address).toMatch(/bcrt1p/)
      expect(result[4].satoshis).toBeGreaterThan(result[5].satoshis)

      // Legacy
      expect(result[6].address).toMatch(/m/)
      expect(result[7].address).toMatch(/m/)
      expect(result[6].satoshis).toBeGreaterThan(result[7].satoshis)
    })

    it('returns the right utxos when sorting from least to greatest', async () => {
      const result = selectUtxos(accountUtxos, {
        addressOrder: ['nativeSegwit', 'nestedSegwit', 'taproot', 'legacy'],
        utxoSortGreatestToLeast: false,
        changeAddress: 'nativeSegwit',
      })

      // Native SegWit
      expect(result[0].address).toMatch(/bcrt1q/)
      expect(result[1].address).toMatch(/bcrt1q/)
      expect(result[0].satoshis).toBeLessThan(result[1].satoshis)

      // Nested Segwit
      expect(result[2].address).toMatch(/2N/)
      expect(result[3].address).toMatch(/2N/)
      expect(result[2].satoshis).toBeLessThan(result[3].satoshis)

      // Taproot
      expect(result[4].address).toMatch(/bcrt1p/)
      expect(result[5].address).toMatch(/bcrt1p/)
      expect(result[4].satoshis).toBeLessThan(result[5].satoshis)

      // Legacy
      expect(result[6].address).toMatch(/m/)
      expect(result[7].address).toMatch(/m/)
      expect(result[6].satoshis).toBeLessThan(result[7].satoshis)
    })

    it('returns the right utxos for single address', async () => {
      const result = selectUtxos(accountUtxos, {
        addressOrder: ['taproot'],
        utxoSortGreatestToLeast: true,
        changeAddress: 'nativeSegwit',
      })

      // Taproot
      expect(result[0].address).toMatch(/bcrt1p/)
      expect(result[1].address).toMatch(/bcrt1p/)
      expect(result[0].satoshis).toBeGreaterThan(result[1].satoshis)
    })
  })
})
