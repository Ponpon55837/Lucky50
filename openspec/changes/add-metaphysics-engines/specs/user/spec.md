## ADDED Requirements

### Requirement: Metaphysics Engine Settings

Users SHALL be able to configure which metaphysics engines are active and adjust their weights.

#### Scenario: Toggle engine

- **WHEN** user navigates to Profile settings
- **THEN** the system SHALL display a list of available metaphysics engines
- **AND** each engine SHALL have an on/off toggle

#### Scenario: Adjust engine weight

- **WHEN** user adjusts an engine's weight slider
- **THEN** the engine's contribution to fortune calculation SHALL change proportionally
- **AND** the change SHALL take effect on next fortune calculation

#### Scenario: Default settings

- **WHEN** user has not configured metaphysics settings
- **THEN** all engines SHALL be enabled with default weights

### Requirement: Metaphysics Profile Summary

The system SHALL display a comprehensive metaphysics profile summary on the Profile page.

#### Scenario: Profile display

- **WHEN** user views the Profile page
- **THEN** the system SHALL show:
  - BaZi Ten Gods investment personality
  - ZiWei main stars summary
  - Personal element analysis
  - Name element analysis

#### Scenario: No birth time

- **WHEN** user has not provided birth time
- **THEN** the system SHALL still calculate available analyses
- **AND** disable time-dependent features (ZiWei, Ten Gods hour pillar)
