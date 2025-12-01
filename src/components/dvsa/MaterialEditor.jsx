import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['blockquote', 'code-block'],
    ['clean']
  ]
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
  'align',
  'link', 'image',
  'blockquote', 'code-block'
];

export default function MaterialEditor({ initialContent, onSave, isSaving }) {
  const [content, setContent] = useState(initialContent || '');

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Write your learning material here..."
          style={{ minHeight: '400px' }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => onSave(content)}
          disabled={isSaving}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Material
        </Button>
      </div>
    </div>
  );
}