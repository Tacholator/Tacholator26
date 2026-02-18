import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateTestRouteAreaModal({ open, onOpenChange, onSubmit, isLoading }) {
  const [centreName, setCentreName] = useState('');
  const [subLocation, setSubLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ centreName, subLocation });
    setCentreName('');
    setSubLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Test Route Area</DialogTitle>
          <DialogDescription>
            Add a new test centre area to configure routes for
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="centreName">Test Centre Name</Label>
              <Input
                id="centreName"
                value={centreName}
                onChange={(e) => setCentreName(e.target.value)}
                placeholder="e.g., Basingstoke"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subLocation">Sub-Location</Label>
              <Input
                id="subLocation"
                value={subLocation}
                onChange={(e) => setSubLocation(e.target.value)}
                placeholder="e.g., Brighton Hill"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !centreName || !subLocation}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              {isLoading ? 'Creating...' : 'Create Area'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}