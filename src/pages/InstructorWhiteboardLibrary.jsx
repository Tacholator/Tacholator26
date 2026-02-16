import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Copy } from 'lucide-react';

export default function InstructorWhiteboardLibrary() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: boards = [] } = useQuery({
    queryKey: ['whiteboards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.WhiteboardBoard.filter({
        ownerInstructorId: user.id
      });
    },
    enabled: !!user?.id
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WhiteboardBoard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] });
      setDeleteId(null);
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id) => {
      const board = await base44.entities.WhiteboardBoard.read(id);
      const newBoard = await base44.entities.WhiteboardBoard.create({
        ownerInstructorId: user.id,
        title: `${board.title} (Copy)`,
        topicTags: board.topicTags,
        isSharedWithPupil: false,
        allowPupilNotes: false,
        stepsEnabled: false
      });
      return newBoard.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] });
    }
  });

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (board.topicTags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Whiteboard Library</h1>
            <p className="text-gray-600 mt-1">Create and manage teaching whiteboards</p>
          </div>
          <Button
            onClick={() => navigate('/InstructorWhiteboardEditor')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Whiteboard
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search boards, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Board Grid */}
        {filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No whiteboards yet</p>
            <Button
              onClick={() => navigate('/InstructorWhiteboardEditor')}
              variant="outline"
            >
              Create your first whiteboard
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map(board => (
              <Card key={board.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{board.title}</CardTitle>
                  <CardDescription>
                    {board.linkedPupilId ? 'Linked to pupil' : 'Reusable board'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tags */}
                    {board.topicTags && board.topicTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {board.topicTags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex gap-2">
                      {board.isSharedWithPupil && (
                        <Badge>Shared</Badge>
                      )}
                      {board.stepsEnabled && (
                        <Badge>Steps</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/InstructorWhiteboardEditor?boardId=${board.id}`)}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateMutation.mutate(board.id)}
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(board.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete whiteboard?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}