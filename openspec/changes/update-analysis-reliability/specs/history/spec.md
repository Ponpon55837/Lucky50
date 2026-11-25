## ADDED Requirements

### Requirement: Concurrent fortune recording

Single-record writes SHALL atomically resolve an existing date and profile, write the record and maintain an accurate count. Batch imports SHALL retain overwrite-by-ID semantics.

#### Scenario: Two tabs record the same fortune

- **WHEN** two tabs concurrently append different IDs for the same date and profile
- **THEN** one logical entry SHALL be persisted and counted once

#### Scenario: An operation aborts

- **WHEN** a write transaction aborts
- **THEN** readers SHALL see the prior records and count
