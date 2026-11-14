## ADDED Requirements

### Requirement: Daily Fortune Lot

The dashboard SHALL present the day's investment outlook as a fortune lot (籤) with a grade, a four-line verse and a plain-language reading instead of a numeric score.

#### Scenario: Lot grade follows the investment score

- **WHEN** the integrated fortune is loaded for a user with a complete profile
- **THEN** the lot grade SHALL be derived from the investment score (上吉 ≥ 80, 中吉 ≥ 65, 小吉 ≥ 50, 平 ≥ 35, otherwise 小凶)
- **AND** the same user on the same date SHALL draw the same lot number

#### Scenario: Re-shaking the lot

- **WHEN** the user presses 「再搖一次」
- **THEN** the verse SHALL change within the same grade
- **AND** the grade and reading SHALL NOT change

### Requirement: Twelve-Hour Omen Wheel

The dashboard SHALL show the twelve double-hours (時辰) with good, neutral or bad omens and highlight the Taiwan stock trading session (09:00–13:30).

#### Scenario: Omen rules

- **WHEN** the wheel is built for a zodiac and a day branch
- **THEN** an hour clashing with the day branch or in the zodiac's avoid list SHALL be bad
- **AND** an hour in the zodiac's 三合 list SHALL be good
- **AND** all other hours SHALL be neutral

#### Scenario: Market closed today

- **WHEN** today is not a trading day
- **THEN** the wheel SHALL use the next trading day's day branch and say so in its title

### Requirement: Theme-Aware Design Tokens

All UI colors SHALL come from semantic tokens that switch between light and dark themes without per-component theme conditionals.

#### Scenario: Price change colors

- **WHEN** a price change is displayed
- **THEN** a rise SHALL use the rise (red) token and a fall SHALL use the fall (green) token, following Taiwan market convention
