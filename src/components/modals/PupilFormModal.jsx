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
    practicalTestNotBooked: false,
    practicalTestPassed: false,
    practicalTestCentre: '',
    targetHours: 45,
    hoursCompleted: 0,
    tags: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(formData, !existingPupil);
      onClose();
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
          <TabsList className="grid w-full grid-cols-3">
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
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Smith"
                />
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
                />
                <p className="text-xs text-slate-500">
                  This email will be used to link the learner's account
                </p>
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
                                      step="0.5"
                                      value={formData.hoursCompleted}
                                      onChange={(e) => handleChange('hoursCompleted', parseFloat(e.target.value) || 0)}
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
                              <Input
                                id="practicalTestDate"
                                type="date"
                                value={formData.practicalTestDate}
                                onChange={(e) => handleChange('practicalTestDate', e.target.value)}
                              />
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
        </Tabs>

        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !formData.firstName || !formData.lastName} 
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