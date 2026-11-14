## ADDED Requirements

### Requirement: Analytics 3D Scenes

The analytics page SHALL render its four 3D scenes (price, five elements, solar terms, technical indicators) on a shared stage whose colours come from the design tokens, with a title, a legend, data labels and a value tooltip on hover or tap.

#### Scenario: Theme switch

- **WHEN** the user toggles between light and dark themes
- **THEN** every scene SHALL rebuild with the colours of the new theme
- **AND** rising values SHALL use the rise token (red) and falling values the fall token (green)

#### Scenario: Idle rendering

- **WHEN** no data, size, pointer or animation change is pending, or the scene is scrolled out of view or the tab is hidden
- **THEN** the stage SHALL NOT render frames

#### Scenario: Reduced motion

- **WHEN** the user prefers reduced motion
- **THEN** entrance animations SHALL jump to their final state

#### Scenario: WebGL unavailable

- **WHEN** a WebGL context cannot be created or is lost
- **THEN** the card SHALL show a text summary of the same data instead of an empty area

#### Scenario: Solar term from real data

- **WHEN** the solar-term scene is shown for a date
- **THEN** the current term SHALL be the most recent term on or before that date
- **AND** when no term can be determined the term SHALL NOT be displayed
