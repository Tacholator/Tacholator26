import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye, EyeOff, Clock } from 'lucide-react';
import moment from 'moment';

const modules = {
  toolbar: [
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image'],
    ['blockquote', 'code-block'],
    ['clean']
  ]
};

const formats = [
  'font', 'size', 'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list', 'bullet', 'indent',
  'link', 'image',
  'blockquote', 'code-block'
];

export default function MaterialEditor({ 
  initialContent, 
  initialTitle,
  initialVisibility,
  lastSavedAt,
  onSave, 
  isSaving 
}) {
  const [content, setContent] = useState(initialContent || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [isVisibleToPupils, setIsVisibleToPupils] = useState(initialVisibility || false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutosave, setLastAutosave] = useState(null);
  const autosaveRef = useRef(null);

  useEffect(() => {
    setContent(initialContent || '');
    setTitle(initialTitle || '');
    setIsVisibleToPupils(initialVisibility || false);
    setHasUnsavedChanges(false);
  }, [initialContent, initialTitle, initialVisibility]);

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
  }, [content, title, isVisibleToPupils, hasUnsavedChanges]);

  const handleContentChange = (value) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleVisibilityChange = (checked) => {
    setIsVisibleToPupils(checked);
    setHasUnsavedChanges(true);
  };

  const handleSave = (isAutosave = false) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    onSave({ content, title, isVisibleToPupils });
    setHasUnsavedChanges(false);
    if (isAutosave) setLastAutosave(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <Label htmlFor="materialTitle" className="text-sm text-slate-500 mb-1 block">Material Title (optional)</Label>
          <Input
            id="materialTitle"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g., My notes on Legal Responsibilities"
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isVisibleToPupils}
              onCheckedChange={handleVisibilityChange}
              id="visibility"
            />
            <Label htmlFor="visibility" className="text-sm cursor-pointer flex items-center gap-1">
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
        </div>
      </div>

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

      <div className="flex items-center justify-between">
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