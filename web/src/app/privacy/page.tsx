export const metadata = { title: "Privacy Policy" };

const OPERATOR = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "the Onile team";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

// Written against the Nigeria Data Protection Act 2023 (NDPA) — the rights
// section below mirrors what that Act gives Nigerian users. As with the
// terms, LAUNCH.md is explicit that a lawyer should review this before
// launch rather than treating it as finished legal work.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="text-gray-600">What we collect, why we collect it, and what you can ask us to do about it.</p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Who holds your information</h2>
        <p>Onile is operated by {OPERATOR}, who is responsible for the personal information described here.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">What we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Your account:</strong> name, phone number, email address, and a scrambled version of your password.
            We never store your actual password and cannot read it.
          </li>
          <li>
            <strong>If you list a property:</strong> the property&apos;s address and details, photographs you provide,
            and — where you list on an owner&apos;s behalf — that owner&apos;s name and phone number.
          </li>
          <li>
            <strong>Verification documents</strong> you choose to submit to prove ownership. These are seen only by you
            and Onile staff reviewing them, never by other users.
          </li>
          <li>
            <strong>Rent and repair records:</strong> lease terms, payment dates and amounts, and maintenance requests.
          </li>
          <li>
            <strong>Reviews</strong> you write, which are shown publicly next to your name.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Why we use it</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To show your listing to people looking for a home, and to let them contact you directly.</li>
          <li>To keep track of rent, repairs and offers on your behalf, and to remind you when something is due.</li>
          <li>To check that owners are who they say they are, and to detect agents posing as landlords.</li>
          <li>To keep the platform safe and to respond to reports of misuse.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Who sees it</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Other users:</strong> your listing details and your name. Your phone number is shown only to people
            who are logged in, which is why logging in is required to make contact.
          </li>
          <li>
            <strong>Flutterwave,</strong> our payment processor, when a rent payment is made online. They receive what
            they need to process that payment.
          </li>
          <li>
            <strong>Nobody else.</strong> We do not sell your information, and we do not pass it to estate agents or
            marketers.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Your rights</h2>
        <p>Under the Nigeria Data Protection Act, you can ask us to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>show you the information we hold about you;</li>
          <li>correct anything that is wrong;</li>
          <li>delete your account and your personal information;</li>
          <li>stop using your information for a particular purpose.</li>
        </ul>
        <p>
          {SUPPORT_EMAIL ? (
            <>
              Ask by writing to{" "}
              <a className="font-medium text-brand-700 underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              . We reply within 30 days.
            </>
          ) : (
            <>Contact us using the details on the Help page. We reply within 30 days.</>
          )}
        </p>
        <p>
          Some records are kept after deletion where the law requires it — for example, records of payments made through
          the platform.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Keeping it safe</h2>
        <p>
          Connections to Onile are encrypted. Passwords are stored scrambled (hashed), so even we cannot read them.
          Access to verification documents is restricted to the person who submitted them and to staff reviewing them.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Cookies</h2>
        <p>
          Onile uses one cookie, to keep you logged in. It is not used for advertising and we do not run third-party
          tracking or advertising cookies.
        </p>
      </section>
    </article>
  );
}
