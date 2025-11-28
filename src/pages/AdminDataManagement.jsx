import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Trash2, 
  Users, 
  Calendar, 
  BookOpen, 
  ClipboardList,
  GraduationCap,
  FolderOpen,
  Loader2,
  AlertTriangle
} from 'lucide-react';

const dataEntities = [
  { 
    key: 'Pupil', 
    name: 'Pupils', 
    icon: Users, 
    description: 'All pupil records and their information',
    color: 'text-blue-600 bg-blue-100'
  },
  { 
    key: 'Lesson', 
    name: 'Lessons', 
    icon: Calendar, 
    description: 'All scheduled and completed lessons',
    color: 'text-teal-600 bg-teal-100'
  },
  { 
    key: 'DiaryEntry', 
    name: 'Diary Entries', 
    icon: BookOpen, 
    description: 'All lesson feedback and diary notes',
    color: 'text-purple-600 bg-purple-100'
  },
  { 
    key: 'Skill', 
    name: 'Skills', 
    icon: GraduationCap, 
    description: 'All pupil skill tracking records',
    color: 'text-amber-600 bg-amber-100'
  },
  { 
    key: 'HomeworkItem', 
    name: 'Homework Items', 
    icon: ClipboardList, 
    description: 'All homework assignments',
    color: 'text-rose-600 bg-rose-100'
  },
  { 
    key: 'Resource', 
    name: 'Resources', 
    icon: FolderOpen, 
    description: 'All uploaded learning resources',
    color: 'text-indigo-600 bg-indigo-100'
  },
];

export default function AdminDataManagement() {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch counts for each entity
  const { data: counts = {}, refetch: refetchCounts } = useQuery({
    queryKey: ['entityCounts'],
    queryFn: async () => {
      const results = {};
      for (const entity of dataEntities) {
        const data = await base44.entities[entity.key].list();
        results[entity.key] = data.length;
      }
      return results;
    }
  });

  const handleDeleteAll = async (entityKey) => {
    setIsDeleting(true);
    try {
      const items = await base44.entities[entityKey].list();
      for (const item of items) {
        await base44.entities[entityKey].delete(item.id);
      }
      queryClient.invalidateQueries();
      refetchCounts();
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('InstructorDashboard')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Data Management</h1>
          <p className="text-slate-500 mt-1">Clear test data from specific areas of the app</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Warning</p>
            <p className="text-sm text-amber-700">Deleting data is permanent and cannot be undone. Only use this to clear test data.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {dataEntities.map((entity) => {
            const Icon = entity.icon;
            const count = counts[entity.key] || 0;
            
            return (
              <Card key={entity.key} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${entity.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{entity.name}</h3>
                        <p className="text-sm text-slate-500">{entity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">
                        {count} record{count !== 1 ? 's' : ''}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete(entity)}
                        disabled={count === 0}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {counts[confirmDelete?.key] || 0} {confirmDelete?.name?.toLowerCase()} records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteAll(confirmDelete.key)}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}