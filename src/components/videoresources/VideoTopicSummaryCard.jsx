import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Video, Pencil, Trash2, ChevronRight } from 'lucide-react';

export default function VideoTopicSummaryCard({ topic, videos, onToggleAll, onRename, onDelete }) {
  const navigate = useNavigate();
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTopic, setNewTopic] = useState(topic);

  const count = videos.length;
  const allVisible = count > 0 && videos.every((v) => v.visibleToPupils);

  const openTopic = () =>
    navigate(`/InstructorVideoTopicDetail?topic=${encodeURIComponent(topic)}`);

  const saveRename = () => {
    const trimmed = newTopic.trim();
    if (trimmed && trimmed !== topic) onRename(trimmed);
    setRenameOpen(false);
  };

  return (
    <>
      <Card
        onClick={openTopic}
        className="cursor-pointer border-t-4 border-t-[#F7B602] shadow-sm hover:shadow-md transition-shadow"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F7B602]/20 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-[#071739]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[#071739] truncate">{topic}</p>
              <p className="text-xs text-slate-500">
                {count} video{count !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>

          <div
            className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Switch checked={allVisible} onCheckedChange={onToggleAll} />
            <span
              className={`text-xs font-medium ${
                allVisible ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {allVisible ? 'Visible to pupils' : 'Hidden from pupils'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewTopic(topic);
                  setRenameOpen(true);
                }}
                className="text-slate-500 hover:text-[#071739]"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-rose-500 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="renameTopic">Topic name</Label>
            <Input
              id="renameTopic"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveRename()}
            />
            <p className="text-xs text-slate-500">
              Applies to all {count} video{count !== 1 ? 's' : ''} in this topic.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRename} className="bg-[#071739] hover:bg-[#0a2142]">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}