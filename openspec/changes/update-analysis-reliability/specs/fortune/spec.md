## ADDED Requirements

### Requirement: Evidence for Zi Wei and Tian Fu in the life palace

The reading panel SHALL distinguish the two stars actually occupying the life palace from a conjunction elsewhere, a borrowed star, or separate placements.

#### Scenario: Both stars occupy the life palace

- **WHEN** Zi Wei and Tian Fu both occupy the natal life palace
- **THEN** the reading SHALL show that the condition is met and identify both seated stars and the life palace branch
- **AND** the reading SHALL show the rule version and source

#### Scenario: Both stars occupy another palace

- **WHEN** Zi Wei and Tian Fu share a palace other than the life palace
- **THEN** the reading SHALL identify their actual placement and SHALL NOT qualify them as sharing the life palace
- **AND** this reading SHALL leave the investment score unchanged

#### Scenario: The stars occupy separate palaces

- **WHEN** Zi Wei and Tian Fu occupy different natal palaces
- **THEN** the reading SHALL mark the condition as unmet and identify both actual placements
- **AND** when the life palace borrows one of these stars, the reading SHALL identify the borrowed star and its source palace

### Requirement: BaZi calendar edge regression fixtures

The regression fixtures SHALL record all four pillars around the solar-term and late-Zi-hour boundaries with explicit calendar values.

#### Scenario: Start of Spring between two birth times

- **WHEN** the input crosses the instant of Start of Spring before Lunar New Year
- **THEN** the BaZi year and month pillars SHALL advance while the lunar year follows the lunar calendar

#### Scenario: Civil midnight follows the onset of the Zi hour

- **WHEN** the input advances from 22:59 to 23:00 and then to 00:00 on the following date
- **THEN** the hour pillar SHALL change at 23:00 and the day pillar SHALL follow the civil date under the current sect 2 convention
