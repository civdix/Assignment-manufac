import type { Assessment } from './schema';

/**
 * Generic mapped type that derives the unvalidated/empty form input state
 * from any schema output type, avoiding hand-written interface duplication.
 */
export type FormInput<T> = {
  [K in keyof T]: T[K] extends boolean
    ? boolean
    : T[K] extends number
      ? number | ''
      : T[K] | null | '';
};

export type AssessmentFormValues = FormInput<Assessment>;

export const initialAssessmentValues: AssessmentFormValues = {
  mrn: '',
  patientName: '',
  dateOfBirth: '',
  assessmentDate: '',
  mobility: null,
  barthelIndex: '',
  medicationCount: '',
  pharmacistReviewRequested: false,
  followUpDate: '',
  consentObtained: false,
};
