import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { drivingSkillsSections } from '@/components/progress/drivingSkillsData';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

export default function TopicDurationSelector({ 
  selectedTopics, 
  onChange, 
  totalLessonMinutes,
  disabled = false 
}) {
  const [showCustomTopicInput, setShowCustomTopicInput] = useState(false);
  const [customTopicName, setCustomTopicName] = useState('');

  // Build comprehensive topic list from driving skills data
  const buildTopicsList = () => {
    const topics = [];
    
    // Add all skills from drivingSkillsSections
    drivingSkillsSections.forEach(section => {
      section.topics.forEach(topic => {
        if (topic.type === 'skill') {
          topics.push({ id: topic.id, name: topic.label, category: section.title });
        } else if (topic.type === 'group' && topic.subtopics) {
          topic.subtopics.forEach(subtopic => {
            if (subtopic.type === 'skill') {
              topics.push({ id: subtopic.id, name: subtopic.label, category: `${section.title} - ${topic.label}` });
            } else if (subtopic.type === 'group' && subtopic.subtopics) {
              subtopic.subtopics.forEach(subsubtopic => {
                if (subsubtopic.type === 'skill') {
                  topics.push({ id: subsubtopic.id, name: subsubtopic.label, category: `${section.title} - ${topic.label} - ${subtopic.label}` });
                }
              });
            }
          });
        }
      });
    });

    // Add coursework topics
    courseWorkTopics.forEach(topic => {
      if (!topics.find(t => t.id === topic.topicId)) {
        topics.push({ id: topic.topicId, name: topic.title, category: 'Theory Topics' });
      }
    });

    return topics;
  };

  const availableTopics = buildTopicsList();

  const handleAddTopic = (topicId) => {
    if (!topicId || selectedTopics.some(t => t.topicId === topicId)) return;
    
    const topic = availableTopics.find(t => t.id === topicId);
    if (!topic) return;

    const newTopic = {
      topicId: topic.id,
      topicName: topic.name,
      durationMinutes: 15 // Default to 15 minutes
    };

    onChange([...selectedTopics, newTopic]);
  };

  const handleAddCustomTopic = () => {
    if (!customTopicName.trim()) return;
    
    const customId = `custom_${Date.now()}`;
    const newTopic = {
      topicId: customId,
      topicName: customTopicName.trim(),
      durationMinutes: 15
    };

    onChange([...selectedTopics, newTopic]);
    setCustomTopicName('');
    setShowCustomTopicInput(false);
  };

  const handleRemoveTopic = (index) => {
    const updated = selectedTopics.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleDurationChange = (index, minutes) => {
    const updated = [...selectedTopics];
    updated[index].durationMinutes = parseInt(minutes) || 0;
    onChange(updated);
  };

  const getTotalMinutes = () => {
    return selectedTopics.reduce((sum, topic) => sum + (topic.durationMinutes || 0), 0);
  };

  const getRemainingMinutes = () => {
    return totalLessonMinutes - getTotalMinutes();
  };

  // Generate duration options in 15-minute intervals up to lesson duration
  const durationOptions = [];
  for (let i = 15; i <= totalLessonMinutes; i += 15) {
    durationOptions.push(i);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Topics Covered *</Label>
        <p className="text-xs text-slate-500 mt-1">
          Select all topics covered and assign time to each (in 15-minute intervals)
        </p>
      </div>

      {/* Selected topics list */}
      {selectedTopics.length > 0 && (
        <div className="space-y-2">
          {selectedTopics.map((topic, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-800">{topic.topicName}</p>
              </div>
              <Select
                value={topic.durationMinutes.toString()}
                onValueChange={(value) => handleDurationChange(index, value)}
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(minutes => (
                    <SelectItem key={minutes} value={minutes.toString()}>
                      {minutes} mins
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTopic(index)}
                  className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Time allocation summary */}
      {selectedTopics.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="text-slate-700">
            <strong>Time allocated:</strong> {getTotalMinutes()} / {totalLessonMinutes} minutes
          </span>
          {getRemainingMinutes() !== 0 && (
            <span className={getRemainingMinutes() < 0 ? 'text-rose-600 font-medium' : 'text-blue-600'}>
              {getRemainingMinutes() > 0 ? `${getRemainingMinutes()} mins remaining` : `${Math.abs(getRemainingMinutes())} mins over`}
            </span>
          )}
        </div>
      )}

      {/* Add topic selector */}
      {!disabled && (
        <div className="space-y-2">
          <Select onValueChange={handleAddTopic}>
            <SelectTrigger>
              <SelectValue placeholder="Add a topic..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {availableTopics
                .filter(topic => !selectedTopics.some(st => st.topicId === topic.id))
                .map(topic => (
                  <SelectItem key={topic.id} value={topic.id}>
                    <div className="flex flex-col">
                      <span>{topic.name}</span>
                      <span className="text-xs text-slate-500">{topic.category}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Custom topic input */}
          {!showCustomTopicInput ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomTopicInput(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Topic
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom topic name..."
                value={customTopicName}
                onChange={(e) => setCustomTopicName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTopic()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomTopic}
                disabled={!customTopicName.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomTopicInput(false);
                  setCustomTopicName('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}