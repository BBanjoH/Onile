import Link from "next/link";

export const metadata = {
  title: "Help — How to use Onile",
  description: "Simple step-by-step help for landlords and tenants using Onile.",
};

// Written for someone who has never used an app like this before, and who
// may be reading it on a phone with the text size turned up. Short
// sentences, numbered steps, no jargon, and a human to call at the bottom.

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 font-bold text-white">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-xl border-2 border-gray-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help</h1>
        <p className="text-gray-600">
          Everything on this page is written in plain English. If you are still stuck, there is a person you can call at
          the bottom.
        </p>
      </div>

      <div className="rounded-xl border-2 border-brand-100 bg-brand-50 p-5">
        <p className="font-semibold text-brand-700">Is the writing too small?</p>
        <p className="mt-1 text-gray-700">
          Look at the top of the screen for the buttons marked <strong>A</strong>, <strong>A+</strong> and{" "}
          <strong>A++</strong>. Tap <strong>A++</strong> to make everything on Onile bigger. It stays that way on this
          phone until you change it back.
        </p>
      </div>

      <Section id="landlord-start" icon="🏠" title="I own a property. How do I start?">
        <ol className="space-y-3 text-gray-800">
          <Step n={1}>
            Tap <strong>Sign up free</strong> and choose <strong>&ldquo;I own property&rdquo;</strong>. You will need
            your name, your phone number and a password.
          </Step>
          <Step n={2}>
            On your home screen, tap the green <strong>Add a Property</strong> button. Fill in where the house is, how
            many bedrooms, and how much rent you want.
          </Step>
          <Step n={3}>
            People looking for a home will now see your property and can call or WhatsApp you <strong>directly</strong>.
            No agent, and nobody takes a commission from you or from them.
          </Step>
          <Step n={4}>
            When you agree with a tenant, go to <strong>Rent &amp; Tenants</strong> and add them. From then on Onile
            remembers every rent payment for you.
          </Step>
        </ol>
      </Section>

      <Section id="rent" icon="💰" title="How does Onile help me collect rent?">
        <ul className="list-disc space-y-2 pl-5 text-gray-800">
          <li>
            Onile works out when each rent payment is due and puts it on your list <strong>by itself</strong>. You do
            not have to remember anything.
          </li>
          <li>
            When rent is late, your home screen tells you plainly: &ldquo;<em>Bisi has not paid ₦450,000 rent. It was
            due 6 days ago.</em>&rdquo;
          </li>
          <li>
            When a tenant pays you cash or by bank transfer, open the tenant and tap <strong>Mark Paid</strong>. That
            is all.
          </li>
          <li>
            If online payment is switched on, your tenant can also tap <strong>Pay Now</strong> and the money goes
            straight to you. Onile marks it paid automatically.
          </li>
        </ul>
      </Section>

      <Section id="repairs" icon="🔧" title="A tenant reported a repair. What do I do?">
        <ol className="space-y-3 text-gray-800">
          <Step n={1}>
            Tap <strong>Repairs</strong> on your home screen. You will see what is broken and how urgent it is.
          </Step>
          <Step n={2}>
            Change the box from <strong>&ldquo;New — not started&rdquo;</strong> to{" "}
            <strong>&ldquo;Being fixed now&rdquo;</strong> so your tenant knows you have seen it.
          </Step>
          <Step n={3}>
            You can type a short note, for example &ldquo;Plumber coming Thursday&rdquo;. Your tenant will see it.
          </Step>
          <Step n={4}>
            When the work is done, change the box to <strong>&ldquo;Fixed&rdquo;</strong>.
          </Step>
        </ol>
      </Section>

      <Section id="tenant" icon="🔍" title="I am looking for a place to rent">
        <ol className="space-y-3 text-gray-800">
          <Step n={1}>
            Tap <strong>Find a Home</strong> and search by area, price, or number of bedrooms.
          </Step>
          <Step n={2}>
            Read what past tenants said about the place before you pay anybody anything. This is the part agents never
            show you.
          </Step>
          <Step n={3}>
            Log in (it is free) and you will see the owner&apos;s phone number and a WhatsApp button. You are talking to
            the owner, not an agent.
          </Step>
          <Step n={4}>
            Never pay an &ldquo;agency fee&rdquo; or &ldquo;inspection fee&rdquo; to anyone on Onile. If somebody asks
            you for one, use the <strong>Report as Agent</strong> button on that property.
          </Step>
        </ol>
      </Section>

      <Section id="trust" icon="🛡️" title="How do I know a listing is really the owner?">
        <p className="text-gray-800">
          Every property shows a badge saying how far it has been checked — from not yet checked, up to{" "}
          <strong>&ldquo;Ownership document verified&rdquo;</strong>, which is the strongest. We check the{" "}
          <em>owner&apos;s</em> phone number, we call them, and we look at ownership papers. We also automatically spot
          when one phone number is pretending to be several different landlords, which is the usual sign of an agent.
        </p>
      </Section>

      <Section id="password" icon="🔑" title="I forgot my password, or I cannot log in">
        <ul className="list-disc space-y-2 pl-5 text-gray-800">
          <li>
            You can log in with <strong>either</strong> your phone number <strong>or</strong> your email — whichever you
            remember. Both work in the same box.
          </li>
          <li>
            Your phone number works however you write it: 0803 123 4567, +234 803 123 4567 — they are all the same to
            us.
          </li>
          <li>Tick &ldquo;Show my password&rdquo; to see what you are typing, in case of a mistake.</li>
          <li>If you still cannot get in, call or message us using the details below and we will help you.</li>
        </ul>
      </Section>

      <Section id="contact" icon="📞" title="Talk to a real person">
        <p className="text-gray-800">
          If anything here is confusing, that is our fault and not yours. Please reach out — we would rather help you
          than have you give up.
        </p>
        <div className="mt-4 space-y-3">
          {SUPPORT_PHONE ? (
            <>
              <a
                href={`https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                data-tap
                className="block rounded-lg bg-brand-600 px-5 py-4 text-center text-lg font-semibold text-white hover:bg-brand-700"
              >
                💬 Message us on WhatsApp
              </a>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                data-tap
                className="block rounded-lg border-2 border-brand-600 px-5 py-4 text-center text-lg font-semibold text-brand-700 hover:bg-brand-50"
              >
                📞 Call us
              </a>
            </>
          ) : (
            <p className="rounded-lg bg-amber-50 p-4 text-amber-900">
              Support contact details have not been set up yet. The site owner should set{" "}
              <code>NEXT_PUBLIC_SUPPORT_PHONE</code> and <code>NEXT_PUBLIC_SUPPORT_EMAIL</code> before launch — see
              LAUNCH.md.
            </p>
          )}
          {SUPPORT_EMAIL && (
            <a href={`mailto:${SUPPORT_EMAIL}`} data-tap className="block text-center text-lg font-medium text-brand-700 underline">
              ✉️ {SUPPORT_EMAIL}
            </a>
          )}
        </div>
      </Section>

      <p className="pt-2 text-center">
        <Link href="/" className="text-lg font-semibold text-brand-700 underline">
          ← Back to Onile
        </Link>
      </p>
    </div>
  );
}
