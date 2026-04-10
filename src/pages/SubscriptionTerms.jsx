import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const LAST_UPDATED = '10 April 2026';

const SECTIONS = [
  {
    number: '1',
    title: 'About these Subscription Terms',
    content: `These Subscription Terms & Conditions govern paid subscriptions offered through the Tacholator app and form part of the overall Tacholator Terms and Conditions. By purchasing or using a paid subscription in Tacholator, users agree to these Subscription Terms & Conditions.`,
  },
  {
    number: '2',
    title: 'Subscription Products',
    subsections: [
      {
        number: '2.1',
        title: 'Instructor Subscription',
        bullets: ['Monthly Plan: £10 per month', 'Yearly Plan: £100 per year'],
        content: `This subscription is intended for driving instructors using Tacholator's instructor features. It gives access to the relevant paid instructor features available in the app at the time of subscription.`,
      },
      {
        number: '2.2',
        title: 'Test Centre Video Subscription',
        bullets: ['£20 per month per test centre'],
        content: `This subscription gives access to video recordings and related content for an individual driving test centre. Each test centre subscription is separate. If a user wants access to more than one test centre, a separate subscription fee may apply for each test centre. Access is limited to the specific test centre selected and paid for.`,
      },
    ],
  },
  {
    number: '3',
    title: 'Eligibility',
    content: `Users must be at least 18 years old, or have legal authority to enter into a binding agreement, in order to purchase a subscription. If purchasing on behalf of a business or organisation, the user confirms they have authority to bind that business or organisation to these terms.`,
  },
  {
    number: '4',
    title: 'Billing and Payment',
    content: `All subscription fees are charged in pounds sterling (£). Payment will be taken through the payment method linked to the user's app store account or any other payment method made available by Tacholator. By starting a subscription, users authorise recurring payments for the selected subscription plan until cancelled.`,
  },
  {
    number: '5',
    title: 'Auto-Renewal',
    bullets: [
      'Monthly subscriptions renew every month',
      'Yearly subscriptions renew every year',
      'Test centre subscriptions renew monthly for each subscribed test centre',
    ],
    content: `All subscriptions renew automatically unless cancelled before the next billing date. The payment method will be charged at the start of each new billing period unless the subscription is cancelled in advance.`,
  },
  {
    number: '6',
    title: 'Free Trials and Promotional Offers',
    content: `Tacholator may offer free trials, introductory pricing, discounts, or promotional offers from time to time. Unless stated otherwise, a free trial automatically converts into a paid subscription at the end of the trial period, promotional pricing applies only for the stated promotional period, and standard pricing applies after the offer ends. Only one free trial or introductory offer may be available per user, per subscription type, unless otherwise stated. Tacholator reserves the right to modify, withdraw, or limit promotional offers where permitted by law.`,
  },
  {
    number: '7',
    title: 'Cancellation',
    content: `Users can cancel their subscription at any time through the platform where they purchased it, such as Apple App Store or Google Play account settings, or through any other method made available by Tacholator. If cancelled, the subscription will usually remain active until the end of the current paid billing period. Cancellation does not normally entitle the user to a refund for the current billing period unless required by law or stated otherwise. Users are responsible for cancelling before the renewal date if they do not want the subscription to renew.`,
  },
  {
    number: '8',
    title: 'Refunds',
    content: `Subscription payments are generally non-refundable once charged, except where required by law, stated in a specific promotional offer, or granted at Tacholator's discretion. If the subscription was purchased through Apple App Store or Google Play, refund requests may need to be made directly through that platform and will be subject to that platform's refund policies.`,
  },
  {
    number: '9',
    title: 'Price Changes',
    content: `Tacholator may change subscription prices from time to time. Where required, reasonable notice will be given before a price change takes effect. Any price change will normally apply from the next renewal date, not the current paid period already purchased. If a user does not agree with a price change, they should cancel before the next renewal date.`,
  },
  {
    number: '10',
    title: 'Access to Subscription Features and Content',
    content: `Tacholator aims to provide continuous access to subscribed features and content, but uninterrupted availability is not guaranteed at all times. Access may be affected by maintenance, updates, technical problems, internet connectivity issues, app store issues, device compatibility issues, content changes, or platform improvements. Tacholator may add, remove, improve, replace, or modify subscription features, video content, layouts, tools, or functionality from time to time.`,
  },
  {
    number: '11',
    title: 'Test Centre Video Content',
    content: `A Test Centre Video Subscription provides access only to the specific test centre content covered by that subscription. Purchase of a subscription for one test centre does not automatically include access to other test centres unless explicitly stated. Video content is provided for learning, revision, and familiarisation purposes only. It is not a guarantee of passing a driving test, the exact route used in a future driving test, or the current road layout, signage, traffic levels, roadworks, or route conditions. Users must always drive safely, follow the Highway Code, and rely on current road conditions and lawful driving practice.`,
  },
  {
    number: '12',
    title: 'Instructor Subscription Use',
    content: `Instructor subscriptions are intended only for the subscribed instructor's own professional use within Tacholator, unless expressly stated otherwise. Users must not share subscription access with others, allow unauthorised persons to use their account, resell subscription access, or misuse instructor tools in a way that breaches these terms or applicable law. Tacholator may suspend or terminate access where there is reasonable belief that an account is being misused.`,
  },
  {
    number: '13',
    title: 'Account Responsibility',
    content: `Users are responsible for maintaining the security of their account, keeping login details confidential, ensuring payment details are valid and up to date where relevant, and all activity carried out through their account. If a user believes their account has been accessed without permission, they should contact support promptly.`,
  },
  {
    number: '14',
    title: 'Failed Payments',
    content: `If a recurring payment fails, Tacholator may retry the payment, suspend access to subscription features or content, downgrade the account, or cancel the subscription if payment remains unpaid. Access to subscription features may not continue until successful payment is received.`,
  },
  {
    number: '15',
    title: 'Suspension or Termination',
    content: `Tacholator may suspend, restrict, or terminate subscription access if the user breaches these terms, misuses the app or subscription content, payment is not received, or Tacholator is required to do so for legal, security, or operational reasons. Where appropriate, access will end at the end of the current paid period. In serious cases, access may be suspended or terminated immediately.`,
  },
  {
    number: '16',
    title: 'Intellectual Property',
    content: `All subscription content, including videos, visuals, course materials, app features, branding, text, layout, and design, remains the property of Tacholator and/or its licensors. A subscription gives the user a limited, non-transferable, non-exclusive right to access the relevant content or features for personal or authorised business use during the active subscription period. Users must not copy, record, redistribute, sell, publish, sublicense, commercially exploit, or share access to subscription content without prior written permission.`,
  },
  {
    number: '17',
    title: 'No Guarantee of Outcomes',
    content: `Subscription access is provided to support learning, familiarisation, organisation, and professional use. Tacholator does not guarantee any particular result, including passing a driving test, gaining pupils or business, improved instructor earnings, uninterrupted access, or permanent availability of any specific route, video, feature, or centre.`,
  },
  {
    number: '18',
    title: 'Device and Platform Compatibility',
    content: `Users are responsible for ensuring their device, operating system, app version, and internet connection are suitable for using Tacholator and its subscription features. Tacholator is not responsible for lack of access caused by unsupported devices, outdated software, app store restrictions, or internet or network issues outside its control.`,
  },
  {
    number: '19',
    title: 'Changes to Subscription Services or Terms',
    content: `Tacholator may update these Subscription Terms & Conditions from time to time. It may also change or discontinue part of a subscription offering where reasonably necessary for business, legal, operational, or technical reasons. Where appropriate, users will be notified of material changes through the app, by email, or by another suitable method. Continued use of the subscription after updated terms take effect means acceptance of the revised terms.`,
  },
  {
    number: '20',
    title: 'Consumer Rights',
    content: `Nothing in these Subscription Terms & Conditions removes or limits any rights users may have under applicable consumer law.`,
  },
  {
    number: '21',
    title: 'Liability',
    content: `To the fullest extent permitted by law, Tacholator is not liable for indirect or consequential loss, loss of profits, loss of business, loss of opportunity, loss of data, or disappointment arising from route changes, test outcomes, or content expectations. Nothing in these terms excludes liability where it cannot legally be excluded, including liability for fraud, fraudulent misrepresentation, or death or personal injury caused by negligence.`,
  },
  {
    number: '22',
    title: 'Governing Law',
    content: `These Subscription Terms & Conditions are governed by the laws of England and Wales, unless applicable law in the user's country of residence requires otherwise. Any disputes shall be subject to the jurisdiction of the courts of England and Wales, unless mandatory law provides otherwise.`,
  },
  {
    number: '23',
    title: 'Contact Us',
    content: `If users have any questions about these Subscription Terms & Conditions, they should contact:`,
    bullets: [
      'Tacholator / Mobrage',
      'Email: [Insert contact email]',
      'Website: [Insert website]',
    ],
  },
];

function Section({ section, isOpen, onToggle }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#F7B602] bg-[#F7B602]/10 rounded-full w-7 h-7 flex items-center justify-center shrink-0">
            {section.number}
          </span>
          <span className="font-semibold text-[#071739] text-sm">{section.title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 bg-white border-t border-slate-100 space-y-4">
          {section.content && (
            <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>
          )}
          {section.bullets && (
            <ul className="space-y-1.5 pl-1">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7B602] mt-2 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          {section.subsections && section.subsections.map((sub) => (
            <div key={sub.number} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs font-bold text-[#F7B602] mb-1">{sub.number}</p>
              <h4 className="font-semibold text-[#071739] text-sm mb-2">{sub.title}</h4>
              {sub.bullets && (
                <ul className="space-y-1 mb-3">
                  {sub.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F7B602] mt-2 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-slate-600 text-sm leading-relaxed">{sub.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionTerms() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({});
  const [acknowledged, setAcknowledged] = useState(false);

  const toggleSection = (num) => {
    setOpenSections(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const expandAll = () => {
    const all = {};
    SECTIONS.forEach(s => { all[s.number] = true; });
    setOpenSections(all);
  };

  const collapseAll = () => setOpenSections({});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#071739] text-white px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F7B602]/20 flex items-center justify-center shrink-0">
              <span className="text-[#F7B602] font-bold text-lg">§</span>
            </div>
            <h1 className="text-2xl font-bold">Subscription T&Cs</h1>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-2">
            These Subscription Terms & Conditions explain how paid subscriptions in Tacholator work, including billing, renewals, cancellations, and access to subscription content.
          </p>
          <p className="text-xs text-slate-400 mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Table of contents / quick links */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sections</p>
            <div className="flex gap-3">
              <button onClick={expandAll} className="text-xs text-[#F7B602] font-medium hover:underline">Expand all</button>
              <button onClick={collapseAll} className="text-xs text-slate-400 font-medium hover:underline">Collapse all</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button
                key={s.number}
                onClick={() => {
                  setOpenSections(prev => ({ ...prev, [s.number]: true }));
                  setTimeout(() => {
                    document.getElementById(`section-${s.number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="text-xs bg-slate-100 hover:bg-[#F7B602]/10 hover:text-[#071739] text-slate-600 rounded-full px-3 py-1 transition-colors font-medium"
              >
                {s.number}. {s.title.length > 20 ? s.title.slice(0, 20) + '…' : s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="pb-6">
          {SECTIONS.map(section => (
            <div key={section.number} id={`section-${section.number}`}>
              <Section
                section={section}
                isOpen={!!openSections[section.number]}
                onToggle={() => toggleSection(section.number)}
              />
            </div>
          ))}
        </div>

        {/* Acknowledgment */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
              className="mt-0.5 data-[state=checked]:bg-[#F7B602] data-[state=checked]:border-[#F7B602]"
            />
            <label htmlFor="acknowledge" className="text-sm text-slate-600 leading-relaxed cursor-pointer select-none">
              I have read and understood the Subscription Terms & Conditions
            </label>
          </div>
          {acknowledged && (
            <div className="mt-3 flex items-center gap-2 text-emerald-600 text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              Acknowledged
            </div>
          )}
        </div>

        {/* Done button */}
        <div className="pb-10">
          <Button
            onClick={() => navigate(-1)}
            disabled={!acknowledged}
            className="w-full bg-[#F7B602] text-[#071739] hover:bg-[#d99f02] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done — I've Read the Terms
          </Button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Tick the checkbox above to confirm you have read these terms
          </p>
        </div>
      </div>
    </div>
  );
}