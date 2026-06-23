import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Car, Brain, Trophy, Calendar, User, Target, Shield, Info
} from 'lucide-react';
import { NERVES_OPTIONS, IMPROVEMENT_AREAS } from './readinessLogic';

export function SectionCard({ icon, title, children }) {
  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FormField({ label, required, error, children, className }) {
  return (
    <div className={className}>
      <Label className={`text-sm font-medium text-slate-700 mb-1 block ${required ? "after:content-['*'] after:text-rose-500 after:ml-1" : ''}`}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export function YesNoField({ label, value, onChange, fieldId }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 block mb-1">{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        {['Yes', 'No'].map(opt => (
          <div key={opt} className="flex items-center gap-2">
            <RadioGroupItem value={opt} id={`${fieldId}_${opt}`} />
            <Label htmlFor={`${fieldId}_${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function ReadinessFormSections({ form, setField, toggleArrayItem, errors }) {
  return (
    <>
      {/* Section 1 */}
      <SectionCard icon={<Car className="w-5 h-5 text-[#F7B602]" />} title="Section 1: Independent Driving">
        <FormField label="Can the pupil drive consistently, confidently and independently without prompts?" required error={errors.independent_driving_status}>
          <RadioGroup value={form.independent_driving_status} onValueChange={v => setField('independent_driving_status', v)} className="space-y-2 mt-2">
            {['Yes', 'No', 'Sometimes'].map(opt => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`idrive_${opt}`} />
                <Label htmlFor={`idrive_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </FormField>
      </SectionCard>

      {/* Section 2 */}
      <SectionCard icon={<Shield className="w-5 h-5 text-[#F7B602]" />} title="Section 2: Serious or Dangerous Mistakes">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">To be test ready, the pupil should not be making serious or dangerous faults. One serious or dangerous fault can result in a driving test fail.</p>
        </div>
        <FormField label="Is the pupil currently avoiding serious or dangerous mistakes during lessons?" required error={errors.safe_driving_status}>
          <RadioGroup value={form.safe_driving_status} onValueChange={v => setField('safe_driving_status', v)} className="space-y-2 mt-2">
            {[
              'Yes, I am not making serious or dangerous mistakes',
              'No, I still make serious or dangerous mistakes',
              'Not sure'
            ].map(opt => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`safe_${opt}`} />
                <Label htmlFor={`safe_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </FormField>
      </SectionCard>

      {/* Section 3 */}
      <SectionCard icon={<Trophy className="w-5 h-5 text-[#F7B602]" />} title="Section 3: Mock Test Results">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="How many mock driving tests has the pupil passed?" required error={errors.mock_tests_passed_count}>
            <Input type="number" min={0} value={form.mock_tests_passed_count} onChange={e => setField('mock_tests_passed_count', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Date of most recent mock test">
            <Input type="date" value={form.latest_mock_test_date} onChange={e => setField('latest_mock_test_date', e.target.value)} />
          </FormField>
          <FormField label="Result of most recent mock test">
            <RadioGroup value={form.latest_mock_test_result} onValueChange={v => setField('latest_mock_test_result', v)} className="flex gap-4 mt-1">
              {['Pass', 'Fail'].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`mock_result_${opt}`} />
                  <Label htmlFor={`mock_result_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
          <FormField label="Number of driving faults/minors in most recent mock">
            <Input type="number" min={0} value={form.latest_mock_test_minor_faults} onChange={e => setField('latest_mock_test_minor_faults', e.target.value)} placeholder="0" />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <YesNoField label="Did the mock include independent driving?" value={form.mock_test_independent_driving} onChange={v => setField('mock_test_independent_driving', v)} fieldId="mock_idrive" />
          <YesNoField label="Did the mock include manoeuvres?" value={form.mock_test_manoeuvres} onChange={v => setField('mock_test_manoeuvres', v)} fieldId="mock_man" />
          <YesNoField label="Did the mock use test-style conditions?" value={form.mock_test_test_conditions} onChange={v => setField('mock_test_test_conditions', v)} fieldId="mock_cond" />
        </div>
      </SectionCard>

      {/* Section 4 */}
      <SectionCard icon={<Brain className="w-5 h-5 text-[#F7B602]" />} title="Section 4: Managing Nerves">
        <FormField label="Has the pupil practised ways to manage nerves before and during the test?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {NERVES_OPTIONS.map(opt => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox id={`nerve_${opt}`} checked={form.nerves_management_methods.includes(opt)} onCheckedChange={() => toggleArrayItem('nerves_management_methods', opt)} />
                <Label htmlFor={`nerve_${opt}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
              </div>
            ))}
          </div>
        </FormField>
      </SectionCard>

      {/* Section 5 */}
      <SectionCard icon={<User className="w-5 h-5 text-[#F7B602]" />} title="Section 5: Instructor Confirmation">
        <FormField label="Has the instructor confirmed that the pupil is ready for their practical driving test?" required error={errors.instructor_ready_confirmation}>
          <RadioGroup value={form.instructor_ready_confirmation} onValueChange={v => setField('instructor_ready_confirmation', v)} className="space-y-2 mt-2">
            {['Yes', 'No', 'Not yet discussed'].map(opt => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`instr_${opt}`} />
                <Label htmlFor={`instr_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <FormField label="Date instructor confirmed readiness (optional)">
            <Input type="date" value={form.instructor_confirmation_date} onChange={e => setField('instructor_confirmation_date', e.target.value)} />
          </FormField>
        </div>
      </SectionCard>

      {/* Section 6 */}
      <SectionCard icon={<Calendar className="w-5 h-5 text-[#F7B602]" />} title="Section 6: Test Booking Details">
        <FormField label="Does the pupil already have a practical test booked?" required error={errors.test_booked_status}>
          <RadioGroup value={form.test_booked_status} onValueChange={v => setField('test_booked_status', v)} className="flex gap-6 mt-2">
            {['Yes', 'No'].map(opt => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`booked_${opt}`} />
                <Label htmlFor={`booked_${opt}`} className="font-normal cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </FormField>
        {form.test_booked_status === 'Yes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <FormField label="Test date" required error={errors.test_date}>
              <Input type="date" value={form.test_date} onChange={e => setField('test_date', e.target.value)} />
            </FormField>
          </div>
        )}
      </SectionCard>

      {/* Section 7 */}
      <SectionCard icon={<Target className="w-5 h-5 text-[#F7B602]" />} title="Section 7: Learner Reflection">
        <FormField label="What areas does the pupil still need to improve before their test?">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {IMPROVEMENT_AREAS.map(area => (
              <div key={area} className="flex items-center gap-2">
                <Checkbox
                  id={`imp_${area}`}
                  checked={form.improvement_areas.includes(area)}
                  onCheckedChange={() => {
                    const current = form.improvement_areas || [];
                    const next = current.includes(area)
                      ? current.filter(v => v !== area)
                      : [...current.filter(v => v !== 'None'), area];
                    setField('improvement_areas', next);
                  }}
                />
                <Label htmlFor={`imp_${area}`} className="font-normal cursor-pointer text-sm">{area}</Label>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Checkbox
                id="imp_none"
                checked={form.improvement_areas.includes('None')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setField('improvement_areas', ['None']);
                  } else {
                    setField('improvement_areas', form.improvement_areas.filter(a => a !== 'None'));
                  }
                }}
              />
              <Label htmlFor="imp_none" className="font-medium cursor-pointer text-sm text-[#071739]">None — no areas need improvement</Label>
            </div>
          </div>
        </FormField>
      </SectionCard>
    </>
  );
}