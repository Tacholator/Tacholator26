import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, User, Car, Calendar, Phone, CreditCard } from 'lucide-react';

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
    dateOfBirth: '',
    email: '',
    phone: '',
    pickupAddress: '',
    preferredDaysTimes: '',
    status: 'Lead',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    medicalConditions: '',
    wearsGlasses: false,
    previousExperience: 'None',
    previousHours: 0,
    howHeardAboutUs: '',
    provisionalLicenceNumber: '',
    provisionalLicenceExpiry: '',
    theoryTestDate: '',
    theoryTestPassed: false,
    practicalTestDate: '',
    practicalTestCentre: '',
    targetHours: 45,
    hoursCompleted: 0,
    pricePerHour: '',
    paymentMethod: 'Cash',
    notes: '',
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="gap-1 text-xs">
              <User className="w-3 h-3" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="emergency" className="gap-1 text-xs">
              <Phone className="w-3 h-3" />
              Emergency
            </TabsTrigger>
            <TabsTrigger value="driving" className="gap-1 text-xs">
              <Car className="w-3 h-3" />
              Driving
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1 text-xs">
              <CreditCard className="w-3 h-3" />
              Billing
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
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
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
              <Label htmlFor="howHeardAboutUs">How did they hear about you?</Label>
              <Input
                id="howHeardAboutUs"
                value={formData.howHeardAboutUs}
                onChange={(e) => handleChange('howHeardAboutUs', e.target.value)}
                placeholder="e.g., Google, Referral, Social Media"
              />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 mt-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800">Emergency contact details are important for safety during lessons.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                placeholder="Jane Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                  placeholder="07123 456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelation">Relationship</Label>
                <Input
                  id="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => handleChange('emergencyContactRelation', e.target.value)}
                  placeholder="e.g., Parent, Partner, Sibling"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-slate-700 mb-3">Medical Information</h4>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea
                  id="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={(e) => handleChange('medicalConditions', e.target.value)}
                  placeholder="Any conditions that may affect driving (e.g., diabetes, epilepsy, anxiety)"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="wearsGlasses"
                  checked={formData.wearsGlasses}
                  onCheckedChange={(checked) => handleChange('wearsGlasses', checked)}
                />
                <Label htmlFor="wearsGlasses" className="font-normal cursor-pointer">
                  Wears glasses or contact lenses for driving
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="driving" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provisionalLicenceNumber">Provisional Licence Number</Label>
                <Input
                  id="provisionalLicenceNumber"
                  value={formData.provisionalLicenceNumber}
                  onChange={(e) => handleChange('provisionalLicenceNumber', e.target.value)}
                  placeholder="SMITH901256AB9CD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provisionalLicenceExpiry">Licence Expiry Date</Label>
                <Input
                  id="provisionalLicenceExpiry"
                  type="date"
                  value={formData.provisionalLicenceExpiry}
                  onChange={(e) => handleChange('provisionalLicenceExpiry', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-slate-700 mb-3">Previous Experience</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previousExperience">Experience Level</Label>
                  <Select value={formData.previousExperience} onValueChange={(v) => handleChange('previousExperience', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">No Previous Experience</SelectItem>
                      <SelectItem value="Some Private Practice">Some Private Practice</SelectItem>
                      <SelectItem value="Previous Lessons">Previous Lessons with Instructor</SelectItem>
                      <SelectItem value="International Licence">International Licence Holder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previousHours">Previous Hours (if any)</Label>
                  <Input
                    id="previousHours"
                    type="number"
                    value={formData.previousHours}
                    onChange={(e) => handleChange('previousHours', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-slate-700 mb-3">Training Progress</h4>
              
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleSheetUrl">Google Sheet URL (optional)</Label>
              <Input
                id="googleSheetUrl"
                value={formData.googleSheetUrl || ''}
                onChange={(e) => handleChange('googleSheetUrl', e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </div>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800">Keep track of theory and practical test dates and results.</p>
            </div>

            <h4 className="font-medium text-slate-700">Theory Test</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theoryTestDate">Theory Test Date</Label>
                <Input
                  id="theoryTestDate"
                  type="date"
                  value={formData.theoryTestDate}
                  onChange={(e) => handleChange('theoryTestDate', e.target.value)}
                />
              </div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="theoryTestPassed"
                    checked={formData.theoryTestPassed}
                    onCheckedChange={(checked) => handleChange('theoryTestPassed', checked)}
                  />
                  <Label htmlFor="theoryTestPassed" className="font-normal cursor-pointer">
                    Theory Test Passed
                  </Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-slate-700 mb-3">Practical Test</h4>
              
              <div className="space-y-2">
                <Label htmlFor="practicalTestDate">Practical Test Date</Label>
                <Input
                  id="practicalTestDate"
                  type="date"
                  value={formData.practicalTestDate}
                  onChange={(e) => handleChange('practicalTestDate', e.target.value)}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="practicalTestCentre">Test Centre</Label>
                <Input
                  id="practicalTestCentre"
                  value={formData.practicalTestCentre}
                  onChange={(e) => handleChange('practicalTestCentre', e.target.value)}
                  placeholder="e.g., London Chingford"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price Per Hour (£)</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  value={formData.pricePerHour}
                  onChange={(e) => handleChange('pricePerHour', parseFloat(e.target.value) || '')}
                  placeholder="35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(v) => handleChange('paymentMethod', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Block Booking">Block Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes about this pupil..."
                  rows={4}
                />
              </div>
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