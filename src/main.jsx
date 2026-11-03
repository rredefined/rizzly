import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, MessageCircle, ImagePlus, WandSparkles, MessagesSquare, Languages, Heart, Menu, X, Copy, RefreshCw, Bookmark, Trash2, Clock3, Settings, ChevronRight, UploadCloud, Send, Zap, ShieldCheck, ArrowUpRight, Check, Instagram, MessageSquareText, Bot, Stars, Plus, SlidersHorizontal, History, Home, Camera, FileImage, AlertCircle } from 'lucide-react';
import './style.css';

const tools = [
  { id: 'rizz', name: 'Rizz Generator', desc: 'Find the right words for any moment.', icon: Sparkles, tag: 'Popular' },
  { id: 'scanner', name: 'Chat Screenshot Scanner', desc: 'Upload a chat and understand what to say next.', icon: ImagePlus, tag: 'Vision AI' },
  { id: 'reply', name: 'Reply Assistant', desc: 'Turn a received message into a natural reply.', icon: MessageCircle },
  { id: 'convreply', name: 'Conversation Reply Suggester', desc: 'Paste a chat and get context-aware replies to the latest message.', icon: MessagesSquare, tag: 'NEW' },
  { id: 'starters', name: 'Conversation Starters', desc: 'Start a conversation without the awkwardness.', icon: MessagesSquare },
  { id: 'translate', name: 'Rizz Translator', desc: 'Give your message a different vibe.', icon: Languages },
  { id: 'wingman', name: 'AI Wingman', desc: 'Talk through the situation and get advice.', icon: Bot },
  { id: 'pickup', name: 'Lines & Bios', desc: 'Create playful lines and social bios.', icon: Heart }
];
const starterResult = { summary: 'Your ideas will appear here.', replies: [] };
const readStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

async function optimizeScreenshot(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1500;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const toBlob = quality => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    let blob = await toBlob(0.72);
    if (blob && blob.size > 700 * 1024) blob = await toBlob(0.55);
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.(png|jpe?g|webp)$/i, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function App() {
  const [active, setActive] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [person, setPerson] = useState('Someone I like');
  const [language, setLanguage] = useState('Hinglish');
  const [tone, setTone] = useState('Natural & casual');
  const [length, setLength] = useState('Short');
  const [intensity, setIntensity] = useState('Subtle');
  const [mode, setMode] = useState('Standard');
  const [interests, setInterests] = useState('');
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(starterResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => readStore('rizzly_saved', []));
  const [history, setHistory] = useState(() => readStore('rizzly_history', []));
  const [copied, setCopied] = useState('');
  const [settings, setSettings] = useState(() => readStore('rizzly_settings', { displayName: '', defaultLanguage: 'Hinglish' }));
  const fileInput = useRef(null);
  const currentTool = tools.find(t => t.id === active);
  const isTool = Boolean(currentTool);

  useEffect(() => localStorage.setItem('rizzly_saved', JSON.stringify(saved)), [saved]);
  useEffect(() => localStorage.setItem('rizzly_history', JSON.stringify(history.slice(0, 60))), [history]);
  useEffect(() => localStorage.setItem('rizzly_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => { if (active === 'home') { setPrompt(''); setFiles([]); setError(''); } }, [active]);

  const go = id => { setActive(id); setMobileOpen(false); setResult(starterResult); setError(''); setFiles([]); };
  const addFiles = incoming => {
    const next = Array.from(incoming || []).filter(f => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type));
    setFiles(prev => [...prev, ...next].slice(0, 3));
    if (next.length !== Array.from(incoming || []).length) setError('Only PNG, JPG, and WEBP screenshots are supported.');
    if (Array.from(incoming || []).length + files.length > 3) setError('Groq vision supports up to 3 screenshots per scan.');
  };
  const generate = async () => {
    if (active === 'scanner' && !files.length) { setError('Upload at least one chat screenshot first.'); return; }
    if (active !== 'scanner' && !prompt.trim()) { setError('Add a little context so RIZZLY can help.'); return; }
    setLoading(true); setError(''); setResult(starterResult);
    try {
      const body = new FormData();
      body.append('task', active);
      body.append('prompt', prompt);
      body.append('context', context);
      body.append('person', person);
      body.append('language', language);
      body.append('tone', tone);
      body.append('length', length);
      body.append('intensity', intensity);
      body.append('mode', mode);
      body.append('interests', interests);
      const optimizedFiles = active === 'scanner' ? await Promise.all(files.map(optimizeScreenshot)) : files;
      if (optimizedFiles.some(file => file.size > 1024 * 1024)) throw new Error('A screenshot is too large to upload. Try cropping it or uploading fewer images.');
      optimizedFiles.forEach((file, i) => body.append('screenshots', file, file.name || `chat-${i + 1}.jpg`));
      const response = await fetch('/api/generate', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not generate a response.');
      const normalized = { ...data, replies: Array.isArray(data.replies) ? data.replies : [] };
      setResult(normalized);
      setHistory(prev => [{ id: crypto.randomUUID(), tool: active, title: currentTool?.name || 'AI result', prompt: prompt || 'Screenshot analysis', summary: normalized.summary || '', replies: normalized.replies, date: new Date().toISOString() }, ...prev].slice(0, 60));
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };
  const copy = async (text, id) => { try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1400); } catch { setError('Clipboard access was blocked by your browser.'); } };
  const toggleSave = reply => {
    const text = typeof reply === 'string' ? reply : reply.text;
    setSaved(prev => prev.some(x => x.text === text) ? prev.filter(x => x.text !== text) : [{ id: crypto.randomUUID(), text, label: reply.label || 'Saved reply', date: new Date().toISOString() }, ...prev]);
  };
  const isSaved = reply => saved.some(x => x.text === (typeof reply === 'string' ? reply : reply.text));

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={21}/></div><div><div className="brand-name">RIZZLY<span>✦</span></div><div className="brand-caption">YOUR AI WINGMAN</div></div><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={19}/></button></div>
      <button className={`nav-link ${active === 'home' ? 'active' : ''}`} onClick={() => go('home')}><Home size={18}/> Overview</button>
      <div className="nav-label">YOUR TOOLKIT</div>
      {tools.map(t => <button key={t.id} className={`nav-link ${active === t.id ? 'active' : ''}`} onClick={() => go(t.id)}><t.icon size={18}/><span>{t.name}</span>{t.tag && <span className="nav-tag">{t.tag === 'Popular' ? 'HOT' : 'AI'}</span>}</button>)}
      <div className="sidebar-bottom"><div className="mini-card"><div className="mini-icon"><Zap size={16}/></div><div><b>Keep it genuine.</b><p>Good conversations go both ways.</p></div></div><button className={`nav-link ${active === 'saved' ? 'active' : ''}`} onClick={() => go('saved')}><Bookmark size={18}/> Saved replies <span className="count">{saved.length}</span></button><button className={`nav-link ${active === 'history' ? 'active' : ''}`} onClick={() => go('history')}><History size={18}/> History</button><button className={`nav-link ${active === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}><Settings size={18}/> Settings</button><div className="developer-mini">Made with care by <b>Rekaixp</b></div></div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/><span>{currentTool?.name || ({home:'Overview',saved:'Saved replies',history:'History',settings:'Settings'}[active])}</span></div><div className="topbar-right"><span className="status-dot"/> AI assistant ready <div className="avatar">R</div></div></header>
      <div className="page-content">
        {active === 'home' && <HomePage go={go}/>}
        {isTool && <ToolPage tool={currentTool} prompt={prompt} setPrompt={setPrompt} context={context} setContext={setContext} person={person} setPerson={setPerson} language={language} setLanguage={setLanguage} tone={tone} setTone={setTone} length={length} setLength={setLength} intensity={intensity} setIntensity={setIntensity} interests={interests} setInterests={setInterests} mode={mode} setMode={setMode} files={files} addFiles={addFiles} removeFile={i => setFiles(prev => prev.filter((_,x) => x !== i))} fileInput={fileInput} generate={generate} loading={loading} error={error} result={result} copy={copy} copied={copied} toggleSave={toggleSave} isSaved={isSaved}/>}
        {active === 'saved' && <SavedPage saved={saved} toggleSave={toggleSave} copy={copy} copied={copied}/>}
        {active === 'history' && <HistoryPage history={history} clear={() => { if (confirm('Clear all RIZZLY history from this browser?')) setHistory([]); }} copy={copy} copied={copied}/>}
        {active === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} clear={() => { if (confirm('Delete saved replies and history from this browser?')) { setSaved([]); setHistory([]); } }}/>}
      </div>
      <footer className="footer"><span>© {new Date().getFullYear()} RIZZLY</span><span>Crafted with care by <b>Rekaixp</b></span><span className="footer-safe"><ShieldCheck size={13}/> Respect first. Always.</span></footer>
    </main>
  </div>;
}

function HomePage({ go }) {
  return <div className="home-page">
    <div className="hero"><div className="hero-orb orb-one"/><div className="hero-orb orb-two"/><div className="eyebrow"><span className="eyebrow-pulse"/> YOUR PERSONAL AI WINGMAN</div><h1>Never run out<br/>of <span className="gradient-text">rizz.</span></h1><p className="hero-copy">Better replies. Smoother conversations. A little help finding the right words — whenever you need it.</p><div className="hero-actions"><button className="primary-btn" onClick={() => go('rizz')}>Generate rizz <ArrowUpRight size={17}/></button><button className="secondary-btn" onClick={() => go('scanner')}><ImagePlus size={17}/> Scan a chat</button></div><div className="hero-proof"><div className="proof-avatars"><i>R</i><i>✦</i><i>♡</i></div><span>Made for real conversations, not copy-paste lines.</span></div><div className="hero-demo"><div className="demo-head"><div className="demo-lights"><i/><i/><i/></div><span>RIZZLY / REPLY PREVIEW</span><span className="demo-live">LIVE DEMO</span></div><div className="demo-chat"><div className="chat-bubble received">so what are you doing this weekend?</div><div className="chat-bubble sent"><span className="bubble-label">RIZZLY SUGGESTION</span>Probably finding a good reason to keep this conversation going.</div></div><div className="demo-bottom"><span><Sparkles size={13}/> Generated to sound like you</span><span>01 / 03</span></div></div></div>
    <section className="section-block"><div className="section-heading"><div><div className="eyebrow">THE TOOLKIT</div><h2>One wingman. <span className="muted-gradient">Seven ways to connect.</span></h2><p>From the first hello to figuring out what to say next.</p></div><button className="text-btn" onClick={() => go('rizz')}>Explore tools <ArrowUpRight size={15}/></button></div><div className="tool-grid">{tools.map((t,i) => <button className={`tool-card card-${i}`} key={t.id} onClick={() => go(t.id)}><div className="tool-card-top"><div className="tool-icon"><t.icon size={20}/></div>{t.tag && <span className="tool-pill">{t.tag}</span>}<ArrowUpRight className="card-arrow" size={17}/></div><h3>{t.name}</h3><p>{t.desc}</p></button>)}</div></section>
    <section className="bottom-banner"><div className="banner-spark"><Stars size={23}/></div><div><h3>Your next message can be a good one.</h3><p>Start with a little context. RIZZLY will help with the words.</p></div><button className="primary-btn" onClick={() => go('scanner')}>Try chat scanner <ChevronRight size={17}/></button></section>
    <div className="home-note"><ShieldCheck size={16}/><span>Your conversations are personal. Screenshots are processed for analysis and are not saved to a public feed.</span></div>
  </div>;
}

function ToolPage({ tool, prompt, setPrompt, context, setContext, person, setPerson, language, setLanguage, tone, setTone, length, setLength, intensity, setIntensity, interests, setInterests, mode, setMode, files, addFiles, removeFile, fileInput, generate, loading, error, result, copy, copied, toggleSave, isSaved }) {
  const scanner = tool.id === 'scanner';
  const [dragging, setDragging] = useState(false);
  return <div className="tool-page"><div className="tool-intro"><div className="tool-icon large"><tool.icon size={23}/></div><div><div className="eyebrow">RIZZLY TOOLKIT</div><h1>{tool.name}</h1><p>{tool.desc}</p></div></div>
    <div className="workspace-grid"><section className="input-panel"><div className="panel-title"><div><span className="step-number">01</span><b>{scanner ? 'Upload your conversation' : 'Give us a little context'}</b></div><span className="optional-label">{scanner ? 'UP TO 3 IMAGES' : 'PERSONALIZE IT'}</span></div>
      {scanner ? <><div className={`upload-zone ${dragging ? 'dragging' : ''}`} onDragOver={e => {e.preventDefault();setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}} onClick={() => fileInput.current?.click()}><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={e => {addFiles(e.target.files);e.target.value='';}}/><div className="upload-icon"><UploadCloud size={25}/></div><b>Drop chat screenshots here</b><p>or <span>browse files</span> from your device</p><small>PNG, JPG or WEBP · Up to 3 images · Optimized before upload</small></div>{files.length > 0 && <div className="file-list">{files.map((f,i) => <div className="file-chip" key={`${f.name}-${i}`}><FileImage size={16}/><span>{f.name || `Screenshot ${i+1}`}</span><button onClick={() => removeFile(i)} aria-label="Remove screenshot"><X size={14}/></button></div>)}</div>}<div className="privacy-hint"><ShieldCheck size={15}/><span>Only use screenshots you have permission to share. Images are processed for this request, not added to a public gallery.</span></div></> : <><label className="field-label">{tool.id === 'translate' ? 'Your message' : tool.id === 'starters' ? 'Who do you want to start a conversation with?' : tool.id === 'pickup' ? 'What are you creating?' : tool.id === 'wingman' ? 'Tell your wingman what happened' : tool.id === 'reply' ? 'What did they say?' : tool.id === 'convreply' ? 'Paste the recent conversation' : 'What is the situation?'}</label><textarea className="main-textarea" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={(tool.id === 'reply' || tool.id === 'convreply') ? 'Paste the recent chat here, with names if possible...' : tool.id === 'translate' ? 'Type a message you want to transform...' : tool.id === 'starters' ? 'e.g. Someone from my class who likes movies...' : tool.id === 'pickup' ? 'e.g. A funny Instagram bio about loving music...' : tool.id === 'wingman' ? 'e.g. We were talking about music and they said...' : 'e.g. They sent me a cute reel and I want to reply...'} rows={5}/><label className="field-label extra-label">Extra context <span>OPTIONAL</span></label><textarea className="context-textarea" value={context} onChange={e => setContext(e.target.value)} placeholder="Anything else RIZZLY should know?" rows={2}/>{tool.id === 'convreply' && <div className="privacy-hint"><ShieldCheck size={15}/><span>Paste only messages you have permission to share. RIZZLY will focus on the latest message and won't assume anyone's feelings.</span></div>}{tool.id === 'rizz' && <div className="field-group"><label className="field-label">Who are you texting?</label><select value={person} onChange={e => setPerson(e.target.value)}><option>Someone I like</option><option>My crush</option><option>Girlfriend / Boyfriend</option><option>Friend</option><option>Someone new</option></select></div>}{tool.id === 'starters' && <div className="field-group"><label className="field-label">Their interests <span>OPTIONAL</span></label><input value={interests} onChange={e => setInterests(e.target.value)} placeholder="Music, movies, gaming..."/></div>}</>}
      <div className="form-divider"/><div className="settings-row"><div className="field-group"><label className="field-label">Language</label><select value={language} onChange={e => setLanguage(e.target.value)}><option>Hinglish</option><option>English</option><option>Hindi</option></select></div><div className="field-group"><label className="field-label">Reply length</label><select value={length} onChange={e => setLength(e.target.value)}><option>Short</option><option>Medium</option><option>Long</option></select></div></div><div className="field-group tone-group"><label className="field-label">Tone</label><div className="tone-options">{['Natural & casual','Flirty','Funny','Sweet','Confident','Playful'].map(t => <button key={t} className={`tone-chip ${tone === t ? 'selected' : ''}`} onClick={() => setTone(t)}>{t}</button>)}</div></div><div className="settings-row"><div className="field-group"><label className="field-label">Intensity</label><select value={intensity} onChange={e => setIntensity(e.target.value)}><option>Subtle</option><option>Moderate</option><option>Bold</option></select></div><div className="field-group"><label className="field-label">Mode</label><select value={mode} onChange={e => setMode(e.target.value)}><option>Standard</option><option>Freaky (playful, non-explicit)</option><option>Midnight</option></select></div></div>
      {error && <div className="error-box"><AlertCircle size={16}/>{error}</div>}<button className="generate-btn" onClick={generate} disabled={loading}>{loading ? <><span className="spinner"/> {scanner ? 'Reading conversation...' : 'Thinking of something good...'}</> : <><Sparkles size={17}/> {scanner ? 'Scan conversation' : tool.id === 'convreply' ? 'Suggest replies' : 'Generate with RIZZLY'} <ArrowUpRight size={17}/></>}</button><div className="secure-caption"><ShieldCheck size={13}/> No account needed · Screenshots are processed for this request only.</div>
    </section>
    <section className="results-panel"><div className="results-head"><div><span className="step-number">02</span><b>{scanner ? 'Conversation insights' : tool.id === 'convreply' ? 'Replies to keep the chat going' : 'Your suggestions'}</b></div><span className="result-ai"><span className="status-dot"/> AI RESULTS</span></div>{loading ? <div className="loading-state"><div className="loading-orbit"><Sparkles size={25}/></div><h3>{scanner ? 'Reading the conversation' : 'Finding the right words'}</h3><p>{scanner ? 'Looking at the messages and piecing together the context.' : 'Putting together a few natural options for you.'}</p><div className="loading-bars"><i/><i/><i/></div></div> : result.replies.length ? <div className="result-content">{result.summary && <div className="summary-card"><div className="summary-label"><Sparkles size={14}/> RIZZLY'S TAKE</div><p>{result.summary}</p>{result.mood && <span className="mood-tag">Mood: {result.mood}</span>}{result.latestMessage && <div className="latest-message"><small>LATEST VISIBLE MESSAGE</small><b>{result.latestMessage}</b></div>}{result.caveat && <small className="caveat">{result.caveat}</small>}</div>}<div className="reply-list">{result.replies.map((r,i) => <div className="reply-card" key={`${r.text}-${i}`}><div className="reply-card-head"><span className="reply-index">0{i+1}</span><b>{r.label || `Option ${i+1}`}</b><div className="reply-actions"><button className="icon-btn small" onClick={() => toggleSave(r)} title="Save reply"><Bookmark size={15} fill={isSaved(r) ? 'currentColor' : 'none'}/></button><button className="icon-btn small" onClick={() => copy(r.text, `reply-${i}`)} title="Copy reply">{copied === `reply-${i}` ? <Check size={15}/> : <Copy size={15}/>}</button></div></div><p>{r.text}</p></div>)}</div><button className="again-btn" onClick={generate} disabled={loading}><RefreshCw size={15}/> Generate another set</button></div> : <div className="empty-results"><div className="empty-art"><div className="empty-art-ring"><Sparkles size={27}/></div><i className="float-dot dot-a"/><i className="float-dot dot-b"/><i className="float-dot dot-c"/></div><h3>Your next great reply starts here.</h3><p>{scanner ? 'Upload screenshots of your chat and RIZZLY will help you understand the flow and find a natural next message.' : 'Add a little context on the left. We’ll give you a few different ways to say it.'}</p><div className="empty-tip"><Zap size={14}/> Pro tip: The more context you share, the more personal the suggestions.</div></div>}</section></div>
  </div>;
}

function SavedPage({ saved, toggleSave, copy, copied }) { return <div className="list-page"><div className="eyebrow">YOUR COLLECTION</div><h1>Saved replies<span className="title-count">{saved.length}</span></h1><p className="page-subtitle">The lines you want to keep close.</p>{saved.length ? <div className="saved-grid">{saved.map((r,i) => <div className="saved-card" key={r.id}><div className="saved-card-top"><span>RIZZLY NOTE · {String(i+1).padStart(2,'0')}</span><button className="icon-btn small" onClick={() => toggleSave(r)}><Trash2 size={15}/></button></div><p>{r.text}</p><div className="saved-card-bottom"><span>{new Date(r.date).toLocaleDateString()}</span><button className="text-btn" onClick={() => copy(r.text,r.id)}>{copied === r.id ? <Check size={14}/> : <Copy size={14}/>} {copied === r.id ? 'Copied' : 'Copy'}</button></div></div>)}</div> : <EmptyPage icon={Bookmark} title="Nothing saved just yet" text="When you find a reply you like, save it and it’ll be waiting here."/>}</div>; }
function HistoryPage({ history, clear, copy, copied }) { return <div className="list-page"><div className="eyebrow">YOUR ACTIVITY</div><div className="list-title-row"><div><h1>History<span className="title-count">{history.length}</span></h1><p className="page-subtitle">A little memory of what RIZZLY helped you with.</p></div>{history.length > 0 && <button className="secondary-btn compact" onClick={clear}><Trash2 size={15}/> Clear history</button>}</div>{history.length ? <div className="history-list">{history.map(item => <div className="history-item" key={item.id}><div className="history-icon"><Clock3 size={17}/></div><div className="history-main"><div className="history-meta"><b>{item.title}</b><span>{new Date(item.date).toLocaleString()}</span></div><p>{item.prompt}</p><small>{item.replies?.length || 0} suggestions · {item.summary}</small>{item.replies?.[0] && <div className="history-preview">“{item.replies[0].text}”</div>}</div>{item.replies?.[0] && <button className="icon-btn" onClick={() => copy(item.replies[0].text,item.id)}>{copied === item.id ? <Check size={16}/> : <Copy size={16}/>}</button>}</div>)}</div> : <EmptyPage icon={History} title="No history yet" text="Your recent generations will show up here automatically."/>}</div>; }
function SettingsPage({ settings, setSettings, clear }) { return <div className="list-page settings-page"><div className="eyebrow">MAKE IT YOURS</div><h1>Settings</h1><p className="page-subtitle">A few preferences to make RIZZLY feel more like you.</p><div className="settings-card"><div className="settings-card-title"><div className="tool-icon"><SlidersHorizontal size={19}/></div><div><b>Personal preferences</b><p>These are saved only in this browser.</p></div></div><label className="field-label">What should RIZZLY call you?</label><input value={settings.displayName} onChange={e => setSettings(s => ({...s,displayName:e.target.value}))} placeholder="Your name or nickname"/><label className="field-label settings-label">Default language</label><select value={settings.defaultLanguage} onChange={e => setSettings(s => ({...s,defaultLanguage:e.target.value}))}><option>Hinglish</option><option>English</option><option>Hindi</option></select><div className="settings-card-title privacy-title"><div className="tool-icon"><ShieldCheck size={19}/></div><div><b>Privacy & local data</b><p>No account. Your saved replies and history stay in this browser.</p></div></div><button className="danger-btn" onClick={clear}><Trash2 size={15}/> Clear saved replies & history</button></div><div className="about-card"><div className="brand-mark"><Sparkles size={20}/></div><div><b>RIZZLY</b><p>Never Run Out of Rizz.</p><small>Built with care by <strong>Rekaixp</strong>.</small></div><span>v1.0.0</span></div></div>; }
function EmptyPage({ icon: Icon, title, text }) { return <div className="generic-empty"><div className="empty-art"><div className="empty-art-ring"><Icon size={25}/></div></div><h3>{title}</h3><p>{text}</p></div>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
