'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TypewriterText from './TypewriterText';
import {
  helpText,
  getSectionContent,
  VALID_SECTIONS,
  PRESET_COLORS,
  projectsList,
  projectDetails,
  PROJECT_NAMES,
} from '@/data/portfolioData';

/* ─── Constants ─────────────────────────────────────────── */
const WELCOME      = "Welcome to Souvik Moitra's Life😊";
const DEFAULT_COLOR = '#00ff41';
const PROMPT_USER  = 'visitor';
const PROMPT_HOST  = 'souvik-portfolio';

/* ─── Helpers ───────────────────────────────────────────── */
let _id = 0;
const uid = () => ++_id;

function buildEntry(type, content, pathStack) {
  return { id: uid(), type, content, pathStack: [...pathStack] };
}

/* ── Path stack helpers ────────────────────────────────── */
// pathStack = []                  → ~
// pathStack = ['projects']        → ~/projects
// pathStack = ['projects','taskflow'] → ~/projects/taskflow
function pathDisplay(stack) {
  if (!stack.length) return '~';
  return '~/' + stack.join('/');
}

/* ─── Terminal Component ────────────────────────────────── */
export default function Terminal() {
  const [history, setHistory]       = useState([]);
  const [input, setInput]           = useState('');
  const [textColor, setTextColor]   = useState(DEFAULT_COLOR);
  const [pathStack, setPathStack]   = useState([]);     // navigation stack
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx]       = useState(-1);
  const [welcomed, setWelcomed]     = useState(false);
  const [busyId, setBusyId]         = useState(null);

  const inputRef  = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Seed welcome */
  useEffect(() => {
    const welcomeEntry = buildEntry('welcome', WELCOME, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory([welcomeEntry]);
    setBusyId(welcomeEntry.id);
  }, []);

  /* Build prompt string from current pathStack */
  const prompt = useMemo(
    () => `${PROMPT_USER}@${PROMPT_HOST}:${pathDisplay(pathStack)}$`,
    [pathStack],
  );

  /* ── Command execution ─────────────────────────────────── */
  const execute = useCallback(
    (raw) => {
      const cmd = raw.trim();
      if (!cmd) return;

      setCmdHistory((h) => [cmd, ...h]);
      setHistIdx(-1);

      const cmdEntry = buildEntry('command', cmd, pathStack);

      /* ── clear ── */
      if (cmd === 'clear') {
        setHistory([]);
        setPathStack([]);
        return;
      }

      /* ── help ── */
      if (cmd === 'help') {
        const out = buildEntry('typewriter', helpText, pathStack);
        setHistory((h) => [...h, cmdEntry, out]);
        setBusyId(out.id);
        return;
      }

      /* ── text_color ── */
      if (cmd.startsWith('text_color ')) {
        const val      = cmd.slice(11).trim().toLowerCase();
        const resolved = PRESET_COLORS[val] ?? val;
        setTextColor(resolved);
        const out = buildEntry('output', `Text color changed to  ${val}  (${resolved})`, pathStack);
        setHistory((h) => [...h, cmdEntry, out]);
        return;
      }

      /* ── cd (no arg) — show current path ── */
      if (cmd === 'cd') {
        const msg = `Current path: ${pathDisplay(pathStack)}`;
        const out = buildEntry('output', msg, pathStack);
        setHistory((h) => [...h, cmdEntry, out]);
        return;
      }

      /* ── cd .. — go up one level ── */
      if (cmd === 'cd ..') {
        if (pathStack.length === 0) {
          const out = buildEntry('error', "Already at root (~). Can't go up further.", pathStack);
          setHistory((h) => [...h, cmdEntry, out]);
          return;
        }

        const newStack = pathStack.slice(0, -1);

        // If going back into projects/, re-display the project list
        if (newStack.length === 1 && newStack[0] === 'projects') {
          setPathStack(newStack);
          const out = buildEntry('typewriter', projectsList, newStack);
          setHistory((h) => [...h, cmdEntry, out]);
          setBusyId(out.id);
        } else {
          setPathStack(newStack);
          const label = newStack.length ? newStack[newStack.length - 1] : 'root (~)';
          const out   = buildEntry('output', `Moved to: ${pathDisplay(newStack)}`, newStack);
          setHistory((h) => [...h, cmdEntry, out]);
        }
        return;
      }

      /* ── cd <target> ── */
      if (cmd.startsWith('cd ')) {
        const target = cmd.slice(3).trim().toLowerCase();

        /* ── Inside a project detail (depth 2) — no deeper navigation ── */
        if (pathStack.length === 2 && pathStack[0] === 'projects') {
          const out = buildEntry(
            'error',
            `You are inside a project. Use  cd ..  to go back to projects.`,
            pathStack,
          );
          setHistory((h) => [...h, cmdEntry, out]);
          return;
        }

        /* ── Inside projects/ (depth 1) — navigate to a project ── */
        if (pathStack.length === 1 && pathStack[0] === 'projects') {
          if (PROJECT_NAMES.includes(target)) {
            const newStack = ['projects', target];
            setPathStack(newStack);
            const out = buildEntry('typewriter', projectDetails[target], newStack);
            setHistory((h) => [...h, cmdEntry, out]);
            setBusyId(out.id);
          } else {
            const out = buildEntry(
              'error',
              `No project named '${target}'.\nAvailable: ${PROJECT_NAMES.join(' | ')}`,
              pathStack,
            );
            setHistory((h) => [...h, cmdEntry, out]);
          }
          return;
        }

        /* ── At root — navigate to a top-level section ── */
        if (!VALID_SECTIONS.includes(target)) {
          const out = buildEntry(
            'error',
            `cd: '${target}': No such section.\nType  help  to see available sections.`,
            pathStack,
          );
          setHistory((h) => [...h, cmdEntry, out]);
          return;
        }

        const newStack = [target];
        setPathStack(newStack);

        if (target === 'projects') {
          const out = buildEntry('typewriter', projectsList, newStack);
          setHistory((h) => [...h, cmdEntry, out]);
          setBusyId(out.id);
        } else {
          const content = getSectionContent(target);
          const out     = buildEntry('typewriter', content, newStack);
          setHistory((h) => [...h, cmdEntry, out]);
          setBusyId(out.id);
        }
        return;
      }

      /* ── Unknown command ── */
      const out = buildEntry(
        'error',
        `Command not found: '${cmd}'\nType  help  to see available commands.`,
        pathStack,
      );
      setHistory((h) => [...h, cmdEntry, out]);
    },
    [pathStack],
  );

  /* ── Input key handlers ────────────────────────────────── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      execute(input);
      setInput('');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] ?? '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = histIdx - 1;
      if (next < 0) { setHistIdx(-1); setInput(''); }
      else { setHistIdx(next); setInput(cmdHistory[next] ?? ''); }
    }
  };

  /* ── Render each history entry ─────────────────────────── */
  const renderEntry = (entry) => {
    const entryPrompt = `${PROMPT_USER}@${PROMPT_HOST}:${pathDisplay(entry.pathStack)}$`;

    switch (entry.type) {
      case 'welcome':
        return (
          <TypewriterText
            key={entry.id}
            text={entry.content}
            speed={45}
            color={textColor}
            isWelcome
            onDone={() => {
              setBusyId(null);
              setWelcomed(true);
              setHistory((h) => [
                ...h,
                buildEntry('output', 'Type  help  to see all available commands.', []),
              ]);
            }}
          />
        );

      case 'command':
        return (
          <div key={entry.id} className="cmd-line" style={{ color: textColor }}>
            <span className="prompt">{entryPrompt}</span>
            <span className="cmd-text">&nbsp;{entry.content}</span>
          </div>
        );

      case 'typewriter':
        return (
          <TypewriterText
            key={entry.id}
            text={entry.content}
            speed={8}
            color={textColor}
            onDone={() => setBusyId(null)}
          />
        );

      case 'output':
        return (
          <pre key={entry.id} className="output-text" style={{ color: textColor }}>
            {entry.content}
          </pre>
        );

      case 'error':
        return (
          <pre key={entry.id} className="error-text">
            {entry.content}
          </pre>
        );

      default:
        return null;
    }
  };

  const inputDisabled = busyId !== null;

  return (
    <div className="terminal-wrapper" onClick={() => inputRef.current?.focus()}>
      {/* ── Title Bar ─────────────────────────── */}
      <div className="title-bar">
        <div className="title-dots">
          <Link href="https://souvik-moitra-portfolio-v2.vercel.app/" className="home-link">
            <span className="">🔴</span>
          </Link>
          <Link href="#" className="home-link">
            <span className="">🟡</span>
          </Link>
          <Link href="#" className="home-link">
            <span className="">🟢</span>
          </Link>
        </div>
        <span className="title-label">souvik-portfolio — terminal</span>
      </div>

      {/* ── Terminal Body ──────────────────────── */}
      <div className="terminal-body">
        {history.map(renderEntry)}

        {/* ── Live Input ────────────────────────── */}
        {welcomed && !inputDisabled && (
          <div className="input-row" style={{ color: textColor }}>
            <span className="prompt">{prompt}&nbsp;</span>
            <input
              ref={inputRef}
              className="terminal-input"
              style={{ color: textColor, caretColor: textColor }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}