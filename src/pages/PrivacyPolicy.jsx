import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">Tacholator – Privacy Policy</h1>
          </div>
          <p className="text-slate-600">Last updated: March 2026</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none space-y-8">
              
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">1. Introduction</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  This Privacy Policy explains how Mobrage Driving Academy ("Mobrage", "we", "us", "our") collects, uses, stores and protects personal data when you use the Tacholator app ("the App").
                </p>
                <p className="text-slate-700 leading-relaxed">
                  We are committed to complying with the UK General Data Protection Regulation (UK GDPR) and handling your data lawfully, fairly and transparently.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">2. Information We Collect</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We collect different types of data to provide and improve our services through Tacholator.
                </p>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-4">2.1 Personal Identifiable Data</h3>
                <p className="text-slate-700 leading-relaxed mb-2">We may collect:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number (if provided)</li>
                  <li>Provisional licence number (if provided)</li>
                  <li>Profile information provided during registration</li>
                  <li>Profile photo (if provided via your social account or uploaded manually)</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-5">2.2 Social Sign-In Data (Google & Apple)</h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  You may choose to sign in to Tacholator using your Google or Apple account. When you do, we receive limited profile information from those providers to create or access your account. Specifically:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li><strong>Google Sign-In:</strong> We receive your name, email address, and profile photo URL from your Google account.</li>
                  <li><strong>Sign in with Apple:</strong> We receive your name and email address. Apple may provide you with the option to hide your real email using a relay address — we respect and support this option.</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mb-2">
                  We do not receive or store your social account passwords. The sign-in process is handled securely by the respective provider (Google or Apple) using industry-standard OAuth 2.0 authentication.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  The information received from Google or Apple is used solely to identify you within Tacholator and personalise your experience. It is not used for advertising or shared with third parties beyond what is described in this Policy.
                </p>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-5">2.2 Learning & Training Data</h3>
                <p className="text-slate-700 leading-relaxed mb-2">To support driving tuition, Tacholator may store:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Lesson attendance and schedule details</li>
                  <li>Hours completed and lesson durations</li>
                  <li>DVSA skill assessments and progress</li>
                  <li>Instructor feedback, comments and notes</li>
                  <li>Pupil reflections and diary entries</li>
                  <li>Study pack usage and MCQ results</li>
                  <li>Task completion and learning activity history</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-5">2.3 Technical & Usage Data</h3>
                <p className="text-slate-700 leading-relaxed mb-2">We may collect technical information such as:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Device information</li>
                  <li>IP address</li>
                  <li>App or browser version</li>
                  <li>Logs of feature usage and session activity</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  This helps us maintain security, improve performance and enhance the user experience.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">3. How We Use Your Information</h2>
                <p className="text-slate-700 leading-relaxed mb-3">We use the information collected through Tacholator to:</p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Provide and manage access to the App and its features</li>
                  <li>Track learning progress and support DVSA-aligned training</li>
                  <li>Help instructors plan and deliver lessons effectively</li>
                  <li>Generate training summaries and readiness insights</li>
                  <li>Improve App performance, functionality and content</li>
                  <li>Provide customer support and troubleshoot issues</li>
                  <li>Maintain platform safety and security</li>
                  <li>Comply with legal or regulatory obligations</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  We do not sell your personal data.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">4. Legal Basis for Processing</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Under UK GDPR, we process your personal data using the following legal bases:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li><strong>Contract:</strong> To deliver driving tuition and associated services.</li>
                  <li><strong>Legitimate Interests:</strong> To improve our App, monitor performance, and support learning progress.</li>
                  <li><strong>Consent:</strong> For optional features such as certain notifications or communication preferences.</li>
                  <li><strong>Legal Obligation:</strong> To meet regulatory, tax or record-keeping requirements.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">5. Sharing Your Information</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  We may share your data with trusted third-party service providers who help us operate and improve Tacholator, such as:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Hosting and infrastructure providers</li>
                  <li>App service and maintenance providers</li>
                  <li>Communication and email platforms</li>
                  <li>Analytics and security tools</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3 mb-3">
                  These third parties are required to comply with UK GDPR and handle your data securely and only on our instructions.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  We may also share information where required by law, regulation, or in connection with a business transfer such as a merger or acquisition.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">6. Data Security</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  We use a range of technical and organisational measures to protect your data, including:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Encrypted storage where appropriate</li>
                  <li>Secure servers and access controls</li>
                  <li>Role-based permissions for staff, instructors and pupils</li>
                  <li>Authentication and login protections</li>
                  <li>Monitoring for suspicious or unauthorised activity</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Only authorised individuals (such as your instructor or designated Mobrage staff) can access your training data where it is necessary for providing services or support.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">7. Data Retention</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  We retain your information only for as long as necessary to fulfil the purposes described in this Policy, including:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Delivering driving instruction and App services</li>
                  <li>Maintaining accurate training and financial records</li>
                  <li>Meeting legal, regulatory and tax obligations</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Training records, diaries and assessments held in Tacholator may be retained for up to 6 years, unless deletion is requested earlier and is legally permissible.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">8. Your Rights (UK GDPR)</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  You have the following rights in relation to your personal data:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>The right to access your personal data</li>
                  <li>The right to request correction of inaccurate or incomplete data</li>
                  <li>The right to request deletion of your data where appropriate</li>
                  <li>The right to restrict certain processing activities</li>
                  <li>The right to data portability (transfer of your data)</li>
                  <li>The right to object to certain types of processing</li>
                  <li>The right to withdraw consent where processing is based on consent</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  To exercise any of these rights, please contact us at <a href="mailto:info@mobrage.com" className="text-[#F7B602] hover:underline">info@mobrage.com</a>. We aim to respond within 30 days, in line with UK GDPR.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">9. Children's Data</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Tacholator is not intended for unsupervised use by individuals under 16 years of age. Where younger pupils are involved, instructors and, where applicable, parents or guardians are responsible for ensuring data is provided and used appropriately.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  If we become aware that we have collected personal data from a child without appropriate consent, we will take steps to delete that information where required by law.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">10. Cookies and Tracking Technologies</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  The App or related web services may use cookies or similar tracking technologies to:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Improve functionality and user experience</li>
                  <li>Remember preferences</li>
                  <li>Enhance security and performance</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  You may be able to adjust your device or browser settings to control or disable certain tracking technologies, although some App features may not function correctly if you do so.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  We may update this Privacy Policy from time to time to reflect changes in technology, law or our services.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  The most recent version will always be available within the App and/or on our website. By continuing to use Tacholator after changes take effect, you are deemed to accept the updated Policy.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">12. Contact Us</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  If you have any questions or concerns about this Privacy Policy or how your data is handled in Tacholator, please contact us:
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