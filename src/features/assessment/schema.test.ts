import { describe, expect, it } from 'vitest';
import { schemaResolver } from '@mantine/form';
import { samplePatientFixture } from './fixtures';
import { assessmentSchema } from './schema';
import { initialAssessmentValues } from './types';

describe('Geriatric Care Assessment Schema', () => {
  it('validates date of birth boundary: exactly 60 versus one day short', () => {
    // Assessment date: 2026-08-07
    // A patient born on 1966-08-07 is exactly 60 years old on assessment date -> MUST PASS
    const exactly60 = {
      ...samplePatientFixture,
      assessmentDate: '2026-08-07',
      dateOfBirth: '1966-08-07',
    };

    const validResult = assessmentSchema.safeParse(exactly60);
    expect(validResult.success).toBe(true);

    // A patient born on 1966-08-08 is 59 years and 364 days old (one day short of 60) -> MUST FAIL
    const oneDayShortOf60 = {
      ...samplePatientFixture,
      assessmentDate: '2026-08-07',
      dateOfBirth: '1966-08-08',
    };

    const invalidResult = assessmentSchema.safeParse(oneDayShortOf60);
    expect(invalidResult.success).toBe(false);
    const issues = invalidResult.error?.issues ?? [];
    const dobIssue = issues.find((issue) => issue.path.join('.') === 'dateOfBirth');
    expect(dobIssue?.message).toBe('This pathway is for patients aged 60 and over');
  });

  it('produces exactly 9 errors on empty initial form with no cross-field noise', async () => {
    const resolver = schemaResolver(assessmentSchema);
    const errors = await resolver(initialAssessmentValues);

    const errorFields = Object.keys(errors);
    expect(errorFields).toHaveLength(9);
    expect(errorFields).toEqual([
      'mrn',
      'patientName',
      'dateOfBirth',
      'assessmentDate',
      'mobility',
      'barthelIndex',
      'medicationCount',
      'followUpDate',
      'consentObtained',
    ]);
    expect(errors.pharmacistReviewRequested).toBeUndefined();
  });

  it('validates Barthel Index score boundaries and step multiples', () => {
    // 0 and 100 must be accepted
    expect(assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 0 }).success).toBe(
      true
    );
    expect(assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 100 }).success).toBe(
      true
    );

    // 82 (not a multiple of 5) must be rejected
    const nonMultiple = assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 82 });
    expect(nonMultiple.success).toBe(false);

    // 105 (out of range) must be rejected
    const outOfRange = assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 105 });
    expect(outOfRange.success).toBe(false);
  });

  it('validates polypharmacy requirement when regular medications reach 5', () => {
    // 4 medications without review -> accepted
    const fourMeds = {
      ...samplePatientFixture,
      medicationCount: 4,
      pharmacistReviewRequested: false,
    };
    expect(assessmentSchema.safeParse(fourMeds).success).toBe(true);

    // 5 medications without review -> rejected
    const fiveMedsUnchecked = {
      ...samplePatientFixture,
      medicationCount: 5,
      pharmacistReviewRequested: false,
    };
    const rejectedResult = assessmentSchema.safeParse(fiveMedsUnchecked);
    expect(rejectedResult.success).toBe(false);

    // 5 medications with review -> accepted
    const fiveMedsChecked = {
      ...samplePatientFixture,
      medicationCount: 5,
      pharmacistReviewRequested: true,
    };
    expect(assessmentSchema.safeParse(fiveMedsChecked).success).toBe(true);
  });

  it('validates next review date must be strictly after assessment date', () => {
    // Same day -> rejected
    const sameDay = {
      ...samplePatientFixture,
      assessmentDate: '2026-08-07',
      followUpDate: '2026-08-07',
    };
    expect(assessmentSchema.safeParse(sameDay).success).toBe(false);

    // Next day -> accepted
    const nextDay = {
      ...samplePatientFixture,
      assessmentDate: '2026-08-07',
      followUpDate: '2026-08-08',
    };
    expect(assessmentSchema.safeParse(nextDay).success).toBe(true);
  });
});
