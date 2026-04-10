import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function SubscriptionTerms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">Tacholator – Subscription T&Cs</h1>
          </div>
          <p className="text-slate-600">Last updated: 10 April 2026</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none space-y-8">

              <p className="text-slate-700 leading-relaxed">
                These Subscription Terms &amp; Conditions explain how paid subscriptions in Tacholator work, including billing, renewals, cancellations, and access to subscription content.
              </p>

              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">1. About these Subscription Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  These Subscription Terms &amp; Conditions govern paid subscriptions offered through the Tacholator app and form part of the overall Tacholator Terms and Conditions. By purchasing or using a paid subscription in Tacholator, users agree to these Subscription Terms &amp; Conditions.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">2. Subscription Products</h2>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-4">2.1 Instructor Subscription</h3>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Monthly Plan: £10 per month</li>
                  <li>Yearly Plan: £100 per year</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  This subscription is intended for driving instructors using Tacholator's instructor features. It gives access to the relevant paid instructor features available in the app at the time of subscription.
                </p>

                <h3 className="text-xl font-semibold text-[#071739] mb-3 mt-5">2.2 Test Centre Video Subscription</h3>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>£20 per month per test centre</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  This subscription gives access to video recordings and related content for an individual driving test centre. Each test centre subscription is separate. If a user wants access to more than one test centre, a separate subscription fee may apply for each test centre. Access is limited to the specific test centre selected and paid for.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">3. Eligibility</h2>
                <p className="text-slate-700 leading-relaxed">
                  Users must be at least 18 years old, or have legal authority to enter into a binding agreement, in order to purchase a subscription. If purchasing on behalf of a business or organisation, the user confirms they have authority to bind that business or organisation to these terms.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">4. Billing and Payment</h2>
                <p className="text-slate-700 leading-relaxed">
                  All subscription fees are charged in pounds sterling (£). Payment will be taken through the payment method linked to the user's app store account or any other payment method made available by Tacholator. By starting a subscription, users authorise recurring payments for the selected subscription plan until cancelled.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">5. Auto-Renewal</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  All subscriptions renew automatically unless cancelled before the next billing date.
                </p>
                <ul className="list-disc ml-6 space-y-2 text-slate-700 mb-3">
                  <li>Monthly subscriptions renew every month</li>
                  <li>Yearly subscriptions renew every year</li>
                  <li>Test centre subscriptions renew monthly for each subscribed test centre</li>
                </ul>
                <p className="text-slate-700 leading-relaxed">
                  The payment method will be charged at the start of each new billing period unless the subscription is cancelled in advance.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">6. Free Trials and Promotional Offers</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator may offer free trials, introductory pricing, discounts, or promotional offers from time to time. Unless stated otherwise, a free trial automatically converts into a paid subscription at the end of the trial period, promotional pricing applies only for the stated promotional period, and standard pricing applies after the offer ends. Only one free trial or introductory offer may be available per user, per subscription type, unless otherwise stated. Tacholator reserves the right to modify, withdraw, or limit promotional offers where permitted by law.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">7. Cancellation</h2>
                <p className="text-slate-700 leading-relaxed">
                  Users can cancel their subscription at any time through the platform where they purchased it, such as Apple App Store or Google Play account settings, or through any other method made available by Tacholator. If cancelled, the subscription will usually remain active until the end of the current paid billing period. Cancellation does not normally entitle the user to a refund for the current billing period unless required by law or stated otherwise. Users are responsible for cancelling before the renewal date if they do not want the subscription to renew.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">8. Refunds</h2>
                <p className="text-slate-700 leading-relaxed">
                  Subscription payments are generally non-refundable once charged, except where required by law, stated in a specific promotional offer, or granted at Tacholator's discretion. If the subscription was purchased through Apple App Store or Google Play, refund requests may need to be made directly through that platform and will be subject to that platform's refund policies.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">9. Price Changes</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator may change subscription prices from time to time. Where required, reasonable notice will be given before a price change takes effect. Any price change will normally apply from the next renewal date, not the current paid period already purchased. If a user does not agree with a price change, they should cancel before the next renewal date.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">10. Access to Subscription Features and Content</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator aims to provide continuous access to subscribed features and content, but uninterrupted availability is not guaranteed at all times. Access may be affected by maintenance, updates, technical problems, internet connectivity issues, app store issues, device compatibility issues, content changes, or platform improvements. Tacholator may add, remove, improve, replace, or modify subscription features, video content, layouts, tools, or functionality from time to time.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">11. Test Centre Video Content</h2>
                <p className="text-slate-700 leading-relaxed">
                  A Test Centre Video Subscription provides access only to the specific test centre content covered by that subscription. Purchase of a subscription for one test centre does not automatically include access to other test centres unless explicitly stated. Video content is provided for learning, revision, and familiarisation purposes only. It is not a guarantee of passing a driving test, the exact route used in a future driving test, or the current road layout, signage, traffic levels, roadworks, or route conditions. Users must always drive safely, follow the Highway Code, and rely on current road conditions and lawful driving practice.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">12. Instructor Subscription Use</h2>
                <p className="text-slate-700 leading-relaxed">
                  Instructor subscriptions are intended only for the subscribed instructor's own professional use within Tacholator, unless expressly stated otherwise. Users must not share subscription access with others, allow unauthorised persons to use their account, resell subscription access, or misuse instructor tools in a way that breaches these terms or applicable law. Tacholator may suspend or terminate access where there is reasonable belief that an account is being misused.
                </p>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">13. Account Responsibility</h2>
                <p className="text-slate-700 leading-relaxed">
                  Users are responsible for maintaining the security of their account, keeping login details confidential, ensuring payment details are valid and up to date where relevant, and all activity carried out through their account. If a user believes their account has been accessed without permission, they should contact support promptly.
                </p>
              </section>

              {/* Section 14 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">14. Failed Payments</h2>
                <p className="text-slate-700 leading-relaxed">
                  If a recurring payment fails, Tacholator may retry the payment, suspend access to subscription features or content, downgrade the account, or cancel the subscription if payment remains unpaid. Access to subscription features may not continue until successful payment is received.
                </p>
              </section>

              {/* Section 15 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">15. Suspension or Termination</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator may suspend, restrict, or terminate subscription access if the user breaches these terms, misuses the app or subscription content, payment is not received, or Tacholator is required to do so for legal, security, or operational reasons. Where appropriate, access will end at the end of the current paid period. In serious cases, access may be suspended or terminated immediately.
                </p>
              </section>

              {/* Section 16 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">16. Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed">
                  All subscription content, including videos, visuals, course materials, app features, branding, text, layout, and design, remains the property of Tacholator and/or its licensors. A subscription gives the user a limited, non-transferable, non-exclusive right to access the relevant content or features for personal or authorised business use during the active subscription period. Users must not copy, record, redistribute, sell, publish, sublicense, commercially exploit, or share access to subscription content without prior written permission.
                </p>
              </section>

              {/* Section 17 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">17. No Guarantee of Outcomes</h2>
                <p className="text-slate-700 leading-relaxed">
                  Subscription access is provided to support learning, familiarisation, organisation, and professional use. Tacholator does not guarantee any particular result, including passing a driving test, gaining pupils or business, improved instructor earnings, uninterrupted access, or permanent availability of any specific route, video, feature, or centre.
                </p>
              </section>

              {/* Section 18 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">18. Device and Platform Compatibility</h2>
                <p className="text-slate-700 leading-relaxed">
                  Users are responsible for ensuring their device, operating system, app version, and internet connection are suitable for using Tacholator and its subscription features. Tacholator is not responsible for lack of access caused by unsupported devices, outdated software, app store restrictions, or internet or network issues outside its control.
                </p>
              </section>

              {/* Section 19 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">19. Changes to Subscription Services or Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  Tacholator may update these Subscription Terms &amp; Conditions from time to time. It may also change or discontinue part of a subscription offering where reasonably necessary for business, legal, operational, or technical reasons. Where appropriate, users will be notified of material changes through the app, by email, or by another suitable method. Continued use of the subscription after updated terms take effect means acceptance of the revised terms.
                </p>
              </section>

              {/* Section 20 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">20. Consumer Rights</h2>
                <p className="text-slate-700 leading-relaxed">
                  Nothing in these Subscription Terms &amp; Conditions removes or limits any rights users may have under applicable consumer law.
                </p>
              </section>

              {/* Section 21 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">21. Liability</h2>
                <p className="text-slate-700 leading-relaxed">
                  To the fullest extent permitted by law, Tacholator is not liable for indirect or consequential loss, loss of profits, loss of business, loss of opportunity, loss of data, or disappointment arising from route changes, test outcomes, or content expectations. Nothing in these terms excludes liability where it cannot legally be excluded, including liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence.
                </p>
              </section>

              {/* Section 22 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">22. Governing Law</h2>
                <p className="text-slate-700 leading-relaxed">
                  These Subscription Terms &amp; Conditions are governed by the laws of England and Wales, unless applicable law in the user's country of residence requires otherwise. Any disputes shall be subject to the jurisdiction of the courts of England and Wales, unless mandatory law provides otherwise.
                </p>
              </section>

              {/* Section 23 */}
              <section>
                <h2 className="text-2xl font-bold text-[#071739] mb-4">23. Contact Us</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  If users have any questions about these Subscription Terms &amp; Conditions, they should contact:
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