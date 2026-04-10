import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function TestRouteTerms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">Tacholator – Test Route T&Cs</h1>
          </div>
          <p className="text-slate-600">Last updated: 10 April 2026</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none space-y-8">

              <p className="text-slate-700 leading-relaxed">
                These Terms &amp; Conditions explain how Tacholator's test route videos, mapped routes, and GPS route guidance may be used, including important safety, access, and content limitation information.
              </p>

              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">1. About the Test Route Feature</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Tacholator provides driving test route-related content to help users become more familiar with local road layouts, common road types, junctions, roundabouts, hazard awareness, and the general style of driving associated with practical test preparation. This feature may include:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Video recordings of individual test routes or route areas</li>
                  <li>Route guidance content</li>
                  <li>Mapped or visual route paths</li>
                  <li>GPS-enabled route following</li>
                  <li>Related educational or familiarisation content</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  The Test Route feature is provided for learning and familiarisation purposes only.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">2. No Guarantee of Exact Driving Test Routes</h2>
                <div className="bg-amber-50 border-l-4 border-[#F7B602] rounded-r-lg p-4 mb-4">
                  <p className="text-slate-700 text-sm font-medium">
                    Important: Routes shown in the app are not guaranteed to match the route used in an actual driving test.
                  </p>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator does not guarantee that any route shown in the app, in a video, or through GPS guidance will be the exact route used in an actual driving test. Driving test routes may vary at any time due to examiner choice, road conditions, traffic, roadworks, diversions, safety concerns, or operational changes. Users must understand that the purpose of Tacholator Test Routes is to support preparation and confidence, not to predict or replicate an official test route exactly.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">3. Educational Use Only</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  All test route content is intended only to support learning, revision, route familiarisation, hazard awareness, confidence building, and safe driving preparation. The content must not be relied on as:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Official DVSA material</li>
                  <li>Official driving test instructions</li>
                  <li>Legal road advice</li>
                  <li>A guarantee of test success</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">4. GPS Route Guidance</h2>
                <div className="bg-amber-50 border-l-4 border-[#F7B602] rounded-r-lg p-4 mb-4">
                  <p className="text-slate-700 text-sm font-medium">
                    Important: GPS guidance is a learning aid only. Always follow real-world road signs, signals, and lawful driving practice.
                  </p>
                </div>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Some Tacholator test route content may include GPS route guidance to help users follow a displayed route while practising. GPS guidance is provided as a convenience and learning aid only. It may not always reflect:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Current live traffic conditions</li>
                  <li>Temporary road closures or diversions</li>
                  <li>New road layouts or temporary traffic lights</li>
                  <li>Roadworks or changes in road signs or markings</li>
                  <li>Local driving restrictions</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Users are responsible for checking the road environment at all times and must always follow current road signs, road markings, traffic signals, legal restrictions, the Highway Code, and safe driving practice. Where GPS guidance differs from actual road conditions, signage, or legal requirements, the real-world road environment must always take priority.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">5. Driver Responsibility and Safe Use</h2>
                <div className="bg-amber-50 border-l-4 border-[#F7B602] rounded-r-lg p-4 mb-4">
                  <p className="text-slate-700 text-sm font-medium">
                    Important: Users remain fully responsible for their driving decisions and behaviour at all times. Do not use the app in a way that distracts from driving safely.
                  </p>
                </div>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Users remain fully responsible for their own driving decisions and behaviour at all times while using Tacholator Test Routes. The app must be used responsibly and lawfully. Users must ensure that they:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Remain in full control of the vehicle at all times</li>
                  <li>Do not interact with the app in an unsafe or unlawful manner while driving</li>
                  <li>Any mounted device is used in compliance with applicable road laws</li>
                  <li>Attention remains on the road, surroundings, and hazards at all times</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  If a learner is using Tacholator while driving, they should do so only under lawful supervision and in accordance with all applicable driving laws and licence conditions.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">6. Video Content</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Tacholator route videos are provided to help users understand road positioning, junction treatment, roundabouts, lane choice, road awareness, and general route familiarisation. Video content may become outdated over time due to:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Road changes or new signage</li>
                  <li>Lane layout changes</li>
                  <li>Temporary or permanent restrictions</li>
                  <li>Roadworks or traffic changes</li>
                  <li>Route changes</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Users must not assume that a video always reflects the current road environment exactly at the time of viewing or use.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">7. Local Conditions May Change</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Roads, test areas, and driving environments can change at any time. This includes changes to:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Speed limits, lane markings, and road priority</li>
                  <li>Signage and parking arrangements</li>
                  <li>Junction layouts and temporary restrictions</li>
                  <li>One-way systems, road closures, and traffic patterns</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  It is the user's responsibility to respond to current real-world conditions and not rely solely on app content.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">8. No Guarantee of Passing a Driving Test</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Use of Tacholator Test Routes does not guarantee:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Passing a practical driving test</li>
                  <li>Being shown the same roads on the day of the test</li>
                  <li>Improved performance in every case</li>
                  <li>That all local routes are included</li>
                  <li>That route content is always complete, current, or uninterrupted</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Driving test outcomes depend on many factors, including driving ability, decision-making, observation, control, road conditions, and test-day performance.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">9. Subscription and Access</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Access to Test Route content may require an active paid subscription. Where a subscription applies:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Access is limited to the specific test centre or route content included in that subscription</li>
                  <li>Subscription access remains active only while the relevant subscription remains valid</li>
                  <li>A separate subscription fee may apply for each individual test centre</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Cancellation, renewal, billing, and refund rules for paid access are governed by Tacholator's Subscription Terms &amp; Conditions.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">10. Availability of Content</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Tacholator may add, remove, update, replace, or discontinue any test route content, route videos, GPS route data, or related features at any time. Tacholator does not guarantee that:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Every test centre will always be available</li>
                  <li>Every route will always remain accessible</li>
                  <li>Every video or GPS route will remain unchanged</li>
                  <li>Access will always be uninterrupted or error-free</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Access may be affected by updates, maintenance, technical issues, mapping issues, connectivity, platform limitations, or content changes.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">11. Accuracy and Mapping Limitations</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Although Tacholator aims to provide useful and high-quality route content, it does not guarantee that all route data, map lines, video content, or GPS guidance will always be fully accurate, complete, or current. There may be:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Map inaccuracies or route deviations</li>
                  <li>Recording differences or outdated segments</li>
                  <li>Technical display issues</li>
                  <li>GPS positioning delays or errors</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Users must always rely on real-time road awareness and lawful driving behaviour over app-based route guidance.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">12. Lawful Use Only</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Users must use the Test Route feature lawfully and responsibly. Users must not:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700">
                  <li>Use the feature in a way that breaks road laws</li>
                  <li>Drive unsafely while following route content</li>
                  <li>Record, copy, redistribute, sell, or republish Tacholator videos or route materials without permission</li>
                  <li>Share subscription-only content with unauthorised users</li>
                  <li>Misuse the feature in a way that risks harm, confusion, or unlawful conduct</li>
                </ul>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">13. Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  All Test Route content, including videos, route recordings, route visualisations, GPS route data presentation, educational overlays, graphics, text, and branding, remains the property of Tacholator and/or its licensors. Users are granted a limited, non-exclusive, non-transferable right to access this content for personal learning or authorised use during an active subscription period where applicable.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Users must not copy, download, reproduce, distribute, publish, sell, sublicense, or commercially exploit this content without prior written permission, except where such use is expressly permitted by law.
                </p>
              </section>

              {/* Section 14 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">14. Technical Performance</h2>
                <p className="text-slate-700 leading-relaxed">
                  The Test Route feature may depend on internet access, location services, GPS signal quality, mapping services, app version, and device compatibility. Tacholator is not responsible for failures or limitations caused by poor signal, unsupported devices, outdated operating systems, third-party mapping issues, or other factors outside its reasonable control.
                </p>
              </section>

              {/* Section 15 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">15. Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  To the fullest extent permitted by law, Tacholator is not liable for:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Indirect or consequential loss, loss of opportunity, loss of business, or loss of data</li>
                  <li>Reliance on route similarity or disappointment arising from different test routes</li>
                  <li>Road changes not reflected in the app</li>
                  <li>Navigation, mapping, or GPS inaccuracies</li>
                  <li>Driving decisions made by users while using the feature</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  Nothing in these terms excludes liability where it cannot legally be excluded, including liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence.
                </p>
              </section>

              {/* Section 16 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">16. Changes to these Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator may update these Test Route Terms &amp; Conditions from time to time. Where appropriate, users will be notified of material changes through the app, by email, or by another suitable method. Continued use of the Test Route feature after updated terms take effect means acceptance of the revised terms.
                </p>
              </section>

              {/* Section 17 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">17. Consumer Rights</h2>
                <p className="text-slate-700 leading-relaxed">
                  Nothing in these Terms &amp; Conditions removes or limits any rights users may have under applicable consumer law.
                </p>
              </section>

              {/* Section 18 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">18. Governing Law</h2>
                <p className="text-slate-700 leading-relaxed">
                  These Test Route Terms &amp; Conditions are governed by the laws of England and Wales, unless applicable law in the user's country of residence requires otherwise. Any disputes shall be subject to the jurisdiction of the courts of England and Wales, unless mandatory law provides otherwise.
                </p>
              </section>

              {/* Section 19 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">19. Contact Us</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  If users have any questions about these Test Route Terms &amp; Conditions, they should contact:
                </p>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-slate-700"><strong>Company:</strong> Tacholator / Mobrage</p>
                  <p className="text-slate-700">
                    <strong>Email:</strong> <a href="mailto:info@mobrage.com" className="text-[#F7B602] hover:underline">info@mobrage.com</a>
                  </p>
                  <p className="text-slate-700">
                    <strong>Website:</strong> <a href="https://www.mobragedrivingacademy.com" target="_blank" rel="noopener noreferrer" className="text-[#F7B602] hover:underline">https://www.mobragedrivingacademy.com</a>
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