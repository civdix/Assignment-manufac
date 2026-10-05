import dayjs from 'dayjs';
import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Code,
  Container,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { schemaResolver, useForm } from '@mantine/form';
import { samplePatientFixture } from './fixtures';
import { assessmentSchema, MOBILITY, type Assessment } from './schema';
import { initialAssessmentValues, type AssessmentFormValues } from './types';

// Build Select options from the MOBILITY array, transforming snake_case to Title Case.
// Adding a value to the MOBILITY array automatically updates the dropdown.
export const mobilityOptions = MOBILITY.map((value) => ({
  value,
  label: value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '),
}));

export interface AssessmentFormProps {
  onSave?: (data: Assessment) => Promise<void> | void;
}

export function AssessmentForm({ onSave }: AssessmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<Assessment | null>(null);

  const form = useForm<AssessmentFormValues, Assessment>({
    mode: 'controlled',
    initialValues: initialAssessmentValues,
    validate: schemaResolver(assessmentSchema),
    transformValues: (values) => assessmentSchema.parse(values),
    validateInputOnBlur: true,
  });

  const handleLoadSample = () => {
    form.setValues(samplePatientFixture);
    form.clearErrors();
    setSubmittedData(null);
  };

  const handleSubmit = async (parsedValues: Assessment) => {
    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave(parsedValues);
      } else {
        // Mock save with ~800ms delay as per requirements
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setSubmittedData(parsedValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Title order={2} mb="xs">
          Geriatric Care Assessment
        </Title>
        <Text c="dimmed" size="sm" mb="lg">
          Visiting nurse home assessment check for elderly patients (age 60+).
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack gap="md">
            <TextInput
              label="Medical record number"
              placeholder="MRN-004821"
              withAsterisk
              key={form.key('mrn')}
              {...form.getInputProps('mrn')}
            />

            <TextInput
              label="Patient name"
              withAsterisk
              key={form.key('patientName')}
              {...form.getInputProps('patientName')}
            />

            <DateInput
              label="Date of birth"
              valueFormat="YYYY-MM-DD"
              withAsterisk
              key={form.key('dateOfBirth')}
              {...form.getInputProps('dateOfBirth')}
            />

            <DateInput
              label="Assessment date"
              valueFormat="YYYY-MM-DD"
              maxDate={today}
              withAsterisk
              key={form.key('assessmentDate')}
              {...form.getInputProps('assessmentDate')}
            />

            <Select
              label="Mobility"
              placeholder="Select mobility status"
              data={mobilityOptions}
              withAsterisk
              clearable
              key={form.key('mobility')}
              {...form.getInputProps('mobility')}
            />

            <NumberInput
              label="Barthel Index"
              description="Score ranges from 0 to 100 in steps of 5"
              step={5}
              min={0}
              max={100}
              clampBehavior="none"
              withAsterisk
              key={form.key('barthelIndex')}
              {...form.getInputProps('barthelIndex')}
            />

            <NumberInput
              label="Regular medications"
              description="Total number of regular medications (0 to 30)"
              min={0}
              max={30}
              clampBehavior="none"
              withAsterisk
              key={form.key('medicationCount')}
              {...form.getInputProps('medicationCount')}
            />

            <Checkbox
              label="Pharmacist review requested"
              key={form.key('pharmacistReviewRequested')}
              {...form.getInputProps('pharmacistReviewRequested', { type: 'checkbox' })}
            />

            <DateInput
              label="Next review date"
              valueFormat="YYYY-MM-DD"
              withAsterisk
              key={form.key('followUpDate')}
              {...form.getInputProps('followUpDate')}
            />

            <Checkbox
              label="Patient or representative has given consent"
              key={form.key('consentObtained')}
              {...form.getInputProps('consentObtained', { type: 'checkbox' })}
            />

            <Group justify="space-between" mt="lg">
              <Button
                type="button"
                variant="default"
                onClick={handleLoadSample}
                disabled={isSubmitting}
              >
                Load sample patient
              </Button>

              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                Save assessment
              </Button>
            </Group>
          </Stack>
        </form>

        {submittedData && (
          <Alert
            mt="xl"
            color="green"
            title="Assessment saved successfully"
            withCloseButton
            onClose={() => setSubmittedData(null)}
          >
            <Text size="sm" mb="xs">
              Parsed values returned by Zod:
            </Text>
            <Code block data-testid="parsed-output">
              {JSON.stringify(submittedData, null, 2)}
            </Code>
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
