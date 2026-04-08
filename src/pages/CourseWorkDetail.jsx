import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Volume2, X, CheckCircle, AlertCircle, Lock, Users, Trash2, UserX, Loader2 } from 'lucide-react';
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
import SectionAudioPlayer from '@/components/learning/SectionAudioPlayer';
import CourseWorkSubcardSelect from '@/components/coursework/CourseWorkSubcardSelect';
import GoogleTTSAudioPlayer from '@/components/learning/GoogleTTSAudioPlayer';
import McqQuizPaginated from '@/components/coursework/McqQuizPaginated';
import { questionPacks } from '@/components/coursework/questionPacks';
import { courseWorkTopics } from '@/components/coursework/topicIndex';
import LockedContentDialog from '@/components/coursework/LockedContentDialog';
import moment from 'moment';
import { useInstructorAccessCheck } from '@/hooks/useInstructorAccessCheck';
import RestrictedAccessNotice from '@/components/access/RestrictedAccessNotice';

const courseWorkContent = {
  1: {
    title: 'Legal Responsibilities',
    sections: [
      {
        heading: 'Legal Responsibilities – Overview',
        body: `To drive safely and legally in the UK, every driver must understand their responsibilities for themselves and the vehicle they operate.

This includes:
• Being fit to drive
• Ensuring the vehicle is legal and roadworthy
• Avoiding distractions (such as mobile phones)
• Knowing what to do in the event of an accident
• Following the rules in the Highway Code`
      },
      {
        heading: '1. Your Fitness to Drive',
        body: `You must always be in a safe physical and mental condition to drive. The law requires you to understand how your health, eyesight, alcohol, drugs, tiredness and distractions affect your driving.

1.1 Health
• Some medical conditions must be reported to the DVLA.
• You must not drive if a condition affects your ability to drive safely.
• Failing to notify the DVLA can lead to a fine of up to £1,000 and possible prosecution if you are involved in a collision.

1.2 Eyesight
• You must be able to read a number plate from 20 metres.
• If you need glasses or contact lenses to meet this standard, you must wear them whenever you drive.
• Driving with poor eyesight can result in penalty points, fines or disqualification.

1.3 Alcohol
• There is a legal limit for alcohol, but the safest option is not to drink at all if you plan to drive.
• Penalties for drink driving can include up to 6 months in prison, a driving ban (minimum 12 months) and unlimited fines.

1.4 Drugs
• You must never drive after taking drugs that impair your ability to drive.
• This includes illegal drugs and some prescription or over-the-counter medicines that cause drowsiness.
• Penalties for drug driving can include up to 6 months in prison, a driving ban and unlimited fines.

1.5 Tiredness
• Tiredness significantly increases the risk of collisions.
• You should avoid driving when tired and take regular breaks, ideally at least every 2 hours on long journeys.

1.6 Mobile Phones
• It is illegal to use a handheld mobile phone while driving.
• Even hands-free devices can distract you and slow your reaction time.
• Penalties can include 6 penalty points, a £200 fine and possible disqualification, especially for new drivers.
• These rules also apply to anyone supervising a learner driver.`
      }
    ]
  },
  // ... (full content omitted for brevity - use original data structure)
};

export default function CourseWorkDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = parseInt(urlParams.get('id'));
  const subcard = urlParams.get('subcard');
  const [showAudioHint, setShowAudioHint] = useState(() => {
    const hasSeenHint = localStorage.getItem('audio_hint_seen');
    return !hasSeenHint && localStorage.getItem('enable_audio_reading') !== 'false';
  });
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [showRemoveAllDialog, setShowRemoveAllDialog] = useState(false);

  const currentTopic = courseWorkTopics.find(t => t.id === itemId);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil } = useQuery({
    queryKey: ['currentPupil', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      return pupils.length > 0 ? pupils[0] : null;
    },
    enabled: !!user?.id && user?.role === 'user'
  });

  const { data: accessList = [] } = useQuery({
    queryKey: ['pupilTopicAccess', pupil?.id],
    queryFn: () => base44.entities.PupilTopicAccess.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: myHomework = [] } = useQuery({
    queryKey: ['myHomework', pupil?.id],
    queryFn: () => base44.entities.HomeworkItem.filter({ pupilId: pupil.id }),
    enabled: !!pupil?.id
  });

  const { data: skillAssignment } = useQuery({
    queryKey: ['skillAssignment', pupil?.id, currentTopic?.topicId],
    queryFn: async () => {
      if (!pupil?.id || !currentTopic?.topicId) return null;
      const assignments = await base44.entities.SkillAssignment.filter({
        pupilId: pupil.id,
        skillId: currentTopic.topicId
      });
      return assignments.length > 0 ? assignments[0] : null;
    },
    enabled: !!pupil?.id && !!currentTopic?.topicId
  });

  const { data: topicAccessRecords = [] } = useQuery({
    queryKey: ['topicAccessRecords', itemId],
    queryFn: async () => {
      const currentTopic = courseWorkTopics.find(t => t.id === itemId);
      if (!currentTopic) return [];
      return base44.entities.PupilTopicAccess.filter({ topicId: currentTopic.topicId });
    },
    enabled: !!itemId && !!user?.id && user?.role === 'admin'
  });

  const isInstructor = user?.role === 'admin';
  const { hasValidAccess, isLoading: accessCheckLoading } = useInstructorAccessCheck(pupil);

  // Show loading while checking instructor access (only for pupils)
  if (!isInstructor && pupil && accessCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Restrict access if pupil's instructor doesn't have active subscription
  if (!isInstructor && pupil && !hasValidAccess) {
    return <RestrictedAccessNotice />;
  }

  const content = courseWorkContent[itemId];
  const topicIdStr = currentTopic?.topicId;
  
  // Check if pupil has access via PupilTopicAccess OR via assigned homework
  const access = accessList.find(a => a.topicId === topicIdStr && !a.revokedAt);
  const hasHomeworkAccess = myHomework.some(h => 
    h.status !== 'Completed' &&
    (h.description?.toLowerCase().includes(topicIdStr?.toLowerCase()) ||
     h.title?.toLowerCase().includes(topicIdStr?.toLowerCase()))
  );
  
  // Instructors always have full access
  const hasStudyAccess = isInstructor ? true : (!access || access.grantStudyMaterial !== false || 
    (hasHomeworkAccess && myHomework.some(h => h.description?.toLowerCase().includes('study'))));
  const hasMcqAccess = isInstructor ? true : (!access || access.grantPracticeQuestions !== false || 
    (hasHomeworkAccess && myHomework.some(h => h.description?.toLowerCase().includes('practice'))));
  
  const isTopicLocked = !isInstructor && access && access.grantStudyMaterial === false && access.grantPracticeQuestions === false;

  const dismissAudioHint = () => {
    setShowAudioHint(false);
    localStorage.setItem('audio_hint_seen', 'true');
  };

  // Cards that should NOT have sub-cards
  const excludedCards = [25, 28]; // Show Me Tell Me (25), Test Preparation (28)
  const shouldHaveSubcards = itemId && !excludedCards.includes(itemId);

  // Mark material as opened when studying
  useEffect(() => {
    if (skillAssignment && !skillAssignment.hasOpenedMaterial && (shouldHaveSubcards && subcard === 'study')) {
      base44.entities.SkillAssignment.update(skillAssignment.id, {
        hasOpenedMaterial: true,
        materialOpenedAt: new Date().toISOString()
      }).catch(err => console.error('Failed to mark material as opened:', err));
    }
  }, [skillAssignment, shouldHaveSubcards, subcard]);

  // Combine all section content into one text for audio
  const fullContentText = content?.sections?.map(section => 
    `${section.heading}. ${section.body}`
  ).join('. ') || '';

  const handleSubcardClick = (type) => {
    if (type === 'study' && !hasStudyAccess) {
      setShowLockedDialog(true);
      return;
    }
    if (type === 'practice' && !hasMcqAccess) {
      setShowLockedDialog(true);
      return;
    }
    navigate(createPageUrl('CourseWorkDetail') + `?id=${itemId}&subcard=${type}`);
  };

  // Handle sub-card selection screen (for all cards except excluded ones)
  if (shouldHaveSubcards && !subcard && content) {
    return (
      <CourseWorkSubcardSelect
        itemId={itemId}
        content={content}
        isInstructor={isInstructor}
        hasStudyAccess={hasStudyAccess}
        hasMcqAccess={hasMcqAccess}
      />
    );
  }

  // Handle Practice Questions sub-card (for all cards with sub-cards)
  if (shouldHaveSubcards && subcard === 'practice' && content) {
    // Check access for learners
    if (!hasMcqAccess && !isInstructor) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('CourseWork')}>
              <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Course Work
              </Button>
            </Link>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Locked Content</h3>
                <p className="text-slate-600">
                  This content is locked until your instructor assigns it to you. Please ask your instructor to grant you access to this topic's Practice Questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const questionPack = questionPacks[itemId];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWorkDetail') + `?id=${itemId}`}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to {content.title}
            </Button>
          </Link>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-[#071739]" />
              <h1 className="text-3xl font-bold text-[#071739]">Practice Questions</h1>
            </div>
            <p className="text-slate-500 text-sm">{content.title}</p>
          </div>
          
          {questionPack ? (
            <McqQuizPaginated questionPack={questionPack} topicId={itemId} />
          ) : (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Practice Questions Yet</h3>
                <p className="text-slate-600">
                  Practice questions for this topic are not yet available. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Handle Study Material sub-card
  if (shouldHaveSubcards && subcard === 'study' && content) {
    if (!hasStudyAccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl('CourseWork')}>
              <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Course Work
              </Button>
            </Link>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-8 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Locked Content</h3>
                <p className="text-slate-600">
                  This study material is locked. Ask your instructor to grant you access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWorkDetail') + `?id=${itemId}`}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to {content.title}
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#071739] mb-2">{content.title}</h1>
            <p className="text-slate-500">Study Material</p>
          </div>

          {showAudioHint && (
            <Card className="border-l-4 border-l-blue-500 mb-6 bg-blue-50">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Audio Available</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This content can be read aloud. Use the audio player below to listen.
                    </p>
                  </div>
                </div>
                <button onClick={dismissAudioHint} className="text-blue-400 hover:text-blue-600">
                  <X className="w-5 h-5" />
                </button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-8">
            {content.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">{section.heading}</h2>
                <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">
                  {section.body}
                </div>
              </div>
            ))}
          </div>

          <Card className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Volume2 className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-900 mb-2">Listen to this lesson</h3>
                  <GoogleTTSAudioPlayer text={fullContentText} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For cards without sub-cards (Show Me Tell Me, Test Preparation)
  if (!shouldHaveSubcards && content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWork')}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Course Work
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#071739]">{content.title}</h1>
          </div>

          <div className="space-y-8">
            {content.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">{section.heading}</h2>
                <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('CourseWork')}>
          <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Course Work
          </Button>
        </Link>
        <Card className="text-center p-8">
          <p className="text-slate-500">Content not found</p>
        </Card>
      </div>
    </div>
  );
}