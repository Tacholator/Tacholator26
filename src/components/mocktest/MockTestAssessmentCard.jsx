import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, CheckCircle2, Square, CheckSquare } from "lucide-react";
import { RATINGS, QUICK_COMMENTS, getRatingInfo, isSubcategoryHidden } from "./mockTestData";
import { Badge } from "@/components/ui/badge";

function RatingButton({ value, current, onSelect }) {
  const info = RATINGS.find(r => r.value === value);
  const isSelected = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      title={info?.title}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-xs font-bold border-2 transition-all duration-150
        ${isSelected ? `${info?.color} border-transparent shadow-md scale-105` : `bg-white ${info?.border} ${info?.text} hover:opacity-80`}`}
    >
      {value}
    </button>
  );
}

function SubcategoryRow({ subcategory, item, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const currentRating = item?.rating || "NT";
  const faultCount = item?.faultCount || 1;
  const ratingInfo = getRatingInfo(currentRating);
  const hasFaultRating = currentRating !== "NT" && currentRating !== "P";

  const handleCommentChip = (chip) => {
    const existing = item?.comments || "";
    const newComment = existing ? `${existing}. ${chip}` : chip;
    onUpdate({ comments: newComment });
    setShowChips(false);
  };

  return (
    <div className={`rounded-xl border p-3 mb-2 transition-all ${currentRating !== "NT" ? ratingInfo.bg : "bg-white border-slate-100"}`}>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-medium text-slate-700">{subcategory}</span>
        <div className="flex gap-1 items-center">
          {RATINGS.map(r => (
            <RatingButton key={r.value} value={r.value} current={currentRating} onSelect={(v) => onUpdate({ rating: v, faultCount: v === "NT" || v === "P" ? 1 : faultCount })} />
          ))}
          {hasFaultRating && (
            <div className="flex items-center gap-1 ml-1 bg-white border-2 border-slate-200 rounded-lg px-1">
              <button
                type="button"
                onClick={() => onUpdate({ faultCount: Math.max(1, faultCount - 1) })}
                className="w-6 h-7 text-slate-500 hover:text-slate-800 font-bold text-base leading-none"
              >
                −
              </button>
              <span className="min-w-[18px] text-center text-sm font-bold text-slate-700">{faultCount}</span>
              <button
                type="button"
                onClick={() => onUpdate({ faultCount: faultCount + 1 })}
                className="w-6 h-7 text-slate-500 hover:text-slate-800 font-bold text-base leading-none"
              >
                +
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setShowComments(!showComments); setShowChips(false); }}
          className={`ml-1 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-all ${
            showComments
              ? "bg-[#071739] text-white border-[#071739]"
              : item?.comments
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
          }`}
          title="Add comment"
        >
          <MessageSquarePlus className="w-3 h-3" />
          {item?.comments ? "Comment" : "Add Comment"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Add comment..."
            value={item?.comments || ""}
            onChange={e => onUpdate({ comments: e.target.value })}
            className="text-sm min-h-[60px] resize-none"
            rows={2}
          />
          <button
            type="button"
            onClick={() => setShowChips(!showChips)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showChips ? "Hide quick comments" : "+ Quick comments"}
          </button>
          {showChips && (
            <div className="flex flex-wrap gap-1 mt-1">
              {QUICK_COMMENTS.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCommentChip(chip)}
                  className="text-xs bg-slate-100 hover:bg-blue-100 text-slate-700 px-2 py-1 rounded-full border border-slate-200 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManoeuvreGroups({ category, manoeuvreGroups, items, onUpdateItem }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  const toggleGroup = (name) => {
    setSelectedGroup(prev => prev === name ? null : name);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">Select the manoeuvre that was performed:</p>
      {manoeuvreGroups.map(group => {
        const isSelected = selectedGroup === group.name;
        return (
          <div key={group.name}>
            <button
              type="button"
              onClick={() => toggleGroup(group.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-[#071739] bg-[#071739] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {isSelected
                ? <CheckSquare className="w-4 h-4 shrink-0" />
                : <Square className="w-4 h-4 shrink-0" />
              }
              {group.name}
            </button>
            {isSelected && (
              <div className="mt-2 ml-4 pl-3 border-l-2 border-[#071739]/20">
                {group.subs.map(sub => {
                  const key = `${category}__${sub}`;
                  const label = sub.replace(`${group.name} - `, "");
                  return (
                    <SubcategoryRow
                      key={key}
                      subcategory={label}
                      item={items[key]}
                      onUpdate={(updates) => onUpdateItem(key, updates)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MockTestAssessmentCard({ category, subcategories, items, transmissionType, onUpdateItem, manoeuvreGroups }) {
  const visibleSubs = subcategories.filter(sub => !isSubcategoryHidden(sub, transmissionType));
  const rated = visibleSubs.filter(sub => {
    const key = `${category}__${sub}`;
    return items[key]?.rating && items[key].rating !== "NT";
  });

  const hasFaults = visibleSubs.some(sub => {
    const key = `${category}__${sub}`;
    const r = items[key]?.rating;
    return r === "DF" || r === "S" || r === "D";
  });

  const hasSerious = visibleSubs.some(sub => {
    const key = `${category}__${sub}`;
    const r = items[key]?.rating;
    return r === "S" || r === "D";
  });

  return (
    <Card className={`mb-3 border-2 transition-all ${hasSerious ? "border-orange-300" : hasFaults ? "border-yellow-300" : "border-slate-100"}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-[#071739]">{category}</CardTitle>
            {!manoeuvreGroups && rated.length > 0 && (
              <Badge className="bg-[#071739] text-white text-xs">
                {rated.length}/{visibleSubs.length}
              </Badge>
            )}
            {!manoeuvreGroups && rated.length === visibleSubs.length && visibleSubs.length > 0 && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFaults && !hasSerious && <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />}
            {hasSerious && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {manoeuvreGroups ? (
          <ManoeuvreGroups
            category={category}
            manoeuvreGroups={manoeuvreGroups}
            items={items}
            onUpdateItem={onUpdateItem}
          />
        ) : (
          visibleSubs.map(sub => {
            const key = `${category}__${sub}`;
            return (
              <SubcategoryRow
                key={key}
                subcategory={sub}
                item={items[key]}
                onUpdate={(updates) => onUpdateItem(key, updates)}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}