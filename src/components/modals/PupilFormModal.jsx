import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, User, Car, Calendar } from 'lucide-react';

const DVSA_SKILLS = [
  { code: '1', name: 'Legal responsibilities' },
  { code: '2', name: 'Safety checks' },
  { code: '3', name: 'Cockpit checks' },
  { code: '4', name: 'Vehicle security' },
  { code: '5', name: 'Controls and instruments' },
  { code: '6', name: 'Moving away and stopping' },
  { code: '7', name: 'Safe positioning' },
  { code: '8', name: 'Mirrors – vision and use' },
  { code: '9', name: 'Signals' },
  { code: '10', name: 'Anticipation and planning' },
  { code: '11', name: 'Use of speed' },
  { code: '12', name: 'Dealing with other traffic' },
  { code: '13', name: 'Eco-safe / Fuel-efficient driving' },
  { code: '14', name: 'Junctions (left and right turns)' },
  { code: '15', name: 'Roundabouts' },
  { code: '16', name: 'Pedestrian crossings' },
  { code: '17', name: 'Reversing – general control' },
  { code: '18', name: 'Turning the vehicle around' },
  { code: '19', name: 'Parking manoeuvres (including bay & parallel parking)' },
  { code: '20', name: 'Controlled stop / Emergency stop' },
  { code: '21', name: 'Country roads' },
  { code: '22', name: 'Dual carriageways' },
  { code: '23', name: 'Motorways' },
  { code: '24', name: 'Driving in the dark' },
  { code: '25', name: 'Driving in different weather conditions' },
  { code: '26', name: 'Passengers and loads' },
  { code: '27', name: 'Independent driving / Following routes & Sat Nav' }
];

export default function PupilFormModal({ open, onClose, existingPupil, onSave }) {
  const [formData, setFormData] = useState(existingPupil || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pickupAddress: '',
    preferredDaysTimes: '',
    status: 'Active',
    provisionalLicenceNumber: '',
    theoryTestDate: '',
    theoryTestNotBooked: false,
    theoryTestPassed: false,
    practicalTestDate: '',
    practicalTestTime: '',
    practicalTestNotBooked: false,
    practicalTestPassed: false,
    practicalTestCentre: '',
    targetHours: 45,
    hoursCompleted: 0,
    hourlyRate: 0,
    bulkAmountPaid: 0,
    bulkPaymentBalance: 0,
    tags: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      setActiveTab('personal'); // Switch to personal tab where required fields are
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData, !existingPupil);
      setValidationErrors({});
      onClose();
    } catch (error) {
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        setValidationErrors({ 
          duplicate: 'A pupil with this email already exists. Please use a different email address.' 
        });
        setActiveTab('personal');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            {existingPupil ? 'Edit Pupil' : 'Add New Pupil'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="gap-2">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="driving" className="gap-2">
              <Car className="w-4 h-4" />
              Driving
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2">
              <Calendar className="w-4 h-4" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              £
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            {validationErrors.duplicate && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                {validationErrors.duplicate}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                  className={validationErrors.firstName ? 'border-rose-500' : ''}
                />
                {validationErrors.firstName && (
                  <p className="text-xs text-rose-600">{validationErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Smith"
                  className={validationErrors.lastName ? 'border-rose-500' : ''}
                />
                {validationErrors.lastName && (
                  <p className="text-xs text-rose-600">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className={validationErrors.email ? 'border-rose-500' : ''}
                />
                {validationErrors.email ? (
                  <p className="text-xs text-rose-600">{validationErrors.email}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    This email will be used to link the learner's account
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="07123 456789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Textarea
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => handleChange('pickupAddress', e.target.value)}
                placeholder="123 Main Street, London"
                rows={2}
              />
            </div>


          </TabsContent>

          <TabsContent value="driving" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="provisionalLicenceNumber">Provisional Licence Number</Label>
              <Input
                id="provisionalLicenceNumber"
                value={formData.provisionalLicenceNumber}
                onChange={(e) => handleChange('provisionalLicenceNumber', e.target.value)}
                placeholder="SMITH901256AB9CD"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetHours">Target Hours</Label>
                <Input
                  id="targetHours"
                  type="number"
                  value={formData.targetHours}
                  onChange={(e) => handleChange('targetHours', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                                    <Label htmlFor="hoursCompleted">Hours Completed</Label>
                                    <Input
                                      id="hoursCompleted"
                                      type="number"
                                      inputMode="decimal"
                                      step="0.25"
                                      min="0"
                                      placeholder="e.g. 3.5"
                                      value={formData.hoursCompleted || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const numVal = parseFloat(val);
                                        if (val === '' || (!isNaN(numVal) && numVal >= 0)) {
                                          handleChange('hoursCompleted', val === '' ? 0 : numVal);
                                        }
                                      }}
                                    />
                                  </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleSheetUrl">Google Sheet URL</Label>
              <Input
                id="googleSheetUrl"
                value={formData.googleSheetUrl || ''}
                onChange={(e) => handleChange('googleSheetUrl', e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </div>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Theory Test</Label>
                            <div className="flex gap-4 mb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="theoryStatus"
                                  checked={!formData.theoryTestNotBooked && !formData.theoryTestPassed}
                                  onChange={() => handleChange('theoryTestNotBooked', false) || handleChange('theoryTestPassed', false)}
                                  className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-600">Date booked</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="theoryStatus"
                                  checked={formData.theoryTestNotBooked}
                                  onChange={() => handleChange('theoryTestNotBooked', true) || handleChange('theoryTestPassed', false) || handleChange('theoryTestDate', '')}
                                  className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-600">Not booked</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="theoryStatus"
                                  checked={formData.theoryTestPassed}
                                  onChange={() => handleChange('theoryTestPassed', true) || handleChange('theoryTestNotBooked', false) || handleChange('theoryTestDate', '')}
                                  className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-600">Passed</span>
                              </label>
                            </div>
                            {!formData.theoryTestNotBooked && !formData.theoryTestPassed && (
                              <Input
                                id="theoryTestDate"
                                type="date"
                                value={formData.theoryTestDate}
                                onChange={(e) => handleChange('theoryTestDate', e.target.value)}
                              />
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Practical Test</Label>
                            <div className="flex gap-4 mb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="practicalStatus"
                                  checked={!formData.practicalTestNotBooked && !formData.practicalTestPassed}
                                  onChange={() => handleChange('practicalTestNotBooked', false) || handleChange('practicalTestPassed', false)}
                                  className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-600">Date booked</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="practicalStatus"
                                  checked={formData.practicalTestNotBooked}
                                  onChange={() => handleChange('practicalTestNotBooked', true) || handleChange('practicalTestPassed', false) || handleChange('practicalTestDate', '')}
                                  className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-600">Not booked</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="practicalStatus"
                                  checked={formData.practicalTestPassed}
                                  onChange={() => handleChange('practicalTestPassed', true) || handleChange('practicalTestNotBooked', false) || handleChange('practicalTestDate', '')}
                                  className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-600">Passed</span>
                              </label>
                            </div>
                            {!formData.practicalTestNotBooked && !formData.practicalTestPassed && (
                                                <div className="grid grid-cols-2 gap-4">
                                                  <div className="space-y-1">
                                                    <Label htmlFor="practicalTestDate" className="text-xs text-slate-500">Date</Label>
                                                    <Input
                                                      id="practicalTestDate"
                                                      type="date"
                                                      value={formData.practicalTestDate}
                                                      onChange={(e) => handleChange('practicalTestDate', e.target.value)}
                                                    />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <Label htmlFor="practicalTestTime" className="text-xs text-slate-500">Time (24hr)</Label>
                                                    <Input
                                                      id="practicalTestTime"
                                                      type="time"
                                                      value={formData.practicalTestTime || ''}
                                                      onChange={(e) => handleChange('practicalTestTime', e.target.value)}
                                                      placeholder="e.g. 14:30"
                                                    />
                                                  </div>
                                                </div>
                                              )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="practicalTestCentre">Test Centre</Label>
                            <Input
                              id="practicalTestCentre"
                              value={formData.practicalTestCentre}
                              onChange={(e) => handleChange('practicalTestCentre', e.target.value)}
                              placeholder="e.g., London Chingford"
                            />
                          </div>
                        </TabsContent>

          <TabsContent value="payments" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (£)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 35.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulkAmountPaid">Bulk Amount Paid (£)</Label>
                <Input
                  id="bulkAmountPaid"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.bulkAmountPaid || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange('bulkAmountPaid', val);
                    // Recalculate remaining balance
                    const totalHours = (formData.hoursCompleted || 0);
                    const amountUsed = totalHours * (formData.hourlyRate || 0);
                    handleChange('bulkPaymentBalance', val - amountUsed);
                  }}
                  placeholder="e.g. 350.00"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-slate-700 mb-3">Manual Adjustments</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hoursAlreadyCompleted">Hours Already Completed</Label>
                  <Input
                    id="hoursAlreadyCompleted"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.hoursCompleted || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (e.target.value === '' || (!isNaN(val) && val >= 0)) {
                        const hours = e.target.value === '' ? 0 : val;
                        handleChange('hoursCompleted', hours);
                        // Recalculate remaining balance
                        const amountUsed = hours * (formData.hourlyRate || 0);
                        handleChange('bulkPaymentBalance', (formData.bulkAmountPaid || 0) - amountUsed);
                      }
                    }}
                    placeholder="e.g. 10.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoursToDeduct">Hours to Deduct from Balance</Label>
                  <Input
                    id="hoursToDeduct"
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="e.g. 2.0"
                    onChange={(e) => {
                      const hoursToDeduct = parseFloat(e.target.value) || 0;
                      if (hoursToDeduct > 0) {
                        const newHours = (formData.hoursCompleted || 0) + hoursToDeduct;
                        handleChange('hoursCompleted', newHours);
                        // Recalculate remaining balance
                        const amountUsed = newHours * (formData.hourlyRate || 0);
                        handleChange('bulkPaymentBalance', (formData.bulkAmountPaid || 0) - amountUsed);
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Add hours to deduct (£{((formData.hourlyRate || 0)).toFixed(2)}/hr)
                  </p>
                </div>
              </div>
              
              {(formData.hourlyRate > 0 || formData.bulkAmountPaid > 0) && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Bulk Amount Paid:</span>
                    <span className="font-medium text-slate-700">£{(formData.bulkAmountPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Hours Used:</span>
                    <span className="font-medium text-slate-700">{(formData.hoursCompleted || 0).toFixed(2)} hrs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Amount Deducted:</span>
                    <span className="font-medium text-slate-700">£{((formData.hoursCompleted || 0) * (formData.hourlyRate || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-slate-700 font-medium">Remaining Balance:</span>
                    <span className={`font-bold ${(formData.bulkPaymentBalance || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      £{(formData.bulkPaymentBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving} 
            className="bg-teal-600 hover:bg-teal-700 gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {existingPupil ? 'Update Pupil' : 'Add Pupil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DVSA_SKILLS };