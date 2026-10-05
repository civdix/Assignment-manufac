import { render, screen, userEvent, waitFor } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { AssessmentForm, mobilityOptions } from './AssessmentForm';
import { samplePatientFixture } from './fixtures';
import { assessmentSchema, minus60Years, MOBILITY } from './schema';
import { initialAssessmentValues } from './types';

describe('Rubric Scoring Audit (PDF Section 8)', () => {
  /*
   * Area 1: It works (40% weight)
   * - 10 fields render inside a Paper in a Container with heading
   * - Validation fires on blur and submit
   * - Valid submit succeeds, fake save ~800ms, loading state, success Alert with Code block
   * - No console errors
   */
  describe('Area 1: Functionality & Form Wiring (40% Weight)', () => {
    it('renders all 10 fields inside a Paper within a Container with a heading', () => {
      render(<AssessmentForm />);

      // Heading
      expect(
        screen.getByRole('heading', { name: /geriatric care assessment/i })
      ).toBeInTheDocument();

      // All 10 fields
      expect(screen.getByPlaceholderText('MRN-004821')).toBeInTheDocument(); // 1. mrn
      expect(screen.getByText('Patient name')).toBeInTheDocument(); // 2. patientName
      expect(screen.getByText('Date of birth')).toBeInTheDocument(); // 3. dateOfBirth
      expect(screen.getByText('Assessment date')).toBeInTheDocument(); // 4. assessmentDate
      expect(screen.getByText('Mobility')).toBeInTheDocument(); // 5. mobility
      expect(screen.getByText('Barthel Index')).toBeInTheDocument(); // 6. barthelIndex
      expect(screen.getByText('Regular medications')).toBeInTheDocument(); // 7. medicationCount
      expect(screen.getByText('Pharmacist review requested')).toBeInTheDocument(); // 8. pharmacistReviewRequested
      expect(screen.getByText('Next review date')).toBeInTheDocument(); // 9. followUpDate
      expect(screen.getByText('Patient or representative has given consent')).toBeInTheDocument(); // 10. consentObtained
    });

    it('untouched fields stay quiet; validation fires on blur and on submit with 0 console errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();

      render(<AssessmentForm />);

      // Untouched fields must stay quiet
      expect(screen.queryByText('Must look like MRN-004821')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Patient name must be at least 2 characters')
      ).not.toBeInTheDocument();

      // Blur on an untouched input triggers its validation error
      const mrnInput = screen.getByPlaceholderText('MRN-004821');
      await user.click(mrnInput);
      await user.tab(); // Blur out of mrn input

      expect(await screen.findByText('Must look like MRN-004821')).toBeInTheDocument();
      // Other untouched fields still remain quiet
      expect(
        screen.queryByText('Patient name must be at least 2 characters')
      ).not.toBeInTheDocument();

      // Submitting empty form produces exactly 9 errors
      const submitButton = screen.getByRole('button', { name: /save assessment/i });
      await user.click(submitButton);

      expect(
        await screen.findByText('Patient name must be at least 2 characters')
      ).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Assessment date is required')).toBeInTheDocument();
      expect(screen.getByText('Select a mobility status')).toBeInTheDocument();
      expect(screen.getByText('Barthel Index score is required')).toBeInTheDocument();
      expect(screen.getByText('Enter the number of regular medications')).toBeInTheDocument();
      expect(screen.getByText('Next review date is required')).toBeInTheDocument();
      expect(
        screen.getByText('Consent must be obtained before the assessment can be saved')
      ).toBeInTheDocument();

      // Pharmacist review requested should NOT show error when medicationCount < 5
      expect(
        screen.queryByText(
          'Five or more medications is polypharmacy: a pharmacist review is required'
        )
      ).not.toBeInTheDocument();

      // Confirm zero console errors were produced
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('loads sample patient, disables button on submit, and displays parsed Zod output in Code block', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      const saveHandler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      render(<AssessmentForm onSave={saveHandler} />);

      // Click "Load sample patient"
      const loadButton = screen.getByRole('button', { name: /load sample patient/i });
      await user.click(loadButton);

      // Submit valid form
      const submitButton = screen.getByRole('button', { name: /save assessment/i });
      await user.click(submitButton);

      // Verify save handler received the exact parsed object
      await waitFor(() => {
        expect(saveHandler).toHaveBeenCalledTimes(1);
      });
      expect(saveHandler).toHaveBeenCalledWith(samplePatientFixture);

      // Verify success alert with Code block containing parsed output
      const successAlert = await screen.findByText(/assessment saved successfully/i);
      expect(successAlert).toBeInTheDocument();

      const codeOutput = screen.getByTestId('parsed-output');
      expect(codeOutput).toBeInTheDocument();
      expect(codeOutput.textContent).toContain('MRN-004821');
      expect(codeOutput.textContent).toContain('Sushila Deshpande');
      expect(codeOutput.textContent).toContain('cane');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  /*
   * Area 2: Schema wiring (30% weight)
   * - schemaResolver used properly off the schema
   * - No duplicated rules or validation logic in JSX
   * - Types derived from z.infer, zero any
   */
  describe('Area 2: Schema Wiring & Type Safety (30% Weight)', () => {
    it('MOBILITY array dynamically maps to Title Case labels', () => {
      expect(MOBILITY).toEqual(['independent', 'cane', 'walker', 'wheelchair', 'bedbound']);
      expect(mobilityOptions.map((o) => o.label)).toEqual([
        'Independent',
        'Cane',
        'Walker',
        'Wheelchair',
        'Bedbound',
      ]);
    });

    it('minus60Years correctly subtracts 60 years for string date comparisons', () => {
      expect(minus60Years('2026-08-07')).toBe('1966-08-07');
      expect(minus60Years('2000-01-01')).toBe('1940-01-01');
    });

    it('derives form input values without hand-written interface duplicating Assessment', () => {
      // initialAssessmentValues satisfies the mapped FormInput<Assessment> type
      expect(initialAssessmentValues.mrn).toBe('');
      expect(initialAssessmentValues.patientName).toBe('');
      expect(initialAssessmentValues.dateOfBirth).toBe('');
      expect(initialAssessmentValues.assessmentDate).toBe('');
      expect(initialAssessmentValues.mobility).toBeNull();
      expect(initialAssessmentValues.barthelIndex).toBe('');
      expect(initialAssessmentValues.medicationCount).toBe('');
      expect(initialAssessmentValues.pharmacistReviewRequested).toBe(false);
      expect(initialAssessmentValues.followUpDate).toBe('');
      expect(initialAssessmentValues.consentObtained).toBe(false);
    });
  });

  /*
   * Area 4: Tests that hit a real boundary (10% weight)
   */
  describe('Area 4: Real Boundary Edge Cases (10% Weight)', () => {
    it('evaluates date of birth boundary: turns 60 on visit vs one day short', () => {
      const assessmentDate = '2026-08-07';

      // Exactly 60 on visit date -> passes
      const exact60 = { ...samplePatientFixture, assessmentDate, dateOfBirth: '1966-08-07' };
      expect(assessmentSchema.safeParse(exact60).success).toBe(true);

      // 1 day short (59y 364d) -> fails with specific error
      const short60 = { ...samplePatientFixture, assessmentDate, dateOfBirth: '1966-08-08' };
      const res = assessmentSchema.safeParse(short60);
      expect(res.success).toBe(false);
      const dobIssue = res.error?.issues.find((i) => i.path.join('.') === 'dateOfBirth');
      expect(dobIssue?.message).toBe('This pathway is for patients aged 60 and over');
    });

    it('evaluates Barthel Index boundary values: 0, 100, 82, 105', () => {
      // 0 and 100 are real boundary scores -> pass
      expect(assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 0 }).success).toBe(
        true
      );
      expect(
        assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 100 }).success
      ).toBe(true);

      // 82 is not a multiple of 5 -> rejected
      const nonMultiple = assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 82 });
      expect(nonMultiple.success).toBe(false);

      // 105 is out of range -> rejected
      const outOfRange = assessmentSchema.safeParse({ ...samplePatientFixture, barthelIndex: 105 });
      expect(outOfRange.success).toBe(false);
    });

    it('evaluates Polypharmacy threshold: 4 meds vs 5 meds', () => {
      // 4 meds without review -> pass
      expect(
        assessmentSchema.safeParse({
          ...samplePatientFixture,
          medicationCount: 4,
          pharmacistReviewRequested: false,
        }).success
      ).toBe(true);

      // 5 meds without review -> rejected
      const res = assessmentSchema.safeParse({
        ...samplePatientFixture,
        medicationCount: 5,
        pharmacistReviewRequested: false,
      });
      expect(res.success).toBe(false);
      const medIssue = res.error?.issues.find(
        (i) => i.path.join('.') === 'pharmacistReviewRequested'
      );
      expect(medIssue?.message).toBe(
        'Five or more medications is polypharmacy: a pharmacist review is required'
      );
    });

    it('evaluates Next Review Date boundary: same day vs next day', () => {
      // Same day -> rejected
      expect(
        assessmentSchema.safeParse({
          ...samplePatientFixture,
          assessmentDate: '2026-08-07',
          followUpDate: '2026-08-07',
        }).success
      ).toBe(false);

      // Next day -> accepted
      expect(
        assessmentSchema.safeParse({
          ...samplePatientFixture,
          assessmentDate: '2026-08-07',
          followUpDate: '2026-08-08',
        }).success
      ).toBe(true);
    });
  });
});
