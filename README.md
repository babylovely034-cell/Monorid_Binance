# Monorid — Institutional Binance Futures Trading Terminal

<p align="center">
  <img src="public/monorid-brand-logo.png" alt="Monorid Logo" width="140" height="140" style="border-radius: 28px;" />
</p>

<p align="center">
  <strong>Autonomous Multi-Agent Quantitative Trading Terminal for Binance USDT-M Perpetual Futures</strong><br />
  <em>Proprietary Dual-Engine Execution System developed by <strong>Trading Lifestyle Quant</strong></em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Binance-USDT--M_Futures-F0B90B?style=for-the-badge&logo=binance&logoColor=black" alt="Binance Futures" />
  <img src="https://img.shields.io/badge/Timeframe-5_Minutes-00F5FF?style=for-the-badge" alt="5m Timeframe" />
  <img src="https://img.shields.io/badge/Tests-17%2F17_Passing-00E676?style=for-the-badge" alt="Unit Tests" />
  <img src="https://img.shields.io/badge/Proprietary-Trading_Lifestyle_Quant-F59E0B?style=for-the-badge" alt="Trading Lifestyle Quant" />
</p>

---

## 1. Executive Summary

**Monorid** is an institutional-grade, high-performance algorithmic trading terminal engineered specifically for **Binance USDT-M Perpetual Futures**. Built to eliminate human emotional bias, execution latency, and paper-trading discrepancies, Monorid executes live trades on the **5-minute timeframe** backed by rigorous mathematical verification and automated risk governance.

Operating with a distributed **10-bot multi-agent swarm radar**, Monorid monitors 160+ active futures pairs across key digital asset sectors in real time. Trade execution is governed by a **strict dual-engine confirmation framework** developed by **Trading Lifestyle Quant**: trades are only dispatched when the primary trend engine and the secondary multi-factor momentum confirmation oscillator reach unanimous agreement.

---

## 2. System Architecture & Swarm Radar

### Equidistant Multi-Agent Fleet
At the center of Monorid sits the core neural dispatcher, surrounded in an exact radial coordinate plane by **10 autonomous category bots**. Each bot continuously streams live candle history, tracks 24-hour liquidity and volatility, and evaluates quantitative signals:

```
                          [ 01: Layer 1 / Layer 2 ]
                                      |
         [ 10: Privacy ]              |              [ 02: DeFi ]
                 \                    |                    /
                  \                   |                   /
    [ 09: Payment ]\       +--------------------+        /[ 03: AI ]
                    \      |                    |       /
                     +---->|   MONORID CORE     |<----+
                    /      |  NEURAL DISPATCHER |      \
    [ 08: RWA ]    /       +--------------------+       \  [ 04: Memecoins ]
                  /                   |                  \
                 /                    |                   \
         [ 07: Infra ]                |              [ 05: Gaming ]
                                      |
                           [ 06: Storage ]
```

### The 10 Specialized Category Fleets
1. **L1/L2 Fleet**: High-throughput layer 1 protocols and layer 2 scaling rollups (`BTC`, `ETH`, `SOL`, `BNB`, `AVAX`, `MATIC`, `ARB`, `OP`, etc.).
2. **DeFi Fleet**: Decentralized lending, automated market makers, and liquidity layers (`UNI`, `AAVE`, `MKR`, `SNX`, `CRV`, `LDO`, etc.).
3. **AI Fleet**: Decentralized compute, intelligence networks, and synthetic data tokens (`NEAR`, `RENDER`, `TAO`, `FET`, `OCEAN`, etc.).
4. **Meme Fleet**: High-beta momentum and algorithmic sentiment drivers (`DOGE`, `SHIB`, `PEPE`, `FLOKI`, `BONK`, `WIF`, etc.).
5. **Gaming & Metaverse Fleet**: Interactive entertainment, game economies, and virtual land assets (`GALA`, `AXS`, `SAND`, `MANA`, `BEAM`, etc.).
6. **Storage Fleet**: Decentralized persistent storage networks and data availability layers (`FIL`, `AR`, `STORJ`, etc.).
7. **Infrastructure & Oracles**: Oracle consensus networks and decentralized web primitives (`LINK`, `PYTH`, `GRT`, `TIA`, etc.).
8. **Real-World Assets (RWA)**: Tokenized securities, treasury protocols, and physical asset wrappers (`ONDO`, `PENDLE`, `CFG`, etc.).
9. **Payment Fleet**: Borderless transactional currencies and merchant settlement networks (`XRP`, `LTC`, `BCH`, `XLM`, etc.).
10. **Privacy Fleet**: Zero-knowledge proof protocols and confidential compute layers (`XMR`, `ZEC`, `ROSE`, etc.).

---

## 3. Proprietary Dual-Engine Quantitative Strategy

Monorid enforces the quantitative principle: **"No confirmation, no trade."** A signal from a single technical indicator is inherently noisy; Monorid requires simultaneous validation from two orthogonal mathematical disciplines:

```
+------------------------------------+        +------------------------------------+
|          ENGINE 1: TREND           |        |       ENGINE 2: CONFIRMATION       |
|    Dynamic Trailing Stop Filter    |        |   Composite Momentum & Volatility  |
|                                    |        |                                    |
| • Exponential Moving Average (EMA) |        | • Average Directional Index (ADX)  |
| • Average True Range (ATR) Band    |        | • Stochastic Relative Strength     |
| • Dynamic Pivot Reversal System    |        | • On-Balance Volume (OBV) Flow     |
| • Primary Directional Bias         |        | • Hull Moving Average (HMA) Slope  |
+-----------------+------------------+        +-----------------+------------------+
                  |                                             |
                  +----------------------+----------------------+
                                         |
                                         v
                         +-------------------------------+
                         |   STRICT DUAL CONVERGENCE     |
                         |                               |
                         |   Trend Bias == Confirmation? |
                         +---------------+---------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                     [YES]                               [NO]
                       |                                   |
                       v                                   v
          +-------------------------+         +-------------------------+
          |  DISPATCH LIVE BINANCE  |         |      REJECT SIGNAL      |
          |  FUTURES ORDER & RISK   |         |      Capital Preserved  |
          +-------------------------+         +-------------------------+
```

### Engine 1: Dynamic Trend & Trailing Stop Filter
- **Objective**: Identify macroscopic trend direction and dynamic support/resistance trailing bands.
- **Formulation**: Utilizes an adaptive Exponential Moving Average (`EMA(10)`) mapped over median prices (`(High + Low) / 2`), enveloped by dynamic volatility bands calculated via the Average True Range (`ATR(10)` with a $3.0\times$ multiplier).
- **Behavior**: Trailing stop levels ratchet upwards during long positions and downwards during short positions, flipping direction only when median price crosses the dynamic stop band.

### Engine 2: Multi-Factor Composite Momentum & Volume Oscillator
- **Objective**: Confirm market participation, directional energy, and volume flow before capital is allocated.
- **Formulation**: Synthesizes 5 independent market dimensions into a single continuous bounded oscillator ($\pm 100$ scale):
  1. *Trend Strength*: 14-period Average Directional Index (`ADX`) with directional indicators ($+DI$ and $-DI$).
  2. *Market Volatility*: Normalized True Range mapped across a 50-period rolling baseline.
  3. *Momentum Vector*: Fast Stochastic RSI ($K=3, D=3, \text{Len}=12$) centered around zero.
  4. *Volume Accumulation*: Normalized On-Balance Volume (`OBV`) delta over 50 bars.
  5. *Trend Smoothing*: 21-period Hull Moving Average (`HMA`) slope to filter out intra-candle chop.
- **Dynamic Thresholding**: Computes rolling 50-bar standard deviation bands ($\pm 25.0 + 0.5 \times \sigma$) to define strong breakouts and zero-line equilibrium filters.

### Execution Convergence Rules
- **LONG Trade Entry**:
  1. Engine 1 indicates a Bullish state (`MAvg > Trailing Stop` or bullish crossover).
  2. Engine 2 composite oscillator confirms positive momentum (`Oscillator > 0` or Strong Buy trigger with $ADX > 20$ and rising $HMA$).
  3. **Result**: Automated Long position dispatched via Binance REST API.
- **SHORT Trade Entry**:
  1. Engine 1 indicates a Bearish state (`MAvg < Trailing Stop` or bearish crossunder).
  2. Engine 2 composite oscillator confirms negative momentum (`Oscillator < 0` or Strong Sell trigger with $ADX > 20$ and falling $HMA$).
  3. **Result**: Automated Short position dispatched via Binance REST API.
- **Contradiction State**:
  - If Engine 1 is Bullish but Engine 2 is negative, or Engine 1 is Bearish but Engine 2 is positive: **NO TRADE**. Signal is rejected and capital remains protected in cash reserve.

---

## 4. Institutional Risk Governance & Capital Allocation

Monorid operates under institutional capital protection protocols:

| Parameter | Specification | Function & Rationale |
|:---|:---|:---|
| **Stop Loss (SL)** | Dynamic Swing Pivots | Calibrated to the lowest low (longs) or highest high (shorts) over the preceding 5 bars with buffer. |
| **Take Profit (TP)** | Exact 1:2 Risk/Reward | Enforces mathematical expectancy: $TP = Entry \pm (2.0 \times |Entry - SL|)$. |
| **Position Sizing** | 10% Dynamic Allocation | Each position is strictly allocated 10% of total available USDT margin balance. |
| **Reserve Buffer** | $1.20 Minimum Shield | Prevents account depletion and shields against platform fee deductions and maintenance margin calls. |
| **Dynamic Leverage** | 10x to 15x Adaptive | Conviction scoring: 15x for Strong Buy/Sell agreement; 10x for standard dual confirmation. |
| **Liquidation Shield** | Pre-Flight Validation | Pre-computes estimated liquidation price and validates that $SL$ is placed safely before liquidation can occur. |
| **Precision Lotting** | Binance Filter Adherence | Enforces exchange `stepSize` and `tickSize` rounding, eliminating API rejections (`-1111` / `-1013`). |

---

## 5. Technology Stack & Directory Structure

- **Framework**: Next.js 15 (React 19, App Router)
- **Language**: TypeScript 5 (Strict Mode enabled)
- **Styling & UI**: Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti
- **Exchange Gateway**: Direct Binance USDT-M Futures REST & WebSocket APIs (`/fapi/v1`, `/fapi/v2`)
- **Cryptography**: Node.js native `crypto` (HMAC-SHA256 signature generation)
- **Testing**: Node.js native test runner + TSX (17 automated unit tests)

```
Monorid_Binance/
├── app/
│   ├── api/
│   │   ├── binance/
│   │   │   ├── account/route.ts      # Live balance, margin & position synchronization
│   │   │   ├── close/route.ts        # Manual and automated market position close
│   │   │   ├── history/route.ts      # Realized PnL and trade execution history
│   │   │   ├── klines/route.ts       # 5-minute historical candlestick feed
│   │   │   ├── order/route.ts        # Live order placement with TP/SL bracket dispatch
│   │   │   ├── test/route.ts         # Binance API credential validation endpoint
│   │   │   └── tickers/route.ts      # 24-hour ticker volume and price statistics
│   │   └── ip/route.ts               # Outbound public IPv4 detector for API whitelisting
│   ├── globals.css                   # High-contrast cybernetic styling
│   ├── layout.tsx                    # Root layout with institutional metadata
│   └── page.tsx                      # Primary orchestrator and real-time scanning loop
├── components/
│   ├── AssetInspectModal.tsx         # Deep-dive quantitative audit modal
│   ├── BotMotionIcons.tsx            # 10 custom cybernetic SVG motion avatars
│   ├── DashboardMain.tsx             # Equidistant radar dashboard & bot orbital system
│   ├── MarketScannerView.tsx         # Multi-category asset table & real-time scanner
│   ├── MiroStyleLogo.tsx             # Animated neon electric squircle brand badge
│   ├── Navbar.tsx                    # Global header with status indicators & quick actions
│   ├── PositionsOrdersView.tsx       # Live open positions, PnL tracking & manual close
│   ├── SettingsView.tsx              # API key configuration, IP copy & risk settings
│   └── TradingHistoryView.tsx        # Historical trade log and performance telemetry
├── lib/
│   ├── binanceClient.ts              # Production Binance Futures client (HMAC-SHA256)
│   ├── binanceWs.ts                  # Real-time WebSocket multiplexer
│   ├── indicators.ts                 # Dual-engine quantitative mathematical models
│   ├── indicators.test.ts            # Automated unit test suite (17 test specs)
│   ├── scannerData.ts                # Sector definitions & token categorizations
│   └── types.ts                      # Universal TypeScript data interfaces
├── public/                           # Static brand assets and icon files
├── package.json                      # Dependency manifests & NPM scripts
├── tsconfig.json                     # Strict TypeScript compiler options
└── README.md                         # Monorid documentation
```

---

## 6. Installation & Configuration

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **Binance Account**: Futures USDT-M trading enabled
- **API Key & Secret**: Generated from Binance API Management with **Futures Trading** permissions enabled

### 1. Clone the Repository
```bash
git clone https://github.com/badalworld/Monorid_Binance.git
cd Monorid_Binance
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Credentials
Create a `.env.local` file in the project root (or input your credentials directly via the **Settings** view in the UI):

```env
# Binance USDT-M Futures API Credentials
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_api_secret_here

# Optional: Port configuration (default: 3000)
PORT=3000
```

> **Security Best Practice**: For production security, enable **IP Access Restriction** on your Binance API Key and add your server's outbound IPv4 address. Monorid provides a one-click IP copy pill in the top navigation bar.

---

## 7. Running the Terminal

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Automated Unit Test Suite
Verify mathematical calculations, risk formulas, fee models, and signal logic:
```bash
npm test
```
*Output: 17/17 tests passing with zero failures.*

### Production Build & Launch
Compile optimized production bundles:
```bash
npm run build
npm start
```

---

## 8. Aiven Runtime Cloud Deployment

Deploy Monorid directly to **Aiven Runtime** with zero configuration conflicts:

1. **Connect GitHub Repository**: In the Aiven Console project, navigate to **Runtime** > **Deploy application** and select your connected GitHub repository and branch.
2. **Select Manifest**: On the **Deploy from GitHub — Select manifest** screen:
   - Recommended: Select **`compose.aiven.yaml`** (canonical Aiven Compose manifest).
   - Alternatively: You can also select **`compose.yaml`** or **`Dockerfile`**. All three manifests are strictly deduplicated and validated against Aiven's schema.
3. **Configure Environment Variables**:
   In the Aiven Console environment variables editor, configure:
   - `BINANCE_API_KEY`: Your Binance USDT-M API Key (toggle **Secret** on).
   - `BINANCE_API_SECRET`: Your Binance USDT-M API Secret (toggle **Secret** on).
   - `GEMINI_API_KEY`: *(Optional)* Gemini AI key for quantitative swarm intelligence.
   - `PORT`: `3000` (auto-mapped to Aiven's public HTTPS 443 reverse proxy).
   - `NODE_ENV`: `production`.
4. **Deploy Application**: Click **Deploy**. Aiven Runtime builds the optimized Next.js standalone production image, starts the container on `0.0.0.0:3000`, and provisions the public HTTPS endpoint.

---

## 9. Verification & Performance Checklist

- [x] **Zero Paper/Simulation Mock Data**: 100% connected to live Binance Futures endpoints.
- [x] **Hedge & One-Way Mode Compatibility**: Automatically queries and adapts to user account position mode.
- [x] **Strict Mathematical Agreement**: Signal is rejected unless both the trend engine and confirmation oscillator confirm the direction.
- [x] **Dynamic Swing Levels**: Stop loss and Take Profit orders dynamically adapt to local market structure.
- [x] **Institutional Safety Buffer**: Safeguards account margin with an immutable $1.20 reserve cushion.
- [x] **Sub-Second Execution**: Order requests are signed with HMAC-SHA256 and dispatched directly to Binance servers.

---

## 10. License & Legal Disclaimer

**Proprietary Software — All Rights Reserved.**  
Copyright &copy; 2026 **Trading Lifestyle Quant**. Developed for exclusive use by the Monorid App.

> **Disclaimer**: Cryptocurrency futures trading carries substantial risk of loss and is not suitable for all investors. Leveraged trading can amplify both gains and losses. The Monorid algorithmic terminal is a quantitative automation tool designed to execute user-defined parameters; past mathematical performance does not guarantee future financial results. Always manage risk responsibly.
