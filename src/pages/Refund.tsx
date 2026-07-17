import React from 'react';
import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '../components/LegalPage';
import { SUPPORT_EMAIL, LEGAL_UPDATED } from '../lib/constants';

export const Refund = () => (
  <LegalPage kicker="Cancellation & refunds" title="Cancel" highlight="anytime" updated={LEGAL_UPDATED}>
    <LegalSection title="The short version">
      <p className="text-bone">
        Subscription fees are non-refundable. You can cancel at any time — your subscription then runs
        to the end of the period you have already paid for, and simply does not renew. We do not
        charge you again and we do not refund the period you have used.
      </p>
    </LegalSection>

    <LegalSection title="How to cancel">
      <p>
        Email <a className="text-flame hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from
        the address on your account, or message us on WhatsApp from your registered number. We will
        confirm in writing.
      </p>
      <p>
        Cancelling stops future billing. It does not delete your data — your gym keeps full access
        until the paid period ends. If you also want your data deleted, say so and we will do it; see
        the <Link className="text-flame hover:underline" to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalSection>

    <LegalSection title="When we do refund">
      <p>Three cases, and we do not argue about them:</p>
      <p><strong className="text-bone">Duplicate payment</strong> — you were charged twice for the same period.</p>
      <p><strong className="text-bone">Failed transaction</strong> — money left your account but the subscription was not activated.</p>
      <p><strong className="text-bone">Our error</strong> — we billed you the wrong amount, or billed you after you cancelled.</p>
      <p>
        Tell us and we will refund to the original payment method. Refunds are issued within 5–7
        working days of approval; how quickly it appears after that is up to your bank, and is
        typically another 3–5 working days.
      </p>
    </LegalSection>

    <LegalSection title="Free trial">
      <p>
        Where a plan includes a free trial, no payment is taken during the trial and you can walk away
        without owing anything. Billing starts only when the trial ends and you choose to continue.
      </p>
    </LegalSection>

    <LegalSection title="Why no pro-rata refunds">
      <p>
        We would rather say this plainly than bury it. GymSetu is priced low for the Indian market and
        billed for a period you choose up front. If you are unsure, start on the shortest billing
        cycle rather than committing to a year — that is the honest way to try us, and it costs you
        very little to walk away.
      </p>
    </LegalSection>

    <LegalSection title="Contact">
      <p>
        Questions about a charge: <a className="text-flame hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        Quote the transaction ID from your payment receipt and we will find it faster.
      </p>
    </LegalSection>
  </LegalPage>
);
