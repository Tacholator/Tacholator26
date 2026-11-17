import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function VideoLinkAdder({ onAdd }) {
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setUrl('');
  };

  return (
    <div className="flex gap-2">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube, Vimeo, or direct video URL"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button type="button" variant="outline" onClick={handleAdd} disabled={!url.trim()}>
        <Plus className="w-4 h-4" />
        Add
      </Button>
    </div>
  );
}