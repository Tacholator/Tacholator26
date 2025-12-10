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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  AlertTriangle,
  Eye,
  X,
  Mail,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import moment from 'moment';

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
  const [confirmDeleteSingle, setConfirmDeleteSingle] = useState(null);
  const [viewEntity, setViewEntity] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const queryClient = useQueryClient();

  // Fetch data for viewing
  const { data: viewData = [], isLoading: viewLoading, refetch: refetchView } = useQuery({
    queryKey: ['viewEntityData', viewEntity?.key],
    queryFn: () => base44.entities[viewEntity.key].list(),
    enabled: !!viewEntity
  });

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
      if (viewEntity?.key === entityKey) {
        refetchView();
      }
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleDeleteSingle = async (entityKey, id) => {
    setIsDeleting(true);
    try {
      await base44.entities[entityKey].delete(id);
      queryClient.invalidateQueries();
      refetchCounts();
      refetchView();
    } finally {
      setIsDeleting(false);
      setConfirmDeleteSingle(null);
    }
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleRequestAccountDeletion = async () => {
    setIsSendingRequest(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'fasobah@gmail.com',
        subject: 'Account Deletion Request - Mobrage Tacholator',
        body: `User ${user?.full_name || user?.email} (${user?.email}) has requested to delete their Tacholator account.\n\nUser ID: ${user?.id}\nRequest Date: ${moment().format('D MMM YYYY, h:mm a')}`
      });
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 5000);
    } catch (error) {
      console.error('Failed to send deletion request:', error);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleCopyDeletionLink = () => {
    const deletionLink = `${window.location.origin}${createPageUrl('AccountDeletionRequest')}`;
    navigator.clipboard.writeText(deletionLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getDisplayValue = (item, entityKey) => {
    switch (entityKey) {
      case 'Pupil':
        return `${item.firstName} ${item.lastName}`;
      case 'Lesson':
        return `${moment(item.date).format('D MMM YYYY')} - ${item.startTime}`;
      case 'DiaryEntry':
        return `${moment(item.date).format('D MMM YYYY')} - ${item.objective || 'No objective'}`;
      case 'Skill':
        return `${item.skillName} (${item.status})`;
      case 'HomeworkItem':
        return item.title;
      case 'Resource':
        return item.title;
      default:
        return item.id;
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

        <div className="grid gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Shareable Account Deletion Link
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Copy this link to share with users who want to request account deletion
                  </p>
                  <code className="text-xs bg-white px-2 py-1 rounded border text-slate-700">
                    {window.location.origin}{createPageUrl('AccountDeletionRequest')}
                  </code>
                </div>
                <Button
                  onClick={handleCopyDeletionLink}
                  variant="outline"
                  className="gap-2 shrink-0"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-slate-50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Request Account Deletion</h3>
                  <p className="text-sm text-slate-600">
                    If you'd like to permanently delete your Tacholator account and all associated data, send a request to the admin.
                  </p>
                </div>
                <Button
                  onClick={handleRequestAccountDeletion}
                  disabled={isSendingRequest || requestSent}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shrink-0"
                >
                  {isSendingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : requestSent ? (
                    'Request Sent!'
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Request Deletion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                        onClick={() => setViewEntity(entity)}
                        disabled={count === 0}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
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

      {/* View Records Dialog */}
      <Dialog open={!!viewEntity} onOpenChange={() => setViewEntity(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewEntity && <viewEntity.icon className="w-5 h-5" />}
              {viewEntity?.name} ({viewData.length})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {viewLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : viewData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No records found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getDisplayValue(item, viewEntity?.key)}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {moment(item.created_date).format('D MMM YYYY')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteSingle({ entity: viewEntity, item })}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Single */}
      <AlertDialog open={!!confirmDeleteSingle} onOpenChange={() => setConfirmDeleteSingle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{confirmDeleteSingle && getDisplayValue(confirmDeleteSingle.item, confirmDeleteSingle.entity?.key)}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteSingle(confirmDeleteSingle.entity.key, confirmDeleteSingle.item.id)}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}