import dayjs from 'dayjs';
import { useState } from 'react';
import {
  ActionIcon,
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
  Tooltip,
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

// Accessible clinical info tooltip button for medical terminology and requirements
function InfoButton({ tooltip }: { tooltip: string }) {
  return (
    <Tooltip label={tooltip} multiline w={280} withArrow position="top-start">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="xs"
        radius="xl"
        aria-label="Clinical information"
        tabIndex={-1}
        style={{ verticalAlign: 'middle', display: 'inline-flex' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', fontFamily: 'serif' }}>
          i
        </span>
      </ActionIcon>
    </Tooltip>
  );
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
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Medical record number</span>
                  <InfoButton tooltip="Unique patient identifier formatted as MRN followed by 6 digits (e.g. MRN-004821)." />
                </Group>
              }
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
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Date of birth</span>
                  <InfoButton tooltip="This geriatric care pathway is for patients aged 60 and over. Age is calculated relative to the assessment visit date." />
                </Group>
              }
              valueFormat="YYYY-MM-DD"
              withAsterisk
              key={form.key('dateOfBirth')}
              {...form.getInputProps('dateOfBirth')}
            />

            <DateInput
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Assessment date</span>
                  <InfoButton tooltip="Date of the nurse home visit. Capped at today to support current or backdated visits." />
                </Group>
              }
              valueFormat="YYYY-MM-DD"
              maxDate={today}
              withAsterisk
              key={form.key('assessmentDate')}
              {...form.getInputProps('assessmentDate')}
            />

            <Select
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Mobility</span>
                  <InfoButton tooltip="Patient's primary ambulation capability (Independent, Cane, Walker, Wheelchair, or Bedbound)." />
                </Group>
              }
              placeholder="Select mobility status"
              data={mobilityOptions}
              withAsterisk
              clearable
              key={form.key('mobility')}
              {...form.getInputProps('mobility')}
            />

            <NumberInput
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Barthel Index</span>
                  <InfoButton tooltip="Measures independence in activities of daily living (feeding, bathing, grooming, dressing, bowels, bladder, toilet use, transfers, mobility, stairs). Scored in increments of 5 from 0 to 100. Higher score indicates greater independence." />
                </Group>
              }
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
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Regular medications</span>
                  <InfoButton tooltip="Number of regular prescribed medications. Five or more medications defines clinical polypharmacy and mandates a pharmacist review." />
                </Group>
              }
              description="Total number of regular medications (0 to 30)"
              min={0}
              max={30}
              clampBehavior="none"
              withAsterisk
              key={form.key('medicationCount')}
              {...form.getInputProps('medicationCount')}
            />

            <Checkbox
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Pharmacist review requested</span>
                  <InfoButton tooltip="Mandatory review triggered when regular medication count is 5 or more (polypharmacy) to evaluate drug interaction and fall risks." />
                </Group>
              }
              key={form.key('pharmacistReviewRequested')}
              {...form.getInputProps('pharmacistReviewRequested', { type: 'checkbox' })}
            />

            <DateInput
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Next review date</span>
                  <InfoButton tooltip="Scheduled follow-up home visit; must occur chronologically after the current assessment date." />
                </Group>
              }
              valueFormat="YYYY-MM-DD"
              withAsterisk
              key={form.key('followUpDate')}
              {...form.getInputProps('followUpDate')}
            />

            <Checkbox
              label={
                <Group gap={4} wrap="nowrap" align="center">
                  <span>Patient or representative has given consent</span>
                  <InfoButton tooltip="Explicit consent must be obtained from the patient or legal surrogate before health data can be saved." />
                </Group>
              }
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
