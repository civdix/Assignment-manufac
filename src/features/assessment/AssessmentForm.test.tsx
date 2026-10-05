import { render, screen, userEvent, waitFor } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { AssessmentForm } from './AssessmentForm';
import { samplePatientFixture } from './fixtures';

describe('AssessmentForm Component', () => {
  it('loads sample patient, submits, and calls save handler with parsed values', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(<AssessmentForm onSave={handleSave} />);

    // Click "Load sample patient" button
    const loadButton = screen.getByRole('button', { name: /load sample patient/i });
    await user.click(loadButton);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save assessment/i });
    await user.click(submitButton);

    // Assert that save handler was called with the exact parsed values
    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    expect(handleSave).toHaveBeenCalledWith(samplePatientFixture);

    // Verify success alert with parsed code output is displayed
    expect(await screen.findByText(/assessment saved successfully/i)).toBeInTheDocument();
  });

  it('displays validation errors and prevents save when submitted empty', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(<AssessmentForm onSave={handleSave} />);

    const submitButton = screen.getByRole('button', { name: /save assessment/i });
    await user.click(submitButton);

    expect(handleSave).not.toHaveBeenCalled();
    expect(await screen.findByText('Must look like MRN-004821')).toBeInTheDocument();
    expect(screen.getByText('Patient name must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    expect(screen.getByText('Assessment date is required')).toBeInTheDocument();
    expect(screen.getByText('Select a mobility status')).toBeInTheDocument();
    expect(screen.getByText('Barthel Index score is required')).toBeInTheDocument();
    expect(screen.getByText('Enter the number of regular medications')).toBeInTheDocument();
    expect(screen.getByText('Next review date is required')).toBeInTheDocument();
    expect(
      screen.getByText('Consent must be obtained before the assessment can be saved')
    ).toBeInTheDocument();
  });
});
