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
  { code: '1.1', name: 'Cockpit Drill' },
  { code: '2.1', name: 'Safety Checks' },
  { code: '3.1', name: 'Controls - Accelerator' },
  { code: '3.2', name: 'Controls - Clutch' },
  { code: '3.3', name: 'Controls - Gears' },
  { code: '3.4', name: 'Controls - Footbrake' },
  { code: '3.5', name: 'Controls - Handbrake' },
  { code: '3.6', name: 'Controls - Steering' },
  { code: '4.1', name: 'Moving Off Safely' },
  { code: '4.2', name: 'Moving Off Under Control' },
  { code: '4.3', name: 'Stopping Normally' },
  { code: '5.1', name: 'Normal Road Position' },
  { code: '6.1', name: 'Use of Mirrors' },
  { code: '7.1', name: 'Giving Signals' },
  { code: '8.1', name: 'Anticipation & Planning' },
  { code: '9.1', name: 'Use of Speed' },
  { code: '10.1', name: 'Approaching Junctions' },
  { code: '10.2', name: 'Turning Left' },
  { code: '10.3', name: 'Turning Right' },
  { code: '10.4', name: 'Emerging' },
  { code: '11.1', name: 'Roundabouts' },
  { code: '12.1', name: 'Pedestrian Crossings' },
  { code: '13.1', name: 'Dual Carriageways' },
  { code: '14.1', name: 'Reverse Left' },
  { code: '14.2', name: 'Reverse Right' },
  { code: '14.3', name: 'Parallel Parking' },
  { code: '14.4', name: 'Bay Parking' },
  { code: '15.1', name: 'Emergency Stop' },
  { code: '16.1', name: 'Independent Driving' }
];

export default function PupilFormModal({ open, onClose, existingPupil, onSave }) {
  const [formData, setFormData] = useState(existingPupil || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pickupAddress: '',
    preferredDaysTimes: '',
    status: 'Lead',
    provisionalLicenceNumber: '',
    theoryTestDate: '',
    practicalTestDate: '',
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                />
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

            <div className="space-y-2">
              <Label htmlFor="preferredDaysTimes">Preferred Days/Times</Label>
              <Textarea
                id="preferredDaysTimes"
                value={formData.preferredDaysTimes}
                onChange={(e) => handleChange('preferredDaysTimes', e.target.value)}
                placeholder="Weekday evenings, Saturday mornings"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="OnHold">On Hold</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
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
                  value={formData.hoursCompleted}
                  onChange={(e) => handleChange('hoursCompleted', parseInt(e.target.value))}
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
              <Label htmlFor="theoryTestDate">Theory Test Date</Label>
              <Input
                id="theoryTestDate"
                type="date"
                value={formData.theoryTestDate}
                onChange={(e) => handleChange('theoryTestDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practicalTestDate">Practical Test Date</Label>
              <Input
                id="practicalTestDate"
                type="date"
                value={formData.practicalTestDate}
                onChange={(e) => handleChange('practicalTestDate', e.target.value)}
              />
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