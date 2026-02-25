import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

export default function TestCentreFormModal({ open, onClose, testCentre }) {
  const [formData, setFormData] = useState({
    name: '',
    town: '',
    postcode: '',
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (testCentre) {
      setFormData({
        name: testCentre.name || '',
        town: testCentre.town || '',
        postcode: testCentre.postcode || '',
        isActive: testCentre.isActive !== undefined ? testCentre.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        town: '',
        postcode: '',
        isActive: true,
      });
    }
  }, [testCentre, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (testCentre) {
        return base44.entities.TestCentre.update(testCentre.id, data);
      } else {
        return base44.entities.TestCentre.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testCentres']);
      toast({ title: testCentre ? 'Test centre updated successfully' : 'Test centre created successfully' });
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{testCentre ? 'Edit Test Centre' : 'Create New Test Centre'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Test Centre Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., London - Barnet"
              required
            />
          </div>

          <div>
            <Label htmlFor="town">Town/City</Label>
            <Input
              id="town"
              value={formData.town}
              onChange={(e) => setFormData({ ...formData, town: e.target.value })}
              placeholder="e.g., London"
              required
            />
          </div>

          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              placeholder="e.g., EN5 4HA"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Test centre is active</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : (testCentre ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}