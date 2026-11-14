'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { fresh, freshProfile, freshRate, uid7, today, yesterday, lsGet, lsSet } from './logic';

const LSM = 'cineforge-me-v1';
const LSP = 'cineforge-profile-v1';
const LSS = 'cineforge-shared-v1';
const clone = (o) => JSON.parse(JSON.stringify(o));
const emptyVotes = () => ({ picks: {}, wins: {} });

// One hook owns all app data: private state, public profile, votes and the shared feeds.
// Signed out or with no Supabase project, everything stays in localStorage.
export function useStore() {
  const [me, setMe] = useState(fresh);
  const [profile, setProfile] = useState(freshProfile);
  const [votes, setVotes] = useState(emptyVotes);
  const [shared, setShared] = useState({ entries: [], votes: [], profiles: [], prompts: [] });
  const [user, setUser] = useState(null);
  const [sync, setSync] = useState('local');
  const ref = useRef({ me: fresh(), profile: freshProfile(), votes: emptyVotes(), user: null, timers: {}, local: [] });

  function push(kind, wait) {
    const r = ref.current;
    if (!supabase || !r.user) return;
    clearTimeout(r.timers[kind]);
    setSync('saving');
    r.timers[kind] = setTimeout(async () => {
      const id = r.user.id;
      let res;
      if (kind === 'me') res = await supabase.from('user_state').upsert({ user_id: id, data: r.me });
      else if (kind === 'profile') {
        const p = r.profile;
        res = await supabase.from('profiles').upsert({ id, name: p.name, role: p.role, bio: p.bio, skills: p.skills, reels: p.reels, updated: p.updated });
      } else res = await supabase.from('votes').upsert({ user_id: id, picks: r.votes.picks, wins: r.votes.wins });
      setSync(res.error ? 'error' : 'cloud');
    }, wait == null ? 1200 : wait);
  }

  function updateMe(fn) {
    const r = ref.current;
    const next = clone(r.me);
    fn(next);
    next.updated = Date.now();
    r.me = next;
    setMe(next);
    lsSet(LSM, next);
    push('me');
  }

  function updateProfile(fn) {
    const r = ref.current;
    const next = clone(r.profile);
    fn(next);
    next.updated = Date.now();
    r.profile = next;
    setProfile(next);
    lsSet(LSP, next);
    push('profile');
  }

  function updateVotes(fn) {
    const r = ref.current;
    const next = clone(r.votes);
    fn(next);
    r.votes = next;
    setVotes(next);
    lsSet(LSS, { entries: r.local, mine: next });
    push('votes', 300);
  }

  async function loadShared() {
    if (!supabase) return;
    const [e, v, p, pr] = await Promise.all([
      supabase.from('entries').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('votes').select('*').limit(1000),
      supabase.from('profiles').select('*').limit(200),
      supabase.from('prompts').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setShared({
      entries: (e.data || []).map((x) => ({ id: x.id, title: x.title, url: x.url, logline: x.logline, tools: x.tools, week: x.week, by: x.user_id, byName: x.by_name })),
      votes: (v.data || []).map((x) => ({ id: x.user_id, picks: x.picks || {}, wins: x.wins || {} })),
      profiles: p.data || [],
      prompts: (pr.data || []).map((x) => ({ id: x.id, title: x.title, text: x.text, by: x.user_id, byName: x.by_name })),
    });
  }

  async function pull(u) {
    const r = ref.current;
    try {
      const [a, b, c] = await Promise.all([
        supabase.from('user_state').select('data').eq('user_id', u.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', u.id).maybeSingle(),
        supabase.from('votes').select('*').eq('user_id', u.id).maybeSingle(),
      ]);
      const remote = a.data && a.data.data;
      if (remote && (remote.updated || 0) >= (r.me.updated || 0)) {
        const m = Object.assign(fresh(), remote);
        m.rate = Object.assign(freshRate(), m.rate || {});
        r.me = m;
        setMe(m);
        lsSet(LSM, m);
      } else if (r.me.updated) push('me');
      if (b.data && (b.data.updated || 0) >= (r.profile.updated || 0)) {
        const p = { name: b.data.name || '', role: b.data.role || '', bio: b.data.bio || '', skills: b.data.skills || '', reels: b.data.reels || [], updated: b.data.updated || 0 };
        r.profile = p;
        setProfile(p);
        lsSet(LSP, p);
      } else if (r.profile.updated) push('profile');
      if (c.data) {
        r.votes = { picks: c.data.picks || {}, wins: c.data.wins || {} };
        setVotes(r.votes);
      }
      setSync('cloud');
    } catch (err) {
      setSync('error');
    }
  }

  function onUser(u) {
    const r = ref.current;
    if ((r.user && r.user.id) === (u && u.id)) return;
    r.user = u;
    setUser(u);
    if (u) pull(u).then(loadShared);
    else setSync('local');
  }

  useEffect(() => {
    const r = ref.current;
    const m = Object.assign(fresh(), lsGet(LSM) || {});
    m.rate = Object.assign(freshRate(), m.rate || {});
    const p = Object.assign(freshProfile(), lsGet(LSP) || {});
    const sh = lsGet(LSS) || {};
    r.me = m;
    r.profile = p;
    r.votes = Object.assign(emptyVotes(), sh.mine || {});
    r.local = sh.entries || [];
    setMe(m);
    setProfile(p);
    setVotes(r.votes);
    if (!supabase) {
      setShared((s) => ({ ...s, entries: r.local.slice() }));
      return undefined;
    }
    loadShared();
    supabase.auth.getSession().then(({ data }) => onUser(data.session ? data.session.user : null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => onUser(session ? session.user : null));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDay(n) {
    updateMe((m) => {
      const k = 'd' + n;
      if (m.done[k]) {
        delete m.done[k];
        return;
      }
      m.done[k] = 1;
      const t = today();
      if (m.lastDone !== t) {
        m.streak = m.lastDone === yesterday() ? (m.streak || 0) + 1 : 1;
        m.lastDone = t;
      }
    });
  }

  async function submitEntry(data) {
    const r = ref.current;
    if (supabase) {
      if (!r.user) return 'Sign in to submit an entry.';
      const { error } = await supabase.from('entries').insert({ user_id: r.user.id, by_name: r.profile.name || 'Anonymous', week: data.week, title: data.title, url: data.url, logline: data.logline, tools: data.tools });
      if (error) return 'Could not submit. Try again.';
      await loadShared();
      return 'Submitted.';
    }
    r.local = r.local.concat([{ ...data, id: uid7(), by: 'local', byName: r.profile.name || 'Anonymous' }]);
    lsSet(LSS, { entries: r.local, mine: r.votes });
    setShared((s) => ({ ...s, entries: r.local.slice() }));
    return 'Submitted.';
  }

  async function deleteEntry(id) {
    const r = ref.current;
    if (supabase) {
      await supabase.from('entries').delete().eq('id', id);
      await loadShared();
      return;
    }
    r.local = r.local.filter((e) => e.id !== id);
    lsSet(LSS, { entries: r.local, mine: r.votes });
    setShared((s) => ({ ...s, entries: r.local.slice() }));
  }

  async function sharePrompt(p) {
    const r = ref.current;
    if (!supabase || !r.user) return false;
    const { error } = await supabase.from('prompts').insert({ user_id: r.user.id, by_name: r.profile.name || 'Member', title: p.title, text: p.text });
    if (!error) await loadShared();
    return !error;
  }

  async function unsharePrompt(id) {
    if (!supabase) return;
    await supabase.from('prompts').delete().eq('id', id);
    await loadShared();
  }

  async function signIn(email) {
    if (!supabase) return 'Cloud is not configured.';
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    return error ? 'Could not send the link. Check the address.' : 'Check your email for the access link.';
  }

  function signInGoogle() {
    if (supabase) supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  function signOut() {
    if (supabase) supabase.auth.signOut();
  }

  async function ai(prompt) {
    const headers = { 'content-type': 'application/json' };
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) headers.authorization = 'Bearer ' + data.session.access_token;
      }
      const res = await fetch('/api/ai', { method: 'POST', headers, body: JSON.stringify({ prompt }) });
      const j = await res.json();
      return j.text || j.error || 'The AI request failed.';
    } catch (e) {
      return 'The AI request failed. Check your connection.';
    }
  }

  async function searchJobs(q) {
    try {
      const res = await fetch('/api/jobs?q=' + encodeURIComponent(q));
      return await res.json();
    } catch (e) {
      return { jobs: [], error: 'The job search failed. Check your connection.' };
    }
  }

  function score(id) {
    const mine = user ? user.id : null;
    const all = shared.votes.filter((v) => v.id !== mine).concat([votes]);
    let n = 0;
    all.forEach((v) => {
      if (v.picks && v.picks[id]) n += 1;
      if (v.wins && v.wins[id]) n += Number(v.wins[id]) || 0;
    });
    return n;
  }

  return {
    me, profile, votes, shared, user, sync, cloud: !!supabase,
    updateMe, updateProfile, updateVotes, toggleDay,
    submitEntry, deleteEntry, sharePrompt, unsharePrompt, refresh: loadShared,
    signIn, signInGoogle, signOut, ai, searchJobs, score,
  };
}
