import { FetchOptions, FetchResult, SimpleAdapter } from '../../adapters/types'
import { CHAIN } from '../../helpers/chains'

const OPINION_EXCHANGE_CONTRACT = '0x5F45344126D6488025B0b84A3A8189F2487a7246'
const OPINION_FEE_MANAGER_CONTRACT = '0xC9063Dc52dEEfb518E5b6634A6b8D624bc5d7c36'
const ORDER_FILLED_EVENT = 'event OrderFilled (bytes32 indexed orderHash,  address indexed maker,address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)'
const REBATE_EARNED_EVENT = 'event RebateEarned (address indexed referrer, address indexed trader, address indexed collateralToken, uint256 amount)'

/**
 * WASH TRADING BLACKLIST
 *
 * Confirmed wash trading wallets identified through on-chain analysis.
 *
 * Detection criteria:
 * - ≤2 counterparties with >95% concentration
 * - >80% offsetting positions (betting both YES and NO) with significant volume
 * - Part of circular trading clusters
 * - Wash score ≥95 based on offsetting % and counterparty concentration
 *
 * Analysis dates: Jan 14-15, 19, 22, 24, 2026
 * These are Gnosis Safe "funder" addresses used on Opinion Protocol.
 */
const WASH_TRADING_BLACKLIST = new Set(
  [
    // === Original cluster (identified Oct-Nov 2025) ===
    '0xd006482147f77970ef07a91cd84b532433d57400', // $54.7M - Hub wallet
    '0xc23395fc42ba0b79c89f2ab942fcd73deeb355f2', // $21.7M - 85% volume with hub
    '0xb76ba8797850b2cc2aa3ad7299a008573f28cb9d', // $19.0M - 84% volume with hub
    '0x418a3003b9a3e481e2866336fca3007d9474827c', // $10.1M - 99% volume with hub
    '0x6c3326f52f5a251b5504099242a9cdbcc3ab87e7', // $9.4M - 99% volume with hub

    // === New confirmed wash traders (Jan 2026 analysis) ===
    // High volume wash traders ($5M+)
    '0x72ffa4098788ab41c78da0ed04b4a3eaa4ff9e3d', // $30.2M - 100% offsetting, score 100
    '0x0a7300dbc3fcef290601793bf4395ea0fd38f35c', // $18.7M - 100% offsetting, score 100
    '0x44df52c5c8ffb86da6044b81577f0dd537dec07f', // $5.0M - only 2 CPs, 100% concentration
    '0x015e2b259233ac5c805b14703ef2144dedfc8b01', // $5.0M - only 2 CPs, 82% concentration

    // Medium-high volume wash traders ($1M-$5M)
    '0xfe5d02c0dcb5f7ee642713628be52e6f4de9f08e', // $4.1M - 100% offsetting, score 100
    '0xe9209e46699190d99215f1697381ce637925cac3', // $4.0M - 100% offsetting, only 1-7 CPs
    '0xb850edbc7dc207f7fe6aecb9be06e0e4d7bc69ac', // $4.0M - 100% offsetting, only 1-2 CPs
    '0x0f61a1f7717b51fd13cc76de9092e5209808b91c', // $3.2M - 99% offsetting
    '0x608601662152b9c37708b610a4be5d1a15567e78', // $3.1M - score 100
    '0xf4852d5bc219c31386e36a836d82439f61160c82', // $3.1M - score 100
    '0x0dcb08000fb624bb64aca0015cbd9b2307dc46fd', // $2.1M - score 100
    '0xc2823f06eb7536f23c4ff9be799058a204ce4add', // $2.1M - score 100
    '0x686fa7c3b7ca92d98a00f58b46066c51d802dafb', // $1.7M - score 100
    '0x0a9e71ecece618a920a883a0858d9d983810758d', // $1.6M - 98% offsetting, only 2 CPs
    '0xd7c2d443a4fde099f9423b5962270bbe333c9558', // $1.6M - 100% offsetting, only 2 CPs
    '0x127ff13f0b5b1070a36fa30b083b4644016ad30f', // $1.6M - score 40 but only 1 CP
    '0xec78b801a379daf065b2e946e8aa352a70511153', // $1.4M - only 1 CP, 100% concentration
    '0x0b8bb27fd7dac838df100f8270b3c35dd270360c', // $1.4M - only 1 CP, 100% concentration
    '0xe225ea7da5d13deacd308c37b7e2d3c5c87e44db', // $1.2M - 99% offsetting
    '0xf9085026722167af624c82f4a51190212f1358ec', // $1.1M - score 100
    '0xc1d70151b25b8831d38bc0b2c5717e6d7079e522', // $1.0M - only 2 CPs, 100% concentration
    '0xfa679b1ec37f5c61711a540a25e43153b1dfda57', // $1.0M - 94% offsetting, score 97
    '0x6fcc720d5538d848117469ee17011eb25ba3373d', // $1.0M - 97% offsetting, score 98

    // Confirmed wash traders ($500k-$1M) - high scores
    '0x61ea344369771d640f59edc4efcb8f3f238f0078', // $0.9M - 98% offsetting, score 90
    '0x4a795fb374433d1eea1bc764f3d6a77ac5871905', // $0.9M - score 99
    '0x3af3ad6fec61dab75793f48d5bfd543531dd4432', // $0.9M - score 99
    '0x3b67464f4047282f7c97105d90809e9239ac0cd1', // $0.8M - 100% offsetting, only 2 CPs
    '0x6d894e0752d293de5302f15b138a731b38fce28b', // $0.8M - score 100
    '0xf44c8da59212980c1e51ebdf63e45c34809c94b1', // $0.8M - score 100
    '0x9d8ca07ab45a196209105e202cc9b2eec81abfc0', // $0.8M - 99% offsetting, score 100
    '0x3350869a9ae8943306fb8ef621ef21a0b2541601', // $0.8M - 99% offsetting, score 100
    '0xca6f569a370526287510f3980d40ceea007ebea2', // $0.6M - score 100
    '0xa4d4bdbc8a428ae4908df535d7995d68d40d879b', // $0.6M - 99% offsetting, score 100
    '0xc4463cd7f6fb920b247d6e02181c2538891ca506', // $0.6M - 99% offsetting, score 99
    '0x90db6a062fd2033cf4324727f40d8954c0a5c85d', // $0.6M - 100% offsetting, score 100
    '0xb7867df722f568b318781e6c8b9864580144206f', // $0.5M - 99% offsetting, score 100
    '0x2f40552c4ea7fc24768126e7b29a40f72d149ce6', // $0.5M - 99% offsetting, score 100
    '0xa2d935aec3da511ccd0cd9e4e0ce180dcf1fcd48', // $0.5M - 99% offsetting, score 100
    '0x7c22b543a46dabd507f30ff0cebf4aba6ff56dc7', // $0.5M - 99% offsetting, score 100
    '0x9a6d5a61bf067eda66f598aa924dedd37c0e48c9', // $0.5M - 99% offsetting, score 100
    '0xd153be034b84d3abccdae1f92ad8ec0acf6f16bf', // $0.5M - 99% offsetting, score 100
    '0x5394d945696b2b40c3be84c659f2e25e53d783b9', // $0.5M - 100% offsetting, score 100
    '0xbb2580c56418e15b62ffe6b509b4b20cb4c46cde', // $0.5M - 100% offsetting, score 100
    '0x6d8faa933fb1d14a491bbd477085817165b261a2', // $0.5M - 100% offsetting
  ].map((addr) => addr.toLowerCase())
)

// fees = trade fees - rebate fees
async function fetch(options: FetchOptions): Promise<FetchResult> {
  const dailyVolume = options.createBalances()
  const tradeFees = options.createBalances()
  const rebateFees = options.createBalances()

  const orderFilledLogs = await options.getLogs({
    eventAbi: ORDER_FILLED_EVENT,
    target: OPINION_EXCHANGE_CONTRACT,
  })
  
  const rebateEarnedLogs = await options.getLogs({
    eventAbi: REBATE_EARNED_EVENT,
    target: OPINION_FEE_MANAGER_CONTRACT,
  })

  orderFilledLogs.forEach((order: any) => {
    tradeFees.addUSDValue(Number(order.fee) / 1e18)

    const maker = (order.maker || '').toString().toLowerCase()
    const taker = (order.taker || '').toString().toLowerCase()

    if (WASH_TRADING_BLACKLIST.has(maker) || WASH_TRADING_BLACKLIST.has(taker)) {
      return
    }

    const tradeVolume = Number(order.makerAssetId == 0 ? order.makerAmountFilled : order.takerAmountFilled) / 1e18
    dailyVolume.addUSDValue(Number(tradeVolume) / 2)
  })

  rebateEarnedLogs.forEach((log: any) => {
    rebateFees.addUSDValue(Number(log.amount) / 1e18)
  })
  
  
  const dailyFees = tradeFees.clone(1)
  dailyFees.subtract(rebateFees)

  return {
    dailyVolume,
    dailyFees,
    dailyRevenue: dailyFees,
    dailyProtocolRevenue: dailyFees,
  }
}

const methodology = {
  Volume: 'Opinion prediction market trading volume, excluding identified wash trading wallets',
  Fees: 'Taker fees collected by opinion minus rebate earned to traders.',
  Revenue: 'All the fees are revenue',
  ProtocolRevenue: 'All the revenue goes to protocol',
}

const adapter: SimpleAdapter = {
  version: 2,
  fetch,
  methodology,
  chains: [CHAIN.BSC],
  start: '2025-10-22',
}

export default adapter
