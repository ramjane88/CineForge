'use client';

import { useEffect, useState } from 'react';
import { useProject } from '../lib/project';
import Idea from '../components/Idea';
import Shots from '../components/Shots';
import Film from '../components/Film';
import Keys from '../components/Keys';

const TABS = [['idea', 'Idea'], ['shots', 'Shots'], ['film', 'Film'], ['keys', 'Keys']];

export default function Home() {
  const p = useProject();
  const [view, setView] = useState('idea');

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      setView(TABS.some((t) => t[0] === h) ? h : 'idea');
      window.scrollTo(0, 0);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const go = (v) => { window.location.hash = '#' + v; };
  const ready = p.project.shots.filter((s) => s.clips.length).length;

  return (
    <>
      <header className="top">
        <h1>CineForge</h1>
        <div className="right">
          <span className={'pill' + (ready ? ' good' : '')}>{ready} of {p.project.shots.length} clips</span>
          <span className="pill">{p.settings.engine === 'fal' ? 'fal.ai' : 'Free engine'}</span>
        </div>
      </header>

      <main>
        {p.full && <p className="err">This browser's storage is full, so new frames may not be kept. Delete shots you no longer need.</p>}
        {view === 'idea' && <Idea p={p} go={go} />}
        {view === 'shots' && <Shots p={p} go={go} />}
        {view === 'film' && <Film p={p} />}
        {view === 'keys' && <Keys p={p} />}
      </main>

      <nav className="tabs" aria-label="Steps">
        {TABS.map((t, i) => (
          <a key={t[0]} href={'#' + t[0]} aria-current={view === t[0] ? 'page' : undefined}>
            <b>{t[0] === 'keys' ? '00' : '0' + (i + 1)}</b>
            {t[1]}
          </a>
        ))}
      </nav>
    </>
  );
}
