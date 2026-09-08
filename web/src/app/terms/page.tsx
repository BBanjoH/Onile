export const metadata = { title: "Terms of Use" };

const OPERATOR = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "the Onile team";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

// Plain-language terms. This is a starting point written to be readable,
// not a substitute for a Nigerian lawyer reviewing it before launch — see
// LAUNCH.md, which says so explicitly.
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Terms of Use</h1>
      <p className="text-gray-600">
        These are the rules for using Onile, written plainly so you can actually read them.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">What Onile is</h2>
        <p>
          Onile is a place where property owners in Nigeria list their houses and flats, and where people looking for a
          home find them and contact the owner directly. Onile is operated by {OPERATOR}.
        </p>
        <p>
          Onile is <strong>not</strong> an estate agent. We do not act for the owner or the tenant, we do not conduct
          viewings, and we do not take a commission on any rent or sale agreed through the platform.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Your account</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>You must give true information, including your real name and a phone number that reaches you.</li>
          <li>Keep your password to yourself. Anything done from your account is treated as done by you.</li>
          <li>One account per person. You must be at least 18 years old.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Listing a property</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>You may only list a property you own, or one you are genuinely authorised to list for the owner.</li>
          <li>
            If you are posting for someone else, you must say so honestly and give the owner&apos;s real name and phone
            number.
          </li>
          <li>
            You may not charge a tenant or buyer an agency, viewing, or inspection fee for a property found on Onile.
            This is the whole point of Onile, and we remove accounts that do it.
          </li>
          <li>Descriptions, photographs, prices and availability must be accurate and kept up to date.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Reviews and reports</h2>
        <p>
          Tenants may leave honest reviews and complaints about a property they have lived in, and may report a listing
          that appears to be an agent posing as an owner. Reviews must be truthful and about the property or the letting
          experience. We remove abusive, false, or personal content.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Money</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Onile is free to list on and free to search.</li>
          <li>
            Rent agreed between a landlord and a tenant is between them. Where online payment is used, it is processed
            by Flutterwave, and their terms apply to the payment itself.
          </li>
          <li>
            Onile records payments for your convenience. If a payment is disputed, the landlord and tenant must resolve
            it between themselves, and with Flutterwave where the payment went through them.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">What we can and cannot promise</h2>
        <p>
          We check listings as described on the property pages, including verifying owners&apos; phone numbers, calling
          owners, and reviewing ownership documents. These checks reduce fraud but cannot eliminate it. Onile does not
          guarantee any listing, any person, or any transaction.
        </p>
        <p className="font-medium">
          Always view a property in person before paying any money, and never send money to someone you have not met at
          the property.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Ending your use of Onile</h2>
        <p>
          You may stop using Onile and ask us to delete your account at any time. We may suspend or remove an account
          that breaks these rules, particularly one charging agency fees or pretending to be a property&apos;s owner.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Governing law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
      </section>

      {SUPPORT_EMAIL && (
        <p className="text-gray-600">
          Questions about these terms: <a className="font-medium text-brand-700 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      )}
    </article>
  );
}
