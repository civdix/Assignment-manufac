# Geriatric Care Assessment Form

A single-page Geriatric Care Assessment form built with **React 19**, **TypeScript**, **Mantine**, and **Zod 4** for visiting nurses conducting elderly home care assessments.

---

## Live Demo & Deployment

- **Deployment URL**: *(Deploy on Vercel / Netlify / GitHub Pages and insert live URL here)*
- **Repository**: [https://github.com/civdix/Assignment-manufac](https://github.com/civdix/Assignment-manufac)

---

## Tech Stack

- **Framework**: React 19 + Vite
- **UI Library**: Mantine (`@mantine/core`, `@mantine/dates`, `@mantine/form`, `dayjs`)
- **Schema & Validation**: Zod 4 (`z.iso.date()`, `{ error: '...' }`) with Mantine `schemaResolver`
- **Testing**: Vitest + React Testing Library + `@testing-library/user-event`
- **Toolchain**: TypeScript, Oxlint, Oxfmt, Stylelint (`vite-plus` / `vp`)

---

## Key Architecture & Design Decisions

### 1. Handling the Type Gap (Initial Values vs. Parsed `Assessment`)
A key requirement of this assignment was:
> *"Get your value type from Assessment. Do not hand-write a second interface. Empty initial values will not satisfy Assessment, so you will need to type initial values as the input shape and let the resolver produce the parsed output. How you handle that gap is part of what we are looking at."*

Instead of hand-writing a duplicate interface with repeated field definitions or resorting to `any`, we used a generic mapped type derived directly from `Assessment`:

```typescript
export type FormInput<T> = {
  [K in keyof T]: T[K] extends boolean
    ? boolean
    : T[K] extends number
      ? number | ''
      : T[K] | null | '';
};

export type AssessmentFormValues = FormInput<Assessment>;
```

- **Single Source of Truth**: If a field is added to or modified in `assessmentSchema`, `Assessment` updates, and `AssessmentFormValues` automatically adjusts without any manual interface synchronization.
- **Type-safe Integration**: In `useForm<AssessmentFormValues, Assessment>`, Mantine's `transformValues: (values) => assessmentSchema.parse(values)` guarantees that `handleSubmit(parsedValues)` strictly receives the valid, parsed, and trimmed `Assessment` type with zero type assertions (`as any`).

### 2. Validation Wiring & Zero Rule Duplication
- **Single Source of Validation Rules**: All validation logic resides in `src/features/assessment/schema.ts`. There are zero regex patterns or conditional `>= 5` validation checks in JSX.
- **No Silent Modification of Clinical Scores**: `NumberInput` fields use `clampBehavior="none"` so inputs are never quietly clamped or auto-corrected. If a nurse enters `82` or `105`, Mantine preserves the raw input and allows Zod's validation rules (`ranges from 0 to 100`, `scored in steps of 5`) to reject the value with exact feedback.
- **Guarded Cross-Field Validations**: Submitting an empty form outputs **exactly 9 errors** (one per required field). Blank dates and counts do not trigger downstream cross-field errors.
- **Validation Timing**: Validates on `blur` (`validateInputOnBlur: true`) and on form `submit`. Untouched fields remain quiet.

### 3. Dynamic Mobility Dropdown
Options for `mobility` are dynamically generated from the `MOBILITY` array constant in `schema.ts`:
```typescript
export const mobilityOptions = MOBILITY.map((value) => ({
  value,
  label: value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '),
}));
```
Adding a new value to `MOBILITY` automatically displays it with formatted Title Case in the dropdown with no other changes.

### 4. Submission & Mock Save
On valid submission:
- Fakes an async save with an ~800ms delay.
- Disables the submit button and activates Mantine's loading spinner.
- Displays a success `Alert` containing the **parsed output from Zod** (with trimmed strings) inside a `<Code block>`.

---

## Form Fields (10 Required Fields)

| # | Field | Label | Component | Notes |
|---|---|---|---|---|
| 1 | `mrn` | Medical record number | `TextInput` | Placeholder `MRN-004821`, regex `^MRN-\d{6}$` |
| 2 | `patientName` | Patient name | `TextInput` | Trimmed, 2 to 60 characters |
| 3 | `dateOfBirth` | Date of birth | `DateInput` | Must be 60+ years old on assessment date |
| 4 | `assessmentDate` | Assessment date | `DateInput` | `maxDate` capped at today |
| 5 | `mobility` | Mobility | `Select` | Derived from `MOBILITY` array |
| 6 | `barthelIndex` | Barthel Index | `NumberInput` | 0–100, step 5, `clampBehavior="none"` |
| 7 | `medicationCount` | Regular medications | `NumberInput` | 0–30, `clampBehavior="none"` |
| 8 | `pharmacistReviewRequested` | Pharmacist review requested | `Checkbox` | Mandatory if `medicationCount >= 5` |
| 9 | `followUpDate` | Next review date | `DateInput` | Must be strictly after assessment date |
| 10 | `consentObtained` | Consent | `Checkbox` | Literal `true` required to save |

---

## Getting Started

### Prerequisites
- Node.js 20+ or 22+
- Yarn 4 (`corepack enable` or `npx corepack yarn`)

### Installation & Development

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

### Running Tests and Quality Checks

```bash
# Run all tests, lint checks, typecheck, stylelint, and production build
yarn test

# Run Vitest test runner only
yarn vitest

# Run type check only
yarn typecheck

# Check formatting and linting
yarn check
```

---

## Test Suite

The test suite covers:
1. **Schema Boundary Test (`safeParse`)**:
   - Verifies a patient turning 60 exactly on the assessment date is accepted.
   - Verifies a patient one day short of 60 (59 years, 364 days) is rejected with `'This pathway is for patients aged 60 and over'`.
2. **Form Rendered Integration Test**:
   - Renders the assessment form with Mantine provider.
   - Clicks "Load sample patient" to populate valid fixture data.
   - Submits the form and asserts the `onSave` handler is called with the exact parsed values.
3. **Empty Form Validation Test**:
   - Submits an empty form and verifies all 9 field-specific error messages are rendered without cross-field cascading noise.
4. **Clinical Boundaries**:
   - Tests Barthel Index step increments (steps of 5) and extremes (0 and 100).
   - Tests polypharmacy threshold (4 meds pass unchecked, 5 meds require pharmacist review).
   - Tests follow-up date boundary (same day fails, next day passes).

---

## Time Spent & Unfinished Items

- **Time Spent**: ~1.5 hours.
- **Unfinished Items**: None. All 10 fields, schema resolver wiring, cross-field rules, sample fixture loader, mock async save, tests, and formatting checks are fully implemented.
- **Out of Scope (per brief)**: Backend API, authentication, routing, global state store, toast notifications, and custom CSS beyond Mantine's built-in styles were intentionally omitted.
