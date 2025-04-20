import * as bitcoin from 'bitcoinjs-lib'
import { Account, mnemonicToAccount } from '../account/account'
import { Provider } from '../provider/provider'
import { swapPsbt, addLiquidityPsbt, removeLiquidityPsbt } from './pool'
import { AlkaneId } from '../shared/interface'
import { FormattedUtxo } from '../utxo/utxo'
import { findAlkaneUtxos } from '../alkanes'
import { AlkanesRpc } from '../rpclient/alkanes'
import { EsploraRpc } from '../rpclient/esplora'
import { AlkanesAMMPoolDecoder, previewRemoveLiquidity } from './pool'
import {
  PoolDetailsResult,
  PoolOpcodes,
  estimateRemoveLiquidityAmounts,
  swapBuyAmount,
} from './utils'

// Test setup
const provider = new Provider({
  url: '',
  projectId: '',
  network: bitcoin.networks.regtest,
  networkType: 'mainnet',
})

const account: Account = mnemonicToAccount({
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  opts: { index: 0, network: bitcoin.networks.regtest },
})

// Mock data
const mockToken0: AlkaneId = {
  block: '123',
  tx: '456',
}

const mockToken1: AlkaneId = {
  block: '789',
  tx: '012',
}

const mockGatheredUtxos = {
  utxos: [
    {
      txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
      outputIndex: 0,
      satoshis: 100000,
      confirmations: 3,
      scriptPk: account.taproot.pubkey,
      address: account.taproot.address,
      inscriptions: [],
    },
  ] as FormattedUtxo[],
  totalAmount: 100000,
}

// Mock the external modules
jest.mock('../alkanes', () => ({
  findAlkaneUtxos: jest
    .fn()
    .mockImplementation(
      async ({ targetNumberOfAlkanes, alkaneId, provider, address }) => {
        if (targetNumberOfAlkanes === 0) {
          throw new Error('Cannot process zero tokens')
        }

        const res = await provider.alkanes.getAlkanesByAddress({
          address,
          protocolTag: '1',
        })

        const matchingRunesWithOutpoints = res.flatMap((outpoint) =>
          outpoint.runes
            .filter(
              (value) =>
                Number(value.rune.id.block) === Number(alkaneId.block) &&
                Number(value.rune.id.tx) === Number(alkaneId.tx)
            )
            .map((rune) => ({ rune, outpoint }))
        )

        const alkaneUtxos = matchingRunesWithOutpoints.map((alkane) => ({
          txId: alkane.outpoint.outpoint.txid,
          txIndex: alkane.outpoint.outpoint.vout,
          script: alkane.outpoint.output.script,
          address,
          amountOfAlkanes: alkane.rune.balance,
          satoshis: Number(alkane.outpoint.output.value),
          ...alkane.rune.rune,
        }))

        return {
          alkaneUtxos,
          totalSatoshis: alkaneUtxos.reduce(
            (acc, utxo) => acc + utxo.satoshis,
            0
          ),
        }
      }
    ),
  executePsbt: jest.fn().mockImplementation(async (options) => {
    if (
      !options.alkaneUtxos?.alkaneUtxos?.length ||
      !options.gatheredUtxos?.utxos?.length
    ) {
      throw new Error('Insufficient UTXOs')
    }
    return {
      psbt: new bitcoin.Psbt(),
      fee: 1000,
    }
  }),
  createExecutePsbt: jest.fn().mockImplementation(async (options) => ({
    psbt: new bitcoin.Psbt(),
    psbtHex: 'mock_psbt_hex',
  })),
}))
jest.mock('../rpclient/alkanes')
jest.mock('../rpclient/esplora')

describe('AMM Pool PSBT Tests', () => {
  const mockProvider = {
    ...provider,
    alkanes: {
      ...provider.alkanes,
      getAlkanesByAddress: jest.fn().mockResolvedValue([
        {
          runes: [
            {
              rune: {
                id: {
                  block: '123',
                  tx: '456',
                },
                name: 'TestRune',
                spacedName: 'TestRune',
                divisibility: 1,
                spacers: 0,
                symbol: 'TR',
              },
              balance: '1000',
            },
          ],
          outpoint: {
            txid: '1234',
            vout: 0,
          },
          output: {
            value: '1000',
            script: 'mock_script',
          },
          height: 123,
          txindex: 456,
        },
        {
          runes: [
            {
              rune: {
                id: {
                  block: '789',
                  tx: '012',
                },
                name: 'TestRune2',
                spacedName: 'TestRune2',
                divisibility: 1,
                spacers: 0,
                symbol: 'TR2',
              },
              balance: '2000',
            },
          ],
          outpoint: {
            txid: '5678',
            vout: 1,
          },
          output: {
            value: '2000',
            script: 'mock_script_2',
          },
          height: 789,
          txindex: 12,
        },
      ]),
    },
    esplora: {
      ...provider.esplora,
      getTxHex: jest.fn().mockResolvedValue('mock_tx_hex'),
      getFeeEstimates: jest.fn().mockResolvedValue({ '1': 1 }),
    } as any,
    pushPsbt: jest.fn().mockResolvedValue({ txid: 'mock_txid' }),
    getAddressUtxos: jest.fn().mockResolvedValue([
      {
        txid: '1234',
        vout: 0,
        value: 1000,
        script: 'mock_script',
        address: 'bc1qtest',
      },
    ]),
    getTransaction: jest.fn().mockResolvedValue({
      txid: '1234',
      hex: 'mock_tx_hex',
    }),
  } as any

  // Setup mock data
  const mockAlkaneUtxos = {
    alkaneUtxos: [
      {
        txid: '1234',
        vout: 0,
        value: 1000,
        // ... other required UTXO fields
      },
    ],
    totalSatoshis: 1000,
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Mock findAlkaneUtxos to return test data
    ;(findAlkaneUtxos as jest.Mock).mockResolvedValue(mockAlkaneUtxos)
  })

  describe('swapPsbt', () => {
    it('should create a valid swap PSBT without frontend fee', async () => {
      const result = await swapPsbt({
        calldata: [1n],
        token: { block: '1', tx: '1' },
        tokenAmount: 1000n,
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 1,
        account,
        provider: mockProvider,
      })

      expect(findAlkaneUtxos).toHaveBeenCalled()
      expect(result).toHaveProperty('psbt')
    })

    it('should create a valid swap PSBT with frontend fee', async () => {
      const result = await swapPsbt({
        calldata: [1n, 2n, 3n],
        token: mockToken0,
        tokenAmount: 1000n,
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 10,
        account,
        provider,
        frontendFee: 1000,
        feeAddress:
          'bc1p0000000000000000000000000000000000000000000000000000000000000000',
      })

      expect(result.psbt).toBeDefined()
    })

    it('should handle zero token amount', async () => {
      await expect(
        swapPsbt({
          calldata: [1n, 2n, 3n],
          token: mockToken0,
          tokenAmount: 0n,
          gatheredUtxos: mockGatheredUtxos,
          feeRate: 10,
          account,
          provider,
        })
      ).rejects.toThrow('Cannot process zero tokens')
    })
  })

  describe('addLiquidityPsbt', () => {
    it('should create a valid add liquidity PSBT', async () => {
      const result = await addLiquidityPsbt({
        calldata: [1n, 2n, 3n],
        token0: mockToken0,
        token0Amount: 1000n,
        token1: mockToken1,
        token1Amount: 2000n,
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 10,
        account,
        provider,
      })

      expect(result.psbt).toBeDefined()
      expect(result.fee).toBeDefined()
    })

    it('should handle zero amounts', async () => {
      await expect(
        addLiquidityPsbt({
          calldata: [1n, 2n, 3n],
          token0: mockToken0,
          token0Amount: 0n,
          token1: mockToken1,
          token1Amount: 0n,
          gatheredUtxos: mockGatheredUtxos,
          feeRate: 10,
          account,
          provider,
        })
      ).rejects.toThrow()
    })

    it('should handle insufficient UTXOs', async () => {
      const insufficientUtxos = {
        utxos: [] as FormattedUtxo[],
        totalAmount: 0,
      }

      await expect(
        addLiquidityPsbt({
          calldata: [1n, 2n, 3n],
          token0: mockToken0,
          token0Amount: 1000n,
          token1: mockToken1,
          token1Amount: 2000n,
          gatheredUtxos: insufficientUtxos,
          feeRate: 10,
          account,
          provider,
        })
      ).rejects.toThrow()
    })
  })

  describe('removeLiquidityPsbt', () => {
    it('should create a valid remove liquidity PSBT', async () => {
      const result = await removeLiquidityPsbt({
        calldata: [1n, 2n, 3n],
        token: mockToken0,
        tokenAmount: 1000n,
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 10,
        account,
        provider,
      })

      expect(result.psbt).toBeDefined()
    })

    it('should handle zero token amount', async () => {
      await expect(
        removeLiquidityPsbt({
          calldata: [1n, 2n, 3n],
          token: mockToken0,
          tokenAmount: 0n,
          gatheredUtxos: mockGatheredUtxos,
          feeRate: 10,
          account,
          provider,
        })
      ).rejects.toThrow('Cannot process zero tokens')
    })

    it('should handle insufficient UTXOs', async () => {
      const insufficientUtxos = {
        utxos: [] as FormattedUtxo[],
        totalAmount: 0,
      }

      await expect(
        removeLiquidityPsbt({
          calldata: [1n, 2n, 3n],
          token: mockToken0,
          tokenAmount: 1000n,
          gatheredUtxos: insufficientUtxos,
          feeRate: 10,
          account,
          provider,
        })
      ).rejects.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large token amounts', async () => {
      const result = await swapPsbt({
        calldata: [1n, 2n, 3n],
        token: mockToken0,
        tokenAmount: BigInt(Number.MAX_SAFE_INTEGER),
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 10,
        account,
        provider,
      })

      expect(result.psbt).toBeDefined()
    })

    it('should handle high fee rates', async () => {
      const result = await swapPsbt({
        calldata: [1n, 2n, 3n],
        token: mockToken0,
        tokenAmount: 1000n,
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 1000,
        account,
        provider,
      })

      expect(result.psbt).toBeDefined()
    })

    it('should handle empty calldata', async () => {
      const result = await swapPsbt({
        calldata: [],
        token: mockToken0,
        tokenAmount: 1000n,
        gatheredUtxos: mockGatheredUtxos,
        feeRate: 10,
        account,
        provider,
      })

      expect(result.psbt).toBeDefined()
    })
  })
})

describe('estimateRemoveLiquidityAmounts', () => {
  it('should correctly calculate token amounts based on proportion of liquidity', () => {
    const poolDetails: PoolDetailsResult = {
      token0: { block: '100', tx: '1' } as AlkaneId,
      token1: { block: '200', tx: '2' } as AlkaneId,
      token0Amount: '1000',
      token1Amount: '2000',
      tokenSupply: '500',
      poolName: 'Test Pool',
    }
    const tokenAmount = 100n // 20% of total supply

    const result = estimateRemoveLiquidityAmounts(poolDetails, tokenAmount)

    expect(result.token0).toEqual(poolDetails.token0)
    expect(result.token1).toEqual(poolDetails.token1)
    // 20% of 1000 = 200
    expect(result.token0Amount).toEqual(200n)
    // 20% of 2000 = 400
    expect(result.token1Amount).toEqual(400n)
  })

  it('should handle rounding correctly when calculating proportions', () => {
    const poolDetails: PoolDetailsResult = {
      token0: { block: '100', tx: '1' } as AlkaneId,
      token1: { block: '200', tx: '2' } as AlkaneId,
      token0Amount: '1000',
      token1Amount: '2000',
      tokenSupply: '3000',
      poolName: 'Test Pool',
    }
    const tokenAmount = 1n // A very small proportion that will need rounding

    const result = estimateRemoveLiquidityAmounts(poolDetails, tokenAmount)

    // 1/3000 of 1000 with 10000 as multiplier for precision = 0.33... tokens rounded down
    expect(result.token0Amount).toEqual(0n)
    // 1/3000 of 2000 with 10000 as multiplier for precision = 0.66... tokens rounded down
    expect(result.token1Amount).toEqual(0n)
  })

  it('should handle different token amounts and total supply values', () => {
    const poolDetails: PoolDetailsResult = {
      token0: { block: '100', tx: '1' } as AlkaneId,
      token1: { block: '200', tx: '2' } as AlkaneId,
      token0Amount: '10000000000',
      token1Amount: '5000000000',
      tokenSupply: '100000000',
      poolName: 'Test Pool',
    }
    const tokenAmount = 10000000n // 10% of total supply

    const result = estimateRemoveLiquidityAmounts(poolDetails, tokenAmount)

    // 10% of 10000000000 = 1000000000
    expect(result.token0Amount).toEqual(1000000000n)
    // 10% of 5000000000 = 500000000
    expect(result.token1Amount).toEqual(500000000n)
  })
})

describe('previewRemoveLiquidity', () => {
  // We'll use this to spy on the AlkanesAMMPoolDecoder.decodePoolDetails method
  let decoderSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup spy for AlkanesAMMPoolDecoder.decodePoolDetails
    // We'll implement specific behavior in each test
    decoderSpy = jest.spyOn(
      AlkanesAMMPoolDecoder.prototype,
      'decodePoolDetails'
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should fetch pool details and calculate expected token amounts', async () => {
    // Define test data
    const tokenId = { block: '1', tx: '1' } as AlkaneId
    const tokenAmount = 100n

    // Mock pool details that will be returned by the decoder
    const mockPoolDetails: PoolDetailsResult = {
      token0: { block: '100', tx: '1' } as AlkaneId,
      token1: { block: '200', tx: '2' } as AlkaneId,
      token0Amount: '1000',
      token1Amount: '2000',
      tokenSupply: '500',
      poolName: 'Test Pool',
    }

    const expectedResult = {
      token0: mockPoolDetails.token0,
      token1: mockPoolDetails.token1,
      // For 100 / 500 = 0.2 (20%) of the pool:
      // 20% of 1000 = 200 tokens
      token0Amount: 200n,
      // 20% of 2000 = 400 tokens
      token1Amount: 400n,
    }

    // Configure our provider mock
    const mockSimulate = jest.fn().mockResolvedValue({
      execution: {
        data: 'mocked-pool-details-data',
      },
    })

    const mockProvider = {
      alkanes: {
        simulate: mockSimulate,
      },
    } as unknown as Provider

    // Setup decoder to return our mock pool details
    decoderSpy.mockReturnValue(mockPoolDetails)

    const result = await previewRemoveLiquidity({
      token: tokenId,
      tokenAmount,
      provider: mockProvider,
    })

    // Verify provider.alkanes.simulate was called with correct parameters
    expect(mockSimulate).toHaveBeenCalledWith({
      target: tokenId,
      inputs: [PoolOpcodes.POOL_DETAILS.toString()],
    })

    // Verify decoder was called with the simulation data
    expect(decoderSpy).toHaveBeenCalledWith('mocked-pool-details-data')

    expect(result).toEqual(expectedResult)
  })

  it('should throw an error if pool details cannot be fetched', async () => {
    const token = { block: '100', tx: '1' } as AlkaneId
    const tokenAmount = 100n

    // Setup a mock provider that returns null for pool details
    const mockProvider = {
      alkanes: {
        simulate: jest.fn().mockResolvedValue({
          execution: {
            data: 'invalid-data',
          },
        }),
      },
    } as unknown as Provider

    // Make the decoder return null to simulate failure
    ;(
      AlkanesAMMPoolDecoder.prototype.decodePoolDetails as jest.Mock
    ).mockReturnValue(null)

    await expect(
      previewRemoveLiquidity({ token, tokenAmount, provider: mockProvider })
    ).rejects.toThrow('Failed to get pool details')
  })
})

describe('swapBuyAmount', () => {
  it('should calculate correct buy amount and fee for a normal swap', () => {
    const result = swapBuyAmount({
      sellAmount: 1000n,
      sellTokenReserve: 10000n,
      buyTokenReserve: 20000n,
      feeRate: 5n // 0.5%
    })

    // Expected calculations:
    // sellAmountWithFee = 1000 * (1000 - 5) = 995000
    // numerator = 995000 * 20000 = 19900000000
    // denominator = (10000 * 1000) + 995000 = 10995000
    // buyAmount = 19900000000 / 10995000 ≈ 1809
    // tokenFee = (1000 * 5) / 1000 = 5
    expect(result.buyAmount).toBe(1809n)
    expect(result.sellTokenFeeAmount).toBe(5n)
  })

  it('should handle different fee rates correctly', () => {
    const result = swapBuyAmount({
      sellAmount: 1000n,
      sellTokenReserve: 10000n,
      buyTokenReserve: 20000n,
      feeRate: 10n // 1%
    })

    // Expected calculations:
    // sellAmountWithFee = 1000 * (1000 - 10) = 990000
    // numerator = 990000 * 20000 = 19800000000
    // denominator = (10000 * 1000) + 990000 = 10990000
    // buyAmount = 19800000000 / 10990000 ≈ 1801
    // tokenFee = (1000 * 10) / 1000 = 10
    expect(result.buyAmount).toBe(1801n)
    expect(result.sellTokenFeeAmount).toBe(10n)
  })

  it('should throw error for zero sell amount', () => {
    expect(() => swapBuyAmount({
      sellAmount: 0n,
      sellTokenReserve: 10000n,
      buyTokenReserve: 20000n,
      feeRate: 5n
    })).toThrow('swapBuyAmount: Insufficient sell amount')
  })

  it('should throw error for insufficient liquidity', () => {
    expect(() => swapBuyAmount({
      sellAmount: 1000n,
      sellTokenReserve: 0n,
      buyTokenReserve: 20000n,
      feeRate: 5n
    })).toThrow('swapBuyAmount: Insufficient liquidity')

    expect(() => swapBuyAmount({
      sellAmount: 1000n,
      sellTokenReserve: 10000n,
      buyTokenReserve: 0n,
      feeRate: 5n
    })).toThrow('swapBuyAmount: Insufficient liquidity')
  })

  it('should handle very large numbers correctly', () => {
    const result = swapBuyAmount({
      sellAmount: 1000000000000n,
      sellTokenReserve: 10000000000000n,
      buyTokenReserve: 20000000000000n,
      feeRate: 5n
    })

    // The calculation should still work with large numbers
    expect(result.buyAmount).toBeGreaterThan(0n)
    expect(result.sellTokenFeeAmount).toBe(5000000000n) // (1000000000000 * 5) / 1000
  })
})
