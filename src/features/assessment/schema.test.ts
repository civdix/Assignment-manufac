import { describe, expect, it } from 'vitest';
import { schemaResolver } from '@mantine/form';
import { samplePatientFixture } from './fixtures';
import { assessmentSchema } from './schema';
import { initialAssessmentValues } from './types';

// Helper to assert that assessmentSchema rejects with the exact prescribed Zod error message on the expected path
function expectPrescribedError(data: unknown, path: string, expectedMessage: string) {
  const result = assessmentSchema.safeParse(data);
  expect(result.success).toBe(false);
  const issues = result.error?.issues ?? [];
  const issue = issues.find((i) => i.path.join('.') === path);
  expect(issue?.message).toBe(expectedMessage);
}

describe('Geriatric Care Assessment Schema - Prescribed Error Texts', () => {
  it('validates date of birth boundary: exactly 60 versus one day short', () => {
    // Exactly 60 on visit date -> passes
    const exactly60 = {
      ...samplePatientFixture,
      assessmentDate: '2026-08-07',
      dateOfBirth: '1966-08-07',
    };
    expect(assessmentSchema.safeParse(exactly60).success).toBe(true);

    // One day short of 60 -> fails with prescribed error text
    const oneDayShortOf60 = {
      ...samplePatientFixture,
      assessmentDate: '2026-08-07',
      dateOfBirth: '1966-08-08',
    };
    expectPrescribedError(
      oneDayShortOf60,
      'dateOfBirth',
      'This pathway is for patients aged 60 and over'
    );
  });

  it('produces exactly 9 prescribed errors on empty form with no cross-field noise', async () => {
    const resolver = schemaResolver(assessmentSchema);
    const errors = await resolver(initialAssessmentValues);

    expect(Object.keys(errors)).toHaveLength(9);
    expect(errors.mrn).toBe('Must look like MRN-004821');
    expect(errors.patientName).toBe('Patient name must be at least 2 characters');
    expect(errors.dateOfBirth).toBe('Date of birth is required');
    expect(errors.assessmentDate).toBe('Assessment date is required');
    expect(errors.mobility).toBe('Select a mobility status');
    expect(errors.barthelIndex).toBe('Barthel Index score is required');
    expect(errors.medicationCount).toBe('Enter the number of regular medications');
    expect(errors.followUpDate).toBe('Next review date is required');
    expect(errors.consentObtained).toBe(
      'Consent must be obtained before the assessment can be saved'
    );
    expect(errors.pharmacistReviewRequested).toBeUndefined();
  });

  it('validates MRN prescribed error text on regex mismatch', () => {
    expectPrescribedError(
      { ...samplePatientFixture, mrn: 'MRN-4821' },
      'mrn',
      'Must look like MRN-004821'
    );
    expectPrescribedError(
      { ...samplePatientFixture, mrn: 'INVALID' },
      'mrn',
      'Must look like MRN-004821'
    );
  });

  it('validates Patient Name prescribed min and max error texts', () => {
    // Under 2 characters
    expectPrescribedError(
      { ...samplePatientFixture, patientName: 'S' },
      'patientName',
      'Patient name must be at least 2 characters'
    );

    // Over 60 characters
    const sixtyOneChars = 'A'.repeat(61);
    expectPrescribedError(
      { ...samplePatientFixture, patientName: sixtyOneChars },
      'patientName',
      'Patient name cannot exceed 60 characters'
    );
  });

  it('validates Mobility enum prescribed error text on invalid status', () => {
    expectPrescribedError(
      { ...samplePatientFixture, mobility: 'crutches' },
      'mobility',
      'Select a mobility status'
    );
  });

  it('validates Barthel Index prescribed error texts: steps, ranges, and integers', () => {
    // Valid boundary scores: 0 and 100
    expect(assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 0 }).success).toBe(
      true
    );
    expect(assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 100 }).success).toBe(
      true
    );

    // Not multiple of 5
    expectPrescribedError(
      { ...samplePatientFixture, barthelIndex: 82 },
      'barthelIndex',
      'Barthel Index is scored in steps of 5'
    );

    // Out of range (> 100)
    expectPrescribedError(
      { ...samplePatientFixture, barthelIndex: 105 },
      'barthelIndex',
      'Barthel Index ranges from 0 to 100'
    );

    // Out of range (< 0)
    expectPrescribedError(
      { ...samplePatientFixture, barthelIndex: -5 },
      'barthelIndex',
      'Barthel Index ranges from 0 to 100'
    );

    // Non-integer decimal
    expectPrescribedError(
      { ...samplePatientFixture, barthelIndex: 75.5 },
      'barthelIndex',
      'Barthel Index must be a whole number'
    );
  });

  it('validates Medication Count prescribed error texts: ranges, integers, and polypharmacy', () => {
    // Negative number
    expectPrescribedError(
      { ...samplePatientFixture, medicationCount: -1 },
      'medicationCount',
      'Medication count cannot be negative'
    );

    // Exceeding 30
    expectPrescribedError(
      { ...samplePatientFixture, medicationCount: 31 },
      'medicationCount',
      'Enter 30 or fewer'
    );

    // Non-integer decimal
    expectPrescribedError(
      { ...samplePatientFixture, medicationCount: 2.5 },
      'medicationCount',
      'Medication count must be a whole number'
    );

    // 4 medications unchecked -> accepted
    expect(
      assessmentSchema.safeParse({
        ...samplePatientFixture,
        medicationCount: 4,
        pharmacistReviewRequested: false,
      }).success
    ).toBe(true);

    // 5 medications with review unchecked -> polypharmacy prescribed error text on pharmacistReviewRequested
    expectPrescribedError(
      {
        ...samplePatientFixture,
        medicationCount: 5,
        pharmacistReviewRequested: false,
      },
      'pharmacistReviewRequested',
      'Five or more medications is polypharmacy: a pharmacist review is required'
    );

    // 5 medications with review checked -> accepted
    expect(
      assessmentSchema.safeParse({
        ...samplePatientFixture,
        medicationCount: 5,
        pharmacistReviewRequested: true,
      }).success
    ).toBe(true);
  });

  it('validates Next Review Date prescribed error text', () => {
    // Same day -> rejected with prescribed error text
    expectPrescribedError(
      {
        ...samplePatientFixture,
        assessmentDate: '2026-08-07',
        followUpDate: '2026-08-07',
      },
      'followUpDate',
      'Next review must be after the assessment date'
    );

    // Prior day -> rejected with prescribed error text
    expectPrescribedError(
      {
        ...samplePatientFixture,
        assessmentDate: '2026-08-07',
        followUpDate: '2026-08-06',
      },
      'followUpDate',
      'Next review must be after the assessment date'
    );

    // Next day -> accepted
    expect(
      assessmentSchema.safeParse({
        ...samplePatientFixture,
        assessmentDate: '2026-08-07',
        followUpDate: '2026-08-08',
      }).success
    ).toBe(true);
  });

  it('validates Consent prescribed error text when false', () => {
    expectPrescribedError(
      { ...samplePatientFixture, consentObtained: false },
      'consentObtained',
      'Consent must be obtained before the assessment can be saved'
    );
  });

  it('guards cross-field rules so blank dates only produce required errors', () => {
    // Blank dateOfBirth produces only required error, not age refine error
    const blankDob = { ...samplePatientFixture, dateOfBirth: '' };
    expectPrescribedError(blankDob, 'dateOfBirth', 'Date of birth is required');

    // Blank followUpDate produces only required error, not sequence refine error
    const blankFollowUp = { ...samplePatientFixture, followUpDate: '' };
    expectPrescribedError(blankFollowUp, 'followUpDate', 'Next review date is required');
  });

  it('normalizes and trims whitespace from strings on parse', () => {
    const withWhitespace = {
      ...samplePatientFixture,
      mrn: '  MRN-004821  ',
      patientName: '  Sushila Deshpande  ',
    };

    const parsed = assessmentSchema.parse(withWhitespace);
    expect(parsed.mrn).toBe('MRN-004821');
    expect(parsed.patientName).toBe('Sushila Deshpande');
  });
});
