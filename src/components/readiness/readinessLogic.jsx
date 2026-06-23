export const NERVES_OPTIONS = [
  'Breathing techniques',
  'Mock test practice',
  'Practising difficult routes',
  'Positive self-talk',
  'Knowing what to expect on test day',
  'Other'
];

export const IMPROVEMENT_AREAS = [
  'Junctions', 'Roundabouts', 'Manoeuvres', 'Mirrors', 'Meeting traffic',
  'Dual carriageways', 'Speed control', 'Planning and awareness', 'Parking',
  'Independent driving', 'Show me/tell me questions', 'Other'
];

export function getEmptyReadinessForm() {
  return {
    independent_driving_status: '',
    independent_driving_notes: '',
    safe_driving_status: '',
    recent_faults_notes: '',
    mock_tests_passed_count: '',
    latest_mock_test_date: '',
    latest_mock_test_result: '',
    latest_mock_test_minor_faults: '',
    mock_test_independent_driving: '',
    mock_test_manoeuvres: '',
    mock_test_test_conditions: '',
    nerves_management_methods: [],
    nerves_management_plan: '',
    instructor_ready_confirmation: '',
    instructor_name: '',
    instructor_confirmation_date: '',
    instructor_comments: '',
    test_booked_status: '',
    test_date: '',
    test_time: '',
    test_centre: '',
    improvement_areas: [],
    learner_extra_notes: ''
  };
}

export function calculateReadiness(form) {
  let score = 0;

  if (form.independent_driving_status === 'Yes') score += 20;
  else if (form.independent_driving_status === 'Sometimes') score += 10;

  if (form.safe_driving_status === 'Yes, I am not making serious or dangerous mistakes') score += 25;
  else if (form.safe_driving_status === 'Not sure') score += 10;

  const mocks = parseInt(form.mock_tests_passed_count) || 0;
  if (mocks >= 2) score += 25;
  else if (mocks === 1) score += 10;

  if (form.nerves_management_methods?.length > 0) score += 10;

  if (form.instructor_ready_confirmation === 'Yes') score += 20;

  const isReady =
    form.independent_driving_status === 'Yes' &&
    form.safe_driving_status === 'Yes, I am not making serious or dangerous mistakes' &&
    mocks >= 2 &&
    form.mock_test_independent_driving === 'Yes' &&
    form.mock_test_manoeuvres === 'Yes' &&
    form.mock_test_test_conditions === 'Yes' &&
    form.nerves_management_methods?.length > 0 &&
    form.instructor_ready_confirmation === 'Yes' &&
    form.test_booked_status !== '';

  const isNotReady =
    mocks < 2 ||
    form.instructor_ready_confirmation === 'No' ||
    form.instructor_ready_confirmation === 'Not yet discussed' ||
    form.safe_driving_status === 'No, I still make serious or dangerous mistakes' ||
    form.independent_driving_status === 'No';

  let result = 'Almost Ready';
  if (isReady) result = 'Ready for Test';
  else if (isNotReady) result = 'Not Ready Yet';

  if (isReady) score = 100;

  return { score, result };
}

export function validateReadinessForm(form) {
  const e = {};
  if (!form.independent_driving_status) e.independent_driving_status = 'Please select an option';
  if (!form.safe_driving_status) e.safe_driving_status = 'Please select an option';
  if (form.mock_tests_passed_count === '' || isNaN(parseInt(form.mock_tests_passed_count))) e.mock_tests_passed_count = 'Please enter a number';
  if (parseInt(form.mock_tests_passed_count) < 0) e.mock_tests_passed_count = 'Cannot be negative';
  if (!form.instructor_ready_confirmation) e.instructor_ready_confirmation = 'Please select an option';
  if (!form.test_booked_status) e.test_booked_status = 'Please select an option';
  if (form.test_booked_status === 'Yes') {
    if (!form.test_date) e.test_date = 'Please enter your test date';
  }
  return e;
}