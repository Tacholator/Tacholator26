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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AddRouteModal({ open, onOpenChange, onSubmit, isLoading, existingRouteNumbers }) {
  const [routeNumber, setRouteNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const num = parseInt(routeNumber);
    
    if (isNaN(num) || num < 1) {
      setError('Route number must be a positive number');
      return;
    }

    if (existingRouteNumbers.includes(num)) {
      setError(`Route ${num} already exists`);
      return;
    }

    onSubmit({ routeNumber: num, routeName });
    setRouteNumber('');
    setRouteName('');
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setRouteNumber('');
      setRouteName('');
      setError('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Route</DialogTitle>
          <DialogDescription>
            Add a new route with a custom route number
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="routeNumber">Route Number</Label>
              <Input
                id="routeNumber"
                type="number"
                min="1"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                placeholder="e.g., 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeName">Route Name</Label>
              <Input
                id="routeName"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Route 1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !routeNumber || !routeName}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
            >
              {isLoading ? 'Adding...' : 'Add Route'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}