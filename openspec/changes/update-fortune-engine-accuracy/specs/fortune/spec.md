## ADDED Requirements

### Requirement: Daily Hour Omens

The system SHALL derive each of the twelve hours' omen from the Twelve Day-Officers of the Yellow and Black Paths (黃道黑道十二神) for the day branch, combined with the hour's clash against the day branch and its clash, harm or harmony with the user's birth-year branch.

#### Scenario: Omen varies with the day

- **WHEN** the day branch changes
- **THEN** the starting hour of 青龍 SHALL follow the rule 子午起申、丑未起戌、寅申起子、卯酉起寅、辰戌起辰、巳亥起午
- **AND** hours governed by 青龍、明堂、金匱、天德、玉堂、司命 SHALL be auspicious unless a clash applies

#### Scenario: Personal clash overrides

- **WHEN** an hour branch clashes with the user's birth-year branch or with the day branch
- **THEN** that hour SHALL be marked inauspicious regardless of its day-officer

### Requirement: Rule-Based Engine Scores

Each metaphysics engine SHALL compute its score from the user's birth chart and the current day's stem-branch, and SHALL NOT return a constant or a value derived from unrelated data.

#### Scenario: Classic engine

- **WHEN** the classic engine runs
- **THEN** it SHALL score the day from the day-officer, the Twelve Establishments (建除十二神), trade-related 宜忌, the day branch's relation to the birth-year branch, and the 太歲 relation

#### Scenario: Ten Gods engine

- **WHEN** the Ten Gods engine runs
- **THEN** it SHALL determine the day master's strength from the month command, roots and stems, derive favourable elements, and score the day stem and branch by their Ten God category

#### Scenario: ZiWei engine

- **WHEN** the ZiWei engine runs
- **THEN** it SHALL place the fourteen main stars from the life palace, the Five Element Bureau and the lunar birth day
- **AND** score the natal and daily Four Transformations (四化) that fall in the life, wealth, career and travel palaces

#### Scenario: FengShui engine

- **WHEN** the FengShui engine runs
- **THEN** it SHALL report the day's wealth, joy and fortune god directions and the Three Killings direction
- **AND** score the day's 納音 element against the user's birth-year 納音 element

### Requirement: Birth Chart Accuracy

The system SHALL build the four pillars from solar terms and the actual birth hour, and SHALL derive the zodiac from the lunar year and the personal element from the year pillar's 納音.

#### Scenario: Birth before lunar new year

- **WHEN** the birth date falls in January before the lunar new year
- **THEN** the zodiac SHALL be that of the previous lunar year

### Requirement: Local-Date Cache Keys

Almanac data SHALL be cached by the local calendar date.

#### Scenario: Early morning lookup

- **WHEN** the almanac is requested between 00:00 and 08:00 in UTC+8
- **THEN** the data returned SHALL be for the local date, not the previous UTC date

### Requirement: Kangxi Name Strokes

Name-based element calculation SHALL use Kangxi stroke counts, counting each radical in its original form, and SHALL NOT estimate strokes from code points.

#### Scenario: Radical counted in original form

- **WHEN** a character uses a reduced radical such as 氵, 艹 or 阝
- **THEN** its stroke count SHALL be the Kangxi radical's strokes plus the residual strokes

#### Scenario: Unknown character

- **WHEN** a character has no stroke data
- **THEN** it SHALL be excluded from the total and reported to the user
