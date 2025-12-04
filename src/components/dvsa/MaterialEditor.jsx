import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye, EyeOff, Clock } from 'lucide-react';
import moment from 'moment';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'color': [] }],
    ['link'],
    ['clean']
  ]
};

const formats = [
  'header',
  'bold', 'italic', 'underline',
  'color',
  'list', 'bullet', 'indent',
  'link'
];

export default function MaterialEditor({ 
  initialContent, 
  initialTitle,
  initialDescription,
  initialVisibility,
  lastSavedAt,
  onSave, 
  isSaving 
}) {
  const [content, setContent] = useState(initialContent || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [isVisibleToPupils, setIsVisibleToPupils] = useState(initialVisibility || false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutosave, setLastAutosave] = useState(null);
  const autosaveRef = useRef(null);

  useEffect(() => {
    setContent(initialContent || '');
    setTitle(initialTitle || '');
    setDescription(initialDescription || '');
    setIsVisibleToPupils(initialVisibility || false);
    setHasUnsavedChanges(false);
  }, [initialContent, initialTitle, initialDescription, initialVisibility]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (hasUnsavedChanges && content) {
      autosaveRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000);
    }
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [content, title, description, isVisibleToPupils, hasUnsavedChanges]);

  const handleContentChange = (value) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleVisibilityChange = (checked) => {
    setIsVisibleToPupils(checked);
    setHasUnsavedChanges(true);
  };

  const handleSave = (isAutosave = false) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    onSave({ content, title, description, isVisibleToPupils });
    setHasUnsavedChanges(false);
    if (isAutosave) setLastAutosave(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Topic Name */}
      <div className="space-y-2">
        <Label htmlFor="materialTitle" className="text-sm font-medium text-slate-700">Skill Topic Name</Label>
        <Input
          id="materialTitle"
          value={title}
          onChange={handleTitleChange}
          placeholder="e.g., Legal Responsibilities"
          className="w-full"
        />
      </div>

      {/* Brief Description */}
      <div className="space-y-2">
        <Label htmlFor="materialDescription" className="text-sm font-medium text-slate-700">Brief Description</Label>
        <Textarea
          id="materialDescription"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="A short description of what this skill covers..."
          rows={2}
          className="w-full"
        />
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <Switch
          checked={isVisibleToPupils}
          onCheckedChange={handleVisibilityChange}
          id="visibility"
        />
        <Label htmlFor="visibility" className="text-sm cursor-pointer flex items-center gap-2">
          {isVisibleToPupils ? (
            <>
              <Eye className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Visible to pupils</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Hidden from pupils</span>
            </>
          )}
        </Label>
      </div>

      {/* Rich Text Editor */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Study Material Content</Label>
        <div className="bg-white rounded-lg border">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            formats={formats}
            placeholder="Start writing your teaching notes for this skill here..."
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>

      {/* Footer with Save */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Unsaved changes
            </Badge>
          )}
          {lastSavedAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last saved: {moment(lastSavedAt).format('D MMM, h:mm a')}
            </span>
          )}
          {lastAutosave && !hasUnsavedChanges && (
            <span className="text-emerald-600">Autosaved</span>
          )}
        </div>
        <Button
          onClick={() => handleSave(false)}
          disabled={isSaving || !content}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Material
        </Button>
      </div>
    </div>
  );
}