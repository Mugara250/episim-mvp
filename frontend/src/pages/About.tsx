import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, CheckCircle2, FlaskConical, Theater, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMeta } from '../api/meta';
import { useAuth } from '../context/AuthContext';

interface Section {
  title: string;
  icon: LucideIcon;
  tone: string;
  items: {label: string;text: string;}[];
}

const SECTIONS: Section[] = [
{
  title: 'What is real',
  icon: CheckCircle2,
  tone: 'text-primary bg-primary/10',
  items: [
  {
    label: 'Simulation engine',
    text: 'A stochastic SEIHFR model (community, hospital and funeral transmission) runs on the server with NumPy. Each scenario is run many times with a stored random seed, so every result can be reproduced, and results are shown as 5–95% ranges.'
  },
  {
    label: 'Geographic model structure',
    text: 'A district-level model of Rwanda’s 30 districts, each with its own SEIHFR dynamics, linked by a movement matrix.'
  },
  {
    label: 'District boundaries',
    text: 'Real boundaries of the 30 districts from geoBoundaries (gbOpen, RWA ADM2), licensed CC BY 4.0.'
  },
  {
    label: 'Rt estimation',
    text: 'The Cori et al. (2013) method with the serial interval taken from the disease preset.'
  },
  {
    label: 'Accounts and permissions',
    text: 'Password sign-in with hashed passwords, expiring tokens and server-side permission checks for the four roles.'
  },
  {
    label: 'Reports',
    text: 'PDF reports generated on the server from saved report content, with a draft → pending → approved workflow.'
  }]

},
{
  title: 'What is estimated',
  icon: FlaskConical,
  tone: 'text-amber-800 bg-amber-50',
  items: [
  {
    label: 'Disease parameters',
    text: 'Values come from published outbreak reviews and have not been reviewed for this system. Marburg is marked Provisional: few outbreaks have published data, and several values are borrowed or estimated. Each preset shows its reference.'
  },
  {
    label: 'Intervention effect sizes',
    text: 'Placeholders until an evidence review replaces them, as is the rule for combining interventions with the baseline response.'
  },
  {
    label: 'Movement between districts',
    text: 'Estimated with a gravity model from district population and distance. It is not observed travel data, and it is the largest source of uncertainty in arrival times.'
  },
  {
    label: 'Border importation risk',
    text: 'High, Medium and Low labels for neighbouring countries are configurable assumptions, not calculations from data.'
  },
  {
    label: 'Bed capacity',
    text: 'Bed numbers in the capacity profiles are illustrative figures for the demo.'
  }]

},
{
  title: 'What is mocked',
  icon: Theater,
  tone: 'text-text-secondary bg-surface-2',
  items: [
  {
    label: 'Multi-factor sign-in',
    text: 'The MFA screen is a mock step. No code is sent or checked.'
  },
  {
    label: 'Seed records',
    text: 'Scenarios, runs, hospitals, users, reports and other sample records are illustrative and were written for the demo.'
  },
  {
    label: 'Pages labelled “Demo data”',
    text: 'Anything with that label is not yet connected to the server and shows sample content.'
  },
  {
    label: 'Patient data',
    text: 'There is none. The system stores counts only; personal data is limited to user accounts.'
  }]

}];


export function About() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const { data: meta } = useMeta();
  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
        <Link to="/" className="flex items-center">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center mr-3">
            <Activity size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[16px] text-text-primary">EpiSim</span>
        </Link>
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate(status === 'authenticated' ? '/dashboard' : '/')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors">
          <ArrowLeft size={16} />
          Back
        </button>
      </header>

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <p className="text-overline text-primary uppercase mb-2">About this demo</p>
          <h1 className="text-h1 text-text-primary mb-3">What you are looking at</h1>
          <p className="text-body text-text-secondary max-w-[720px]">
            EpiSim is a decision-support tool for exploring epidemic scenarios in Rwanda, starting with Ebola and
            Marburg. This build is a demonstration for partners and expert advisers. Everything it shows is a{' '}
            <span className="font-semibold text-text-primary">scenario estimate, not a forecast</span>.
          </p>
        </div>

        <div className="bg-danger/5 border border-danger/30 rounded-xl p-5 flex items-start gap-3">
          <ShieldAlert size={20} className="text-danger flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-h3 text-text-primary mb-1">Not validated</h2>
            <p className="text-body text-text-secondary">
              The model has not been calibrated against real outbreak data and has not been reviewed by an
              epidemiologist. No claim of accuracy is made. Results explore “what if” under stated assumptions;
              the ranges describe chance, not uncertainty about the parameters themselves.
            </p>
          </div>
        </div>

        {SECTIONS.map((section) =>
        <section key={section.title} className="bg-surface rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.tone}`}>
                <section.icon size={18} />
              </div>
              <h2 className="text-h2 text-text-primary">{section.title}</h2>
            </div>
            <dl className="divide-y divide-border">
              {section.items.map((item) =>
            <div key={item.label} className="py-3 grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-6">
                  <dt className="text-[13px] font-semibold text-text-primary">{item.label}</dt>
                  <dd className="text-body text-text-secondary">{item.text}</dd>
                </div>
            )}
            </dl>
          </section>
        )}

        <section className="bg-surface rounded-xl border border-border shadow-card p-6">
          <h2 className="text-h3 text-text-primary mb-2">Where the rules come from</h2>
          <p className="text-body text-text-secondary">
            When sources disagree, the build follows the MVP brief first, then the behaviour of the original
            prototype and its permission matrix, then the project documentation. Every deviation is recorded in{' '}
            <span className="font-code text-[12px]">docs/DECISIONS.md</span>.
          </p>
          <p className="text-secondary text-text-secondary mt-4 font-code">
            {meta ?
            `App ${meta.appVersion} · engine ${meta.engineVersion} · ${meta.demoMode ? 'demo mode' : 'standard mode'}` :
            'Version information unavailable (server not reachable).'}
          </p>
          <p className="text-secondary text-text-secondary mt-1">
            Boundaries: {meta?.boundaryAttribution ?? 'geoBoundaries, CC BY 4.0'}
          </p>
        </section>
      </main>
    </div>);

}
