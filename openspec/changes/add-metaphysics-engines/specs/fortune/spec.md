## ADDED Requirements

### Requirement: BaZi Ten Gods Analysis

The system SHALL calculate the Ten Gods (十神) relationships between the day master and other pillars in the birth chart, and map them to investment personality profiles.

#### Scenario: Ten Gods calculation

- **WHEN** user has provided birth date and time
- **THEN** the system SHALL calculate the day master (日主) from the birth date's Heavenly Stem
- **AND** determine the Ten Gods relationship for each of the four pillars (年月日時)

#### Scenario: Investment personality mapping

- **WHEN** Ten Gods are calculated
- **THEN** the system SHALL map the dominant Ten Gods to an investment style:
  - 偏財 dominant → Active Trader (積極型交易者)
  - 正財 dominant → Long-term Holder (穩健型投資者)
  - 食神 dominant → Research Analyst (研究型分析者)
  - 傷官 dominant → Contrarian (逆向思考型)
  - 比肩/劫財 dominant → Risk Seeker (風險偏好型)
  - 正官/七殺 dominant → Disciplined (紀律型)
  - 正印/偏印 dominant → Learning-oriented (學習型)

### Requirement: ZiWei DouShu Simplified Analysis

The system SHALL provide a simplified Purple Star Astrology analysis using the user's existing birth data (no additional input required).

#### Scenario: Main star calculation

- **WHEN** user has provided birth date and time
- **THEN** the system SHALL determine the Ming Gong (命宮) position from lunar birth month and hour
- **AND** calculate the Five Element Bureau (五行局) from Ming Gong's stem-branch
- **AND** place the 14 main stars based on the Five Element Bureau and lunar birth day

#### Scenario: Three-palace analysis

- **WHEN** the 14 main stars are placed
- **THEN** the system SHALL identify stars in:
  - Ming Gong (命宮) → Overall personality
  - Cai Bo Gong (財帛宮) → Wealth tendency
  - Shi Ye Gong (事業宮) → Career tendency
- **AND** map star combinations to investment tendencies

### Requirement: Enhanced Feng Shui Direction Analysis

The system SHALL provide enhanced daily lucky direction analysis incorporating monthly pillar, personal element, and daily branch interactions.

#### Scenario: Enhanced direction calculation

- **WHEN** fortune is calculated for a given day
- **THEN** the system SHALL consider monthly pillar天干 + personal element + daily地支
- **AND** produce more personalized lucky/avoid directions

#### Scenario: Daily clash warning

- **WHEN** the daily branch clashes with the user's birth branch
- **THEN** the system SHALL flag it as a clash day (沖日)
- **AND** provide specific avoidance advice

### Requirement: Daily Fortune Cycle (流日吉凶)

The system SHALL analyze the interaction between the daily Heavenly Stem-Branch and the user's personal BaZi.

#### Scenario: Daily support analysis

- **WHEN** the daily stem-branch supports the user's day master
- **THEN** the system SHALL indicate it as a favorable day (吉日)

#### Scenario: Daily clash analysis

- **WHEN** the daily stem-branch clashes with the user's key pillars
- **THEN** the system SHALL indicate it as a caution day (凶日)
- **AND** provide specific investment caution advice

### Requirement: Wealth Accumulation Day (納財吉日)

The system SHALL identify specific Heavenly Stem-Branch combinations that are auspicious for wealth accumulation.

#### Scenario: Wealth day detection

- **WHEN** the current day matches a wealth-accumulating干支 combination
- **THEN** the system SHALL mark it as a "納財吉日" (wealth day)
- **AND** provide enhanced wealth-related advice
