## ADDED Requirements

### Requirement: Technical Indicator Calculation

The system SHALL compute technical indicators as pure functions over daily bars using the parameters customary in Taiwanese brokerage software: KD(9,3,3), MACD(12,26,9), RSI(6,12) with Wilder smoothing, Bollinger Bands(20,2), SAR(0.02,0.2), DMI/ADX(14), BIAS(20,60), Williams %R(14), CCI(20), ATR(14), moving averages 5/10/20/60/120/200 and EMA 12/26.

#### Scenario: Warm-up period

- **WHEN** there are fewer bars than an indicator needs for its first value
- **THEN** that indicator SHALL be null
- **AND** the interface SHALL show "–" instead of a placeholder number

#### Scenario: Flat prices

- **WHEN** every bar has the same price
- **THEN** no indicator SHALL be NaN
- **AND** RSI and KD SHALL be 50

#### Scenario: Agreement with an external source

- **WHEN** the indicators are computed on 0050 daily bars up to 2026-11-13
- **THEN** KD SHALL be K 71.1 and D 52.8
- **AND** MACD SHALL be DIF −2.57, signal −2.55 and histogram −0.02

### Requirement: Fixed Indicator Window

Technical indicators SHALL be computed on a fixed look-back of daily bars long enough for the 200-day average and the one-year return, independent of the analysis period selected on the page.

#### Scenario: Period switch

- **WHEN** the user switches the analysis period
- **THEN** the technical indicator values SHALL NOT change

#### Scenario: Market data unavailable

- **WHEN** real market data cannot be fetched
- **THEN** the indicators SHALL NOT be computed from simulated data
- **AND** the panel SHALL say that market data is unavailable

### Requirement: Adjusted Prices

Prices used for analytics SHALL be back-adjusted for share splits and cash dividends so that the latest price is unchanged and earlier prices are scaled by the ratio of the reference price to the prior close.

#### Scenario: Ex-dividend day

- **WHEN** a bar precedes an ex-dividend date
- **THEN** its prices SHALL be multiplied by the dividend factor and its volume left unchanged

#### Scenario: Split

- **WHEN** a bar precedes a split date
- **THEN** its prices SHALL be multiplied by the split factor and its volume divided by it

#### Scenario: Dividend data unavailable

- **WHEN** the dividend records cannot be fetched
- **THEN** only the known split SHALL be applied
- **AND** the interface SHALL state that dividends are not adjusted

### Requirement: Explained Composite Signal

The composite signal SHALL be the net count of seven trend readings (price vs 20-day average, 20-day vs 60-day average, MACD histogram sign, K vs D, 12-day RSI vs 50, +DI vs −DI when ADX is at least 20, SAR direction), and the interface SHALL list each reading with the values it was based on.

#### Scenario: Threshold

- **WHEN** bullish readings minus bearish readings is at least 3
- **THEN** the signal SHALL be 偏多
- **AND** at most −3 SHALL be 偏空, otherwise 中性

#### Scenario: Not enough readings

- **WHEN** fewer than four readings can be computed
- **THEN** the signal SHALL be 資料不足

### Requirement: Market Holiday Calendar

The trading-day check SHALL use the market closure dates published by the Taiwan Stock Exchange for every year it covers, and SHALL make it explicit when a date falls outside the covered years.

#### Scenario: Settlement-only days

- **WHEN** the exchange lists a day as settlement only with no trading
- **THEN** that day SHALL NOT be a trading day

#### Scenario: Year not covered

- **WHEN** the date is in a year without published closure dates in the calendar
- **THEN** only weekends SHALL be treated as closed
- **AND** the trading status SHALL report that the calendar does not cover that year
