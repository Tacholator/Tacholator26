import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">Tacholator – Terms & Conditions</h1>
          </div>
          <p className="text-slate-600">Last updated: December 2025</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none space-y-8">
              
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">1. Introduction</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator ("the App") is a digital learning, progress-tracking, and communication tool operated by Mobrage Driving Academy ("Mobrage", "we", "us", "our"). These Terms & Conditions govern your use of the App as an instructor or pupil.
                </p>
                <p className="text-slate-700 leading-relaxed mt-3">
                  By accessing or using Tacholator, you agree to comply with these Terms. If you do not agree to these Terms, you must stop using the App immediately.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">2. Purpose of Tacholator</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Tacholator is designed to support driving tuition by providing:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Lesson scheduling and attendance tracking</li>
                  <li>DVSA-aligned skill assessments</li>
                  <li>Instructor notes and pupil reflections</li>
                  <li>Training hours tracking</li>
                  <li>Access to study materials and MCQ questions</li>
                  <li>Communication between instructor and pupil</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  The App is an educational support tool and does not replace practical driving lessons, professional judgement or DVSA testing standards.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">3. Eligibility</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  You may use Tacholator if you are:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>A registered pupil of Mobrage Driving Academy; or</li>
                  <li>An instructor approved or contracted by Mobrage.</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Use of the App requires accurate account information and compliance with applicable UK driving laws and regulations.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">4. User Responsibilities</h2>
                
                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-4">4.1 Responsibilities of Pupils</h3>
                <p className="text-slate-700 leading-relaxed mb-2">Pupils agree to:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Provide accurate and up-to-date personal information</li>
                  <li>Use the App only for their own learning and progress</li>
                  <li>Keep login details secure and not share them with others</li>
                  <li>Engage respectfully with instructors through the App</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-5">4.2 Responsibilities of Instructors</h3>
                <p className="text-slate-700 leading-relaxed mb-2">Instructors agree to:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Enter accurate and honest training records (hours, skills, notes)</li>
                  <li>Use the App professionally and ethically</li>
                  <li>Maintain confidentiality of pupil data</li>
                  <li>Comply with DVSA and Mobrage guidelines and policies</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">5. Account Security</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  You are responsible for maintaining the confidentiality of your login credentials and for any activity that occurs under your account.
                </p>
                <p className="text-slate-700 leading-relaxed mb-3">
                  If you believe your account has been compromised, you must notify us as soon as possible at <a href="mailto:info@mobrage.com" className="text-[#F7B602] hover:underline">info@mobrage.com</a>.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Mobrage is not liable for any loss or damage resulting from unauthorised access caused by your failure to keep your login details secure.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">6. Data Accuracy</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Information entered into Tacholator, such as hours completed, assessments, and progress records, must be accurate and not misleading.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Mobrage reserves the right to review and verify data, request clarifications, or correct obvious errors to maintain the integrity of training records.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">7. Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  All content and functionality in Tacholator, including study materials, MCQs, assessments, progress tracking structures, design, and software, are owned by Mobrage Driving Academy or its licensors.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Users may not copy, distribute, modify, reverse engineer, resell, or reproduce any part of the App without prior written permission from Mobrage.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">8. Acceptable Use</h2>
                <p className="text-slate-700 leading-relaxed mb-3">You agree not to:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Use the App for any unlawful or harmful purpose</li>
                  <li>Upload or share offensive, abusive, or inappropriate content</li>
                  <li>Attempt to access, alter, or delete data belonging to other users</li>
                  <li>Interfere with or disrupt the operation of the App</li>
                  <li>Reverse-engineer or attempt to gain unauthorised access to the system</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Mobrage may suspend or terminate access if misuse is detected.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">9. Service Availability</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  We aim to provide reliable access to Tacholator, but we do not guarantee that the App will always be available, error-free, or uninterrupted.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Planned maintenance, updates, or unexpected technical issues may result in temporary unavailability of the App.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">10. Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  As far as permitted by law, Mobrage will not be liable for:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Loss of data due to external factors or device issues</li>
                  <li>Problems caused by poor connectivity or user error</li>
                  <li>Decisions or actions taken solely on the basis of App data</li>
                  <li>Any indirect, incidental, or consequential damages</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Tacholator is a supplementary learning tool. Driving outcomes, including test results, depend on practical instruction, DVSA criteria and pupil performance.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">11. Termination of Use</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Mobrage may suspend or terminate access to Tacholator if:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>These Terms are breached</li>
                  <li>Misuse, fraud or abusive behaviour is detected</li>
                  <li>A pupil or instructor relationship with Mobrage ends</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Users may request account deletion by contacting <a href="mailto:info@mobrage.com" className="text-[#F7B602] hover:underline">info@mobrage.com</a>, subject to applicable data retention obligations.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">12. Changes to These Terms</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  We may update these Terms & Conditions from time to time. Any changes will be made available within the App and/or on our website.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  By continuing to use Tacholator after changes take effect, you are deemed to accept the updated Terms.
                </p>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">13. Contact Us</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  If you have any questions about these Terms & Conditions or your use of Tacholator, please contact us:
                </p>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-slate-700">
                    <strong>Email:</strong> <a href="mailto:info@mobrage.com" className="text-[#F7B602] hover:underline">info@mobrage.com</a>
                  </p>
                  <p className="text-slate-700">
                    <strong>Website:</strong> <a href="https://www.mobragedrivingacademy.com" target="_blank" rel="noopener noreferrer" className="text-[#F7B602] hover:underline">https://www.mobragedrivingacademy.com</a>
                  </p>
                  <p className="text-slate-700">
                    <strong>Location:</strong> United Kingdom
                  </p>
                </div>
              </section>

            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          © {new Date().getFullYear()} Mobrage Driving Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}