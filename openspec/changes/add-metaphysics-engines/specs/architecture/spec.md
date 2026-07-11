## ADDED Requirements

### Requirement: Metaphysics Engine Plugin Architecture

The system SHALL provide a plugin-based architecture for integrating multiple traditional Chinese metaphysics calculation engines.

#### Scenario: Engine registration

- **WHEN** the application starts
- **THEN** all registered metaphysics engines SHALL be available for fortune calculation

#### Scenario: Engine enable/disable

- **WHEN** user toggles a metaphysics engine on/off in settings
- **THEN** the engine SHALL be included/excluded from fortune calculation
- **AND** the UI SHALL reflect the engine's active/inactive state

#### Scenario: Engine result aggregation

- **WHEN** multiple engines are active
- **THEN** `IntegratedFortuneService` SHALL collect results from all active engines
- **AND** aggregate them into the final `IntegratedFortuneData`

### Requirement: MetaphysicsEngine Interface

Each metaphysics engine SHALL implement the `MetaphysicsEngine` interface with `name`, `calculate(profile, date)`, `getWeight()`, and `isEnabled()` methods.

#### Scenario: Engine implementation

- **WHEN** a new metaphysics engine is created
- **THEN** it SHALL implement the `MetaphysicsEngine` interface
- **AND** register itself with the `MetaphysicsEngineRegistry`

#### Scenario: Engine weight configuration

- **WHEN** user adjusts engine weights in settings
- **THEN** the engine's contribution to final scores SHALL be adjusted accordingly

---

## MODIFIED Requirements

### Requirement: Fortune Calculation Pipeline

The system SHALL calculate fortune by aggregating results from all active metaphysics engines, weighted by user-configured weights.

#### Scenario: Multi-engine calculation

- **WHEN** fortune calculation is triggered
- **THEN** the system SHALL execute all active engines in sequence
- **AND** combine their results using weighted aggregation
- **AND** produce a single `IntegratedFortuneData` result

#### Scenario: Fallback to classic calculation

- **WHEN** no engines are registered or all engines are disabled
- **THEN** the system SHALL fall back to the classic fortune calculation
