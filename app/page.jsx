'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { DAYS } from '../lib/content';
import Path from '../components/Path';
import Studio from '../components/Studio';
import Prompts from '../components/Prompts';
import Arena from '../components/Arena';
import Folio from '../components/Folio';
import Jobs from '../components/Jobs';

const TABS = [['path', 'Path'], ['studio', 'Studio'], ['prompts', 'Prompts'], ['arena', 'Arena'], ['folio', 'Folio'], ['jobs', 'Jobs']];
const SYNC = { cloud: ['Saved', 'pill good'], saving: ['Saving', 'pill hot'], error: ['Save failed', 'pill warn'], local: ['This device', 'pill'] };

export default function Home() {
  const s = useStore();
  const [view, setView] = useState('path');
  const [account, setAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      setView(TABS.some((t) => t[0] === h) ? h : 'path');
      window.scrollTo(0, 0);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const go = (v) => { window.location.hash = '#' + v; };
  const done = DAYS.filter((d) => s.me.done['d' + d.d]).length;
  const sync = SYNC[s.sync] || SYNC.local;

  return (
    <>
      <header className="top">
        <h1>CineForge</h1>
        <div className="right">
          <span className="pill">Day {done} of 14</span>
          <span className={sync[1]}>{sync[0]}</span>
          <button type="button" className="pill" aria-expanded={account} onClick={() => setAccount(!account)}>{s.user ? 'Account' : 'Sign in'}</button>
        </div>
      </header>

      {account && (
        <div className="account">
          <div>
            {!s.cloud && <p className="note">Cloud is not configured yet, so everything is kept on this device. Add the Supabase keys to turn on accounts.</p>}
            {s.cloud && s.user && (
              <div className="row between">
                <p>Signed in as {s.user.email}</p>
                <button type="button" className="btn ghost" onClick={() => s.signOut()}>Sign out</button>
              </div>
            )}
            {s.cloud && !s.user && (
              <>
                <p className="note">No password. We email you a link. Signing in saves your progress and lets you post in the Arena.</p>
                <label className="f">
                  Email address
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </label>
                <div className="row">
                  <button type="button" className="btn" onClick={async () => setNote(await s.signIn(email.trim()))}>Get access link</button>
                  <button type="button" className="btn sec" onClick={() => s.signInGoogle()}>Continue with Google</button>
                </div>
                {note && <p className="note">{note}</p>}
              </>
            )}
          </div>
        </div>
      )}

      <main>
        {view === 'path' && <Path s={s} />}
        {view === 'studio' && <Studio s={s} go={go} />}
        {view === 'prompts' && <Prompts s={s} />}
        {view === 'arena' && <Arena s={s} />}
        {view === 'folio' && <Folio s={s} />}
        {view === 'jobs' && <Jobs s={s} />}
      </main>

      <nav className="tabs" aria-label="Stations">
        {TABS.map((t, i) => (
          <a key={t[0]} href={'#' + t[0]} aria-current={view === t[0] ? 'page' : undefined}>
            <b>{'0' + (i + 1)}</b>
            {t[1]}
          </a>
        ))}
      </nav>
    </>
  );
}
