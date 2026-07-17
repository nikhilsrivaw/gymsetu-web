import React from 'react';
import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '../components/LegalPage';
import { SUPPORT_EMAIL, LEGAL_ENTITY, LEGAL_ADDRESS, LEGAL_UPDATED } from '../lib/constants';

export const Privacy = () => (
  <LegalPage kicker="Privacy policy" title="Your data," highlight="plainly" updated={LEGAL_UPDATED}>
    <LegalSection title="Who we are">
      <p>
        GymSetu is gym management software operated by {LEGAL_ENTITY} ({LEGAL_ADDRESS}). This policy
        explains what we collect, why, and who else touches it.
      </p>
      <p>
        <strong className="text-bone">Two different relationships matter here.</strong> If you are a{' '}
        <strong className="text-bone">gym owner</strong>, you are our customer and we handle your data
        directly. If you are a <strong className="text-bone">gym member</strong>, your gym decides what
        to record about you and why — we only store and process it on their instructions. Requests about
        member data should go to your gym first; we act on their behalf.
      </p>
    </LegalSection>

    <LegalSection title="What we collect">
      <p><strong className="text-bone">Gym owner accounts:</strong> name, email address, phone number, gym name and address, and your subscription and payment history.</p>
      <p><strong className="text-bone">Member records, entered by the gym:</strong> name, phone number, email address, date of birth, gender, address, and a profile photo if one is uploaded.</p>
      <p><strong className="text-bone">Membership and money:</strong> plans, start and end dates, payment amounts, method (cash, UPI, card, bank transfer), and dates. We never see or store card numbers — see “Payments” below.</p>
      <p><strong className="text-bone">Attendance:</strong> check-in date and time. If a member checks in using the GPS feature, their device location is compared to the gym’s location at that moment to confirm they are on site. We store the resulting check-in, not a location history or any ongoing tracking.</p>
      <p><strong className="text-bone">Fitness data, if the gym or member uses those features:</strong> weight, body measurements, workout logs, diet plans and progress notes.</p>
      <p>We do not sell personal data. We do not use it for advertising.</p>
    </LegalSection>

    <LegalSection title="Who else processes it">
      <p>We keep this list short on purpose, and it is complete:</p>
      <p><strong className="text-bone">PayU</strong> — subscription payments from gym owners. Card and bank details are entered on PayU’s systems and never reach ours; we receive only the outcome of a transaction.</p>
      <p><strong className="text-bone">Meta (WhatsApp Business API)</strong> — sends membership reminders (for example, a plan expiring in three days). The member’s phone number and name are shared with Meta to deliver the message.</p>
      <p><strong className="text-bone">Groq</strong> — powers the AI assistant features. When an AI feature is used, the content of that request is sent to Groq for processing. Do not paste anything into AI features that you would not want processed by a third party.</p>
      <p><strong className="text-bone">Amazon Web Services (Mumbai, ap-south-1)</strong> — hosts the database and application. Your data is stored in India.</p>
    </LegalSection>

    <LegalSection title="Where it lives and how long">
      <p>Data is stored on servers in Mumbai, India. Encrypted backups are taken nightly, retained for 14 days on the server and copied to private storage in the same region.</p>
      <p>We keep data for as long as the gym’s account is active. If an account closes, tell us and we will delete it; residual copies may persist in backups until those backups age out (up to 14 days locally, and until the offsite retention period elapses).</p>
    </LegalSection>

    <LegalSection title="How it’s protected">
      <p>All traffic runs over HTTPS. The database enforces per-row access rules so that one gym cannot read another gym’s data, and members can only see their own records — not other members’.</p>
      <p>We are describing what we do, not making a guarantee. No system is immune. If we become aware of a breach affecting your data, we will tell you.</p>
    </LegalSection>

    <LegalSection title="Your rights">
      <p>Under India’s Digital Personal Data Protection Act, 2023, you can ask to access, correct or delete your personal data, and withdraw consent.</p>
      <p><strong className="text-bone">Members:</strong> ask your gym — they control your record and can edit or remove it directly.</p>
      <p><strong className="text-bone">Gym owners:</strong> email <a className="text-flame hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will respond within 30 days.</p>
    </LegalSection>

    <LegalSection title="Children">
      <p>GymSetu is sold to gym businesses, not to individuals under 18. If a gym records a member under 18, the gym is responsible for obtaining verifiable consent from a parent or guardian as the DPDP Act requires.</p>
    </LegalSection>

    <LegalSection title="Changes and contact">
      <p>If we change this policy we will update the date at the top. Material changes will be notified to gym owners by email.</p>
      <p>
        Questions: <a className="text-flame hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. See also our{' '}
        <Link className="text-flame hover:underline" to="/terms">Terms of Service</Link> and{' '}
        <Link className="text-flame hover:underline" to="/refund">Refund Policy</Link>.
      </p>
    </LegalSection>
  </LegalPage>
);
