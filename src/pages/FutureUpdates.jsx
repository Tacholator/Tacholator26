import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FutureUpdates() {
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'planned',
    category: ''
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['futureUpdates'],
    queryFn: () => base44.entities.FutureUpdateItem.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FutureUpdateItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['futureUpdates']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FutureUpdateItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['futureUpdates']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FutureUpdateItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['futureUpdates']);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'planned',
      category: ''
    });
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      priority: item.priority,
      status: item.status,
      category: item.category || ''
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          Access denied. This page is only for administrators.
        </div>
      </div>
    );
  }

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    planned: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to={createPageUrl('AdminDashboard')}>
        <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Button>
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Future Updates</h1>
        <p className="text-gray-600 mt-1">Plan and track upcoming features and improvements</p>
      </div>

      {/* Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {editingItem ? 'Edit Update Item' : 'Add New Update Item'}
            {editingItem && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Update title"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., UI, Backend, Feature"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
              {editingItem && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No future updates planned yet. Add your first item above!
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <Badge className={priorityColors[item.priority]}>
                        {item.priority}
                      </Badge>
                      <Badge className={statusColors[item.status]}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{item.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(item.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}