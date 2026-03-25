# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## Objective *(mandatory)*

[Describe the business outcome this feature must achieve.]

## Context *(mandatory)*

[Describe the product area, operators involved, current constraints, and why this
feature matters in the sales pipeline.]

## User Scenarios & Testing *(mandatory)*

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

## Edge Cases

- What happens when [boundary condition]?
- How does the system handle [error scenario]?
- How does the backend reject invalid ownership or auth context?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [specific capability]
- **FR-002**: System MUST [specific persistence or audit behavior]
- **FR-003**: Users MUST be able to [key interaction]
- **FR-004**: System MUST [ownership, auth, or visibility rule]
- **FR-005**: System MUST [API or validation behavior]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Business Rules *(mandatory)*

- **BR-001**: [State machine rule, e.g., "Deal stage changes MUST be executed by
  the backend API only"]
- **BR-002**: [Audit rule, e.g., "Every stage change MUST create a history record"]
- **BR-003**: [Ownership rule, e.g., "Users MUST only access deals scoped to
  their `owner_id`"]
- **BR-004**: [Validation rule, e.g., "All route inputs MUST be validated with
  centralized Zod schemas"]

## Flows *(mandatory)*

### Primary Flow

1. [Describe the main end-to-end flow]
2. [Include the backend mutation or read path]
3. [State what is persisted or audited]

### Failure / Edge Flow

1. [Describe the failure or denial path]
2. [Include validation, auth, or ownership enforcement]
3. [State the expected standardized error outcome]

## Dependencies *(mandatory)*

- **Technical Dependencies**: [Frameworks, services, packages, or internal modules]
- **Data Dependencies**: [Database tables, schemas, migrations, or existing data]
- **Auth Dependencies**: [Clerk, user sync, middleware, ownership context]

## Skills Used *(mandatory)*

- `[skill-name]`: [Why this skill is required for the feature]
- `clerk`: [Required when feature touches authentication or protected operations]
- `clerk-nextjs-patterns`: [Required when auth affects Next.js integration]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [Measurable metric]
- **SC-002**: [Measurable metric]
- **SC-003**: [User or operator success metric]
- **SC-004**: [Business metric]

## Validation Criteria *(mandatory)*

- **VC-001**: [How backend source-of-truth behavior will be verified]
- **VC-002**: [How persistence/audit requirements will be verified]
- **VC-003**: [How auth and ownership enforcement will be verified]
- **VC-004**: [How API contract and validation behavior will be verified]

## Assumptions

- [Assumption about target users]
- [Assumption about scope boundaries]
- [Assumption about data/environment]
- [Dependency on existing system/service]
