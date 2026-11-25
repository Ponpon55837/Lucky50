## ADDED Requirements

### Requirement: Verified price history

The application SHALL use verified 0050 prices for investment analytics and identify the source, acquisition time and latest trade date.

#### Scenario: The service is unavailable

- **WHEN** fetching a selected interval fails
- **THEN** only an applicable verified cache may supply prices and the view SHALL label that cache with its dates
- **AND** without applicable data, the view SHALL show that performance is unavailable

#### Scenario: A corporate action contradicts the raw prices

- **WHEN** the event's reported prior close disagrees with a verifiable preceding trade beyond the price tolerance
- **THEN** the affected adjusted performance SHALL be withheld and the conflict explained

### Requirement: Opening-price execution

The backtest SHALL apply signals at the day's open, attribute overnight changes to the preceding holdings, and compare strategies over the same valuation interval.

#### Scenario: An entry following an overnight gap

- **WHEN** an uninvested strategy buys at an opening price equal to the day's close
- **THEN** its gross intraday return SHALL be zero irrespective of the previous close
- **AND** net results SHALL reflect the stated costs for executed orders

### Requirement: Readable market and engine charts

Each chart SHALL provide a name and keyboard-accessible data corresponding to the displayed series.

#### Scenario: A user changes the range

- **WHEN** a different market interval is selected
- **THEN** chart data and its accessible dates, values and units SHALL reflect that interval
