import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function ReadinessSummary({ form, result }) {
  const { positives, concerns } = generateReadinessSummary(form, result);

  return (
    <div className="space-y-4">
      {positives.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> What's going well
          </p>
          <ul className="space-y-1.5">
            {positives.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {concerns.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Areas to address
          </p>
          <ul className="space-y-1.5">
            {concerns.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function generateReadinessSummary(form, result) {
  const positives = [];
  const concerns = [];
  const mocks = parseInt(form.mock_tests_passed_count) || 0;

  // Independent driving
  if (form.independent_driving_status === 'Yes') {
    positives.push('You can drive consistently and independently without prompts from your instructor.');
  } else if (form.independent_driving_status === 'Sometimes') {
    concerns.push('You can only drive independently sometimes — aim for consistent independent driving before your test.');
  } else if (form.independent_driving_status === 'No') {
    concerns.push('You are not yet driving independently without prompts, which is a key requirement for test readiness.');
  }

  // Serious mistakes
  if (form.safe_driving_status === 'Yes, I am not making serious or dangerous mistakes') {
    positives.push('You are avoiding serious or dangerous mistakes during your lessons.');
  } else if (form.safe_driving_status === 'No, I still make serious or dangerous mistakes') {
    concerns.push('You are still making serious or dangerous mistakes, which would result in a test fail.');
  } else if (form.safe_driving_status === 'Not sure') {
    concerns.push('You are unsure whether you are making serious or dangerous mistakes — discuss this with your instructor.');
  }

  // Mock tests
  if (mocks >= 2) {
    positives.push(`You have passed ${mocks} mock driving test${mocks > 1 ? 's' : ''}, meeting the recommended minimum.`);
  } else if (mocks === 1) {
    concerns.push('You have only passed 1 mock test — DVSA guidance suggests passing at least 2 before taking your practical test.');
  } else {
    concerns.push('You have not yet passed any mock tests — aim to pass at least 2 before booking your practical test.');
  }

  if (form.latest_mock_test_result === 'Fail') {
    concerns.push('Your most recent mock test resulted in a fail — review the faults with your instructor.');
  } else if (form.latest_mock_test_result === 'Pass' && mocks >= 1) {
    positives.push('Your most recent mock test was a pass.');
  }

  // Nerves management
  if (form.nerves_management_methods?.length > 0) {
    positives.push(`You have practised strategies to manage test nerves (${form.nerves_management_methods.join(', ').toLowerCase()}).`);
  } else {
    concerns.push('You have not yet practised strategies to manage test-day nerves.');
  }

  // Instructor confirmation
  if (form.instructor_ready_confirmation === 'Yes') {
    positives.push("Your instructor has confirmed that you are ready for your practical test.");
  } else if (form.instructor_ready_confirmation === 'No') {
    concerns.push("Your instructor has not yet confirmed that you are ready for your test.");
  } else if (form.instructor_ready_confirmation === 'Not yet discussed') {
    concerns.push("You have not yet discussed your readiness with your instructor.");
  }

  // Improvement areas
  if (form.improvement_areas?.length > 0) {
    concerns.push(`You have identified areas to improve: ${form.improvement_areas.join(', ')}.`);
  }

  // Test booking
  if (form.test_booked_status === 'Yes' && form.test_date) {
    positives.push(`You have a practical test booked for ${new Date(form.test_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
  }

  // Overall summary sentence
  return { positives, concerns };
}