export const CHECKLIST_ITEMS = [
  'Get enough sleep',
  'Avoid too much caffeine',
  'Eat and drink sensibly',
  'Arrive with enough time',
  'Bring the correct documents',
  'Practise breathing techniques',
  'Focus on safe driving, not just passing',
  'Speak to my instructor about my worries',
  'Complete mock tests before the real test',
  'Accept small mistakes and keep driving safely'
];

export const MAIN_WORRIES = [
  'Roundabouts',
  'Manoeuvres',
  'Independent driving',
  'Examiner watching me',
  'Making mistakes',
  'Forgetting instructions',
  'Test routes',
  'Dual carriageways',
  'Meeting traffic',
  'Parking',
  'Other'
];

export const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Very nervous' },
  { value: 2, label: 'Nervous' },
  { value: 3, label: 'Unsure' },
  { value: 4, label: 'Fairly confident' },
  { value: 5, label: 'Very confident' }
];

export function getEmptyNerveForm() {
  return {
    calm_plan: '',
    checklist_items: [],
    nerve_confidence_rating: 0,
    main_test_worries: [],
    nerve_control_plan: ''
  };
}

export function isNervePlanComplete(form) {
  return !!(
    form.nerve_confidence_rating > 0 ||
    form.main_test_worries?.length > 0 ||
    form.nerve_control_plan?.trim() ||
    form.calm_plan?.trim() ||
    form.checklist_items?.length > 0
  );
}