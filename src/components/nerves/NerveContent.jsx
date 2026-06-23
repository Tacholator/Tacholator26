import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, HeartPulse, Moon, Coffee, Eye, Wind, MessageSquare,
  Car, ClipboardList, Clock, AlertTriangle, Info
} from 'lucide-react';

function ContentSection({ icon, number, title, children }) {
  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-[#071739]">
          {icon}
          {number ? `Section ${number}: ` : ''}{title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700 leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-[#F7B602] mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function NerveContent() {
  return (
    <>
      {/* Intro Section */}
      <Card className="border border-[#F7B602]/30 bg-amber-50/50">
        <CardContent className="p-5 space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-[#071739]">Feeling nervous before your driving test is normal</h2>
          <p>Most learners feel some level of nerves before their practical driving test. This does not mean you are not capable. It simply means the test matters to you.</p>
          <p>The goal is not to remove nerves completely. The goal is to learn how to stay calm, focused and in control while driving.</p>
          <p>Driving safely requires clear thinking, good observation, planning ahead and making calm decisions. That is why learning to manage nerves is an important part of becoming test ready.</p>
        </CardContent>
      </Card>

      {/* Section 1 */}
      <ContentSection icon={<Brain className="w-5 h-5 text-[#F7B602]" />} number={1} title="Why managing nerves matters">
        <p>Nerves can affect how you drive. You may rush decisions, forget simple routines, overthink mistakes, or lose focus on what is happening around you.</p>
        <p>Being able to manage nerves helps you:</p>
        <BulletList items={[
          'Stay calm under pressure',
          'Listen carefully to instructions',
          'Make safer decisions',
          'Recover quickly from small mistakes',
          'Focus on the road instead of the result',
          'Build confidence for independent driving after passing'
        ]} />
        <p>Your driving test is not the only time you may feel pressure. You may also feel nervous when driving alone for the first time, dealing with busy roundabouts, driving in a new area, or driving at night. Practising nerve control now will help you beyond the test.</p>
      </ContentSection>

      {/* Section 2 */}
      <ContentSection icon={<ClipboardList className="w-5 h-5 text-[#F7B602]" />} number={2} title="Plan before test day">
        <p>Good preparation can reduce stress. Try not to book your test during a very busy or stressful period in your life. If you already have exams, work pressure or personal stress, speak with your instructor and think carefully about whether the timing is right.</p>
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="font-semibold text-slate-600 text-xs mb-2">Checklist:</p>
          <BulletList items={[
            'I know the date, time and location of my test',
            'I know what documents I need',
            'I have practised around the test centre area',
            'I have completed mock tests',
            'My instructor has confirmed I am ready',
            'I know what to expect on test day'
          ]} />
        </div>
      </ContentSection>

      {/* Section 3 */}
      <ContentSection icon={<Moon className="w-5 h-5 text-[#F7B602]" />} number={3} title="Sleep and rest">
        <p>Being tired can make nerves feel worse. Try to get good sleep in the days leading up to your test. Do not rely on one good night only. A few nights of proper rest can help you feel more alert, calmer and more focused.</p>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800"><strong>Tip:</strong> Avoid late-night revision or too much driving practice the night before your test. Your brain needs time to rest.</p>
        </div>
      </ContentSection>

      {/* Section 4 */}
      <ContentSection icon={<Coffee className="w-5 h-5 text-[#F7B602]" />} number={4} title="Be careful with caffeine">
        <p>Too much caffeine before your test can make you feel shaky, rushed or more anxious. If caffeine usually affects you, reduce it before your test.</p>
        <p>Instead, drink water and eat something light if you can. You want to feel comfortable, alert and steady.</p>
      </ContentSection>

      {/* Section 5 */}
      <ContentSection icon={<Eye className="w-5 h-5 text-[#F7B602]" />} number={5} title="Focus on the drive, not the result">
        <p>During the test, your job is to drive safely one step at a time. Try not to keep thinking, "Will I pass?" or "Have I failed?"</p>
        <p className="font-semibold text-slate-600">Focus on:</p>
        <BulletList items={[
          'What can I see?',
          'What is the safest decision now?',
          'What is the examiner asking me to do?',
          'What is happening ahead, behind and around me?'
        ]} />
        <p>If you make a small mistake, do not panic. Stay calm and continue driving safely. Many learners make small mistakes and still pass. What matters is how safely you respond.</p>
      </ContentSection>

      {/* Section 6 */}
      <ContentSection icon={<Wind className="w-5 h-5 text-[#F7B602]" />} number={6} title="Use a simple breathing technique">
        <p>Before the test starts, take a moment to slow your breathing.</p>
        <p className="font-semibold text-slate-600">Try this:</p>
        <div className="p-3 bg-slate-50 rounded-lg space-y-1">
          <p>1. Breathe in slowly through your nose</p>
          <p>2. Hold for a moment</p>
          <p>3. Breathe out slowly</p>
          <p>4. Repeat a few times</p>
        </div>
        <p>You can also use this before difficult moments during lessons, such as roundabouts, manoeuvres or independent driving.</p>
      </ContentSection>

      {/* Section 7 */}
      <ContentSection icon={<MessageSquare className="w-5 h-5 text-[#F7B602]" />} number={7} title="Talk to your instructor">
        <p>Your instructor knows your driving ability and can help you prepare mentally as well as practically. Tell them what makes you nervous.</p>
        <p className="font-semibold text-slate-600">For example:</p>
        <BulletList items={[
          'I panic at roundabouts',
          'I overthink after making a mistake',
          'I struggle when being watched',
          'I get nervous during independent driving',
          'I rush when I feel under pressure'
        ]} />
        <p>Your instructor can help you practise these situations in a safe and structured way.</p>
      </ContentSection>

      {/* Section 8 */}
      <ContentSection icon={<Car className="w-5 h-5 text-[#F7B602]" />} number={8} title="Practise test-style driving">
        <p>One of the best ways to reduce nerves is to practise in conditions similar to the real test.</p>
        <p className="font-semibold text-slate-600">You can do this by:</p>
        <BulletList items={[
          'Taking mock driving tests',
          'Practising independent driving',
          'Driving without instructor prompts',
          'Practising manoeuvres under test conditions',
          'Driving around different roads near your test centre',
          'Reviewing mistakes calmly after each lesson'
        ]} />
        <p>The more familiar the test format feels, the easier it becomes to stay calm.</p>
      </ContentSection>

      {/* Section 10 */}
      <ContentSection icon={<AlertTriangle className="w-5 h-5 text-[#F7B602]" />} number={10} title="When to consider moving your test">
        <p>If you do not feel prepared, it may be better to move your test rather than rush into it. You should feel confident that you can drive safely and independently.</p>
        <p className="font-semibold text-slate-600">You may need more time if:</p>
        <BulletList items={[
          'You still need regular prompts from your instructor',
          'You are still making serious or dangerous mistakes',
          'You have not passed mock tests',
          'Your instructor has not confirmed you are ready',
          'Your nerves are stopping you from driving safely'
        ]} />
        <p>Moving your test is not failure. It can be a sensible decision that gives you more time to become a safer and more confident driver.</p>
      </ContentSection>
    </>
  );
}