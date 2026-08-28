'use client';

import { useState } from 'react';
import { LOCALE_NAMES, ROLE_ROUTES, type LearnerProfile, type Locale, type Pace, type RoleCode } from './academy';
import type { RestoreResult } from './backup';
import type { PlanSettings } from './plan';
import { voiceGenderLabel, voiceQualityLabel, type VoiceFilter } from './voice-profile';

export type AccessibilitySettings = {
  comfortableReading: boolean;
  reduceMotion: boolean;
  strongContrast: boolean;
};

type SettingsProps = {
  theme: 'night' | 'day';
  onTheme: (theme: 'night' | 'day') => void;
  plan: PlanSettings;
  onPlan: (plan: PlanSettings) => void;
  profile: LearnerProfile | null;
  onProfile: (profile: LearnerProfile) => void;
  accessibility: AccessibilitySettings;
  onAccessibility: (settings: AccessibilitySettings) => void;
  offlineReady: boolean;
  narration: {
    supported: boolean;
    hasStudio: boolean;
    preferStudio: boolean;
    onPreferStudio: (value: boolean) => void;
    voices: SpeechSynthesisVoice[];
    filteredVoices: SpeechSynthesisVoice[];
    allVoiceCount: number;
    femaleVoiceCount: number;
    maleVoiceCount: number;
    voiceURI: string;
    onVoiceURI: (value: string) => void;
    voiceFilter: VoiceFilter;
    onVoiceFilter: (value: VoiceFilter) => void;
    rate: number;
    onRate: (value: number) => void;
    onPreview: () => void;
  };
  onInstall: () => void;
  onBackup: () => void;
  notesCount: number;
  onExportNotes: () => void;
  onRestore: () => void;
  onShortcuts: () => void;
  onLearn: () => void;
  onReset: () => void;
  restore: RestoreResult | null;
};

function Toggle({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  note: string;
}) {
  return (
    <button
      type="button"
      className="settingToggle"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span>
        <b>{label}</b>
        <small>{note}</small>
      </span>
      <i className={checked ? 'toggleTrack on' : 'toggleTrack'} aria-hidden="true"><em /></i>
    </button>
  );
}

export function SettingsView({
  theme,
  onTheme,
  plan,
  onPlan,
  profile,
  onProfile,
  accessibility,
  onAccessibility,
  offlineReady,
  narration,
  onInstall,
  onBackup,
  notesCount,
  onExportNotes,
  onRestore,
  onShortcuts,
  onLearn,
  onReset,
  restore,
}: SettingsProps) {
  const [resetArmed, setResetArmed] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const currentProfile = (): LearnerProfile => profile ?? {
    experience: 'new',
    role: 'INTERN',
    weeklyHours: plan.weeklyHours,
    pace: 'steady',
    locale: 'en',
    createdAt: new Date().toISOString(),
  };

  const patchProfile = (patch: Partial<LearnerProfile>) => onProfile({ ...currentProfile(), ...patch });
  const patchAccess = (patch: Partial<AccessibilitySettings>) => onAccessibility({ ...accessibility, ...patch });
  const chosenVoice = narration.voices.find((voice) => voice.voiceURI === narration.voiceURI);

  return (
    <section id="settings" className="settingsPage">
      <header className="settingsHero reveal">
        <div className="settingsHeroCopy">
          <div className="kicker">Your control room</div>
          <h1>Settings, without the scavenger hunt.</h1>
          <p>Shape how Cipher School looks, teaches, speaks and saves: everything important lives on this page.</p>
          <button className="settingsBack" type="button" onClick={onLearn}>← Back to learning</button>
        </div>
        <aside className="settingsConsole" aria-label="Current settings summary">
          <div className="settingsConsoleBar"><span>CS://PREFERENCES</span><i>LIVE</i></div>
          <dl>
            <div><dt>DISPLAY</dt><dd>{theme.toUpperCase()}</dd></div>
            <div><dt>STUDY LOAD</dt><dd>{plan.weeklyHours}H / {plan.daysPerWeek}D</dd></div>
            <div><dt>ROUTE</dt><dd>{profile?.role ?? 'INTERN'}</dd></div>
            <div><dt>STORAGE</dt><dd>DEVICE ONLY</dd></div>
          </dl>
          <div className="settingsConsoleFoot"><span>NO ACCOUNT</span><b>● SECURE</b></div>
        </aside>
      </header>

      <div className="settingsPulse" role="status" aria-label="App status">
        <span><i className="ready" /> PRIVATE ON THIS DEVICE</span>
        <span><i className={offlineReady ? 'ready' : ''} /> {offlineReady ? 'OFFLINE READY' : 'OFFLINE PREPARING'}</span>
        <span><i className="ready" /> AUTO-SAVED</span>
      </div>

      <div className="settingsGrid">
        <article className="settingsGroup reveal">
          <div className="settingsGroupHead">
            <span>01</span>
            <div><h2>Display & comfort</h2><p>Make long study sessions easier on your eyes and attention.</p></div>
          </div>

          <div className="settingBlock">
            <span className="settingLabel">Colour theme</span>
            <div className="segmented" aria-label="Colour theme">
              <button className={theme === 'night' ? 'on' : ''} type="button" onClick={() => onTheme('night')}>Night</button>
              <button className={theme === 'day' ? 'on' : ''} type="button" onClick={() => onTheme('day')}>Day</button>
            </div>
          </div>

          <div className="settingStack">
            <Toggle
              checked={accessibility.comfortableReading}
              onChange={(value) => patchAccess({ comfortableReading: value })}
              label="Comfortable lesson text"
              note="Larger lesson copy with more breathing room."
            />
            <Toggle
              checked={accessibility.strongContrast}
              onChange={(value) => patchAccess({ strongContrast: value })}
              label="Stronger contrast"
              note="Brighter labels and clearer dividing lines."
            />
            <Toggle
              checked={accessibility.reduceMotion}
              onChange={(value) => patchAccess({ reduceMotion: value })}
              label="Reduce motion"
              note="Stops decorative movement and smooth scrolling."
            />
          </div>
        </article>

        <article className="settingsGroup reveal">
          <div className="settingsGroupHead">
            <span>02</span>
            <div><h2>Study plan</h2><p>Tell the daily planner how much time you really have.</p></div>
          </div>

          <div className="settingsFields two">
            <label className="settingsField">
              <span>Hours each week</span>
              <input
                type="number"
                min="1"
                max="40"
                value={plan.weeklyHours}
                onChange={(event) => {
                  const weeklyHours = Math.max(1, Math.min(40, Number(event.target.value) || 1));
                  onPlan({ ...plan, weeklyHours });
                  patchProfile({ weeklyHours });
                }}
              />
            </label>
            <label className="settingsField">
              <span>Study days</span>
              <input
                type="number"
                min="1"
                max="7"
                value={plan.daysPerWeek}
                onChange={(event) => onPlan({ ...plan, daysPerWeek: Math.max(1, Math.min(7, Number(event.target.value) || 1)) })}
              />
            </label>
          </div>
          <p className="settingMath">That is about <b>{Math.round((plan.weeklyHours * 60) / plan.daysPerWeek)} minutes</b> on each study day.</p>
        </article>

        <article className="settingsGroup settingsWide reveal">
          <div className="settingsGroupHead">
            <span>03</span>
            <div><h2>Learning route</h2><p>One goal changes the recommended stages, missions and portfolio project.</p></div>
          </div>

          <div className="settingsFields profileFields">
            <label className="settingsField">
              <span>Target role</span>
              <select value={profile?.role ?? 'INTERN'} onChange={(event) => patchProfile({ role: event.target.value as RoleCode })}>
                {(Object.keys(ROLE_ROUTES) as RoleCode[]).map((code) => <option key={code} value={code}>{ROLE_ROUTES[code].title}</option>)}
              </select>
            </label>
            <label className="settingsField">
              <span>Experience</span>
              <select value={profile?.experience ?? 'new'} onChange={(event) => patchProfile({ experience: event.target.value as LearnerProfile['experience'] })}>
                <option value="new">Starting from zero</option>
                <option value="some">I know the basics</option>
                <option value="working">I already work in tech</option>
              </select>
            </label>
            <label className="settingsField">
              <span>Learning pace</span>
              <select value={profile?.pace ?? 'steady'} onChange={(event) => patchProfile({ pace: event.target.value as Pace })}>
                <option value="sprint">Sprint: essentials first</option>
                <option value="steady">Steady: balanced</option>
                <option value="deep">Deep: maximum practice</option>
              </select>
            </label>
            <label className="settingsField">
              <span>Interface language</span>
              <select value={profile?.locale ?? 'en'} onChange={(event) => patchProfile({ locale: event.target.value as Locale })}>
                {(Object.keys(LOCALE_NAMES) as Locale[]).map((locale) => <option key={locale} value={locale}>{LOCALE_NAMES[locale]}</option>)}
              </select>
            </label>
          </div>
          <div className="routePreview">
            <span>{profile ? 'CURRENT ROUTE' : 'DEFAULT ROUTE'}</span>
            <b>{ROLE_ROUTES[profile?.role ?? 'INTERN'].stages.join(' → ')}</b>
            <small>{ROLE_ROUTES[profile?.role ?? 'INTERN'].outcome}</small>
          </div>
        </article>

        <article className="settingsGroup reveal">
          <div className="settingsGroupHead">
            <span>04</span>
            <div><h2>Narration</h2><p>Use a clear system voice with natural pitch and controlled pacing.</p></div>
          </div>

          {narration.supported ? (
            <>
              <div className="settingsFields">
                <div className="settingsField voiceFilterField">
                  <span>Voice</span>
                  <div className="segmented voiceFilters" aria-label="Filter voices">
                    {[
                      { value: 'all' as const, label: 'All', count: narration.voices.length },
                      { value: 'female' as const, label: 'Female', count: narration.femaleVoiceCount },
                      { value: 'male' as const, label: 'Male', count: narration.maleVoiceCount },
                    ].map((option) => (
                      <button
                        key={option.value}
                        className={narration.voiceFilter === option.value ? 'on' : ''}
                        type="button"
                        disabled={option.value !== 'all' && option.count === 0}
                        onClick={() => narration.onVoiceFilter(option.value)}
                      >
                        {option.label} <small>{option.count}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="settingsField">
                  <span>Professional voice</span>
                  <select value={narration.voiceURI} onChange={(event) => narration.onVoiceURI(event.target.value)}>
                    <option value="">Device default</option>
                    {narration.filteredVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voiceGenderLabel(voice)} · {voiceQualityLabel(voice)} · {voice.lang}</option>)}
                  </select>
                </label>
                <label className="settingsField rangeField">
                  <span>Speed <b>{narration.rate.toFixed(2)}×</b></span>
                  <input type="range" min="0.85" max="1.25" step="0.05" value={narration.rate} onChange={(event) => narration.onRate(Number(event.target.value))} />
                </label>
              </div>
              {narration.hasStudio && (
                <Toggle
                  checked={narration.preferStudio}
                  onChange={narration.onPreferStudio}
                  label="Prefer studio narration"
                  note="Uses published lesson audio when it is available."
                />
              )}
              <div className="narrationStatus">
                <p className="settingMath">Selected: <b>{chosenVoice?.name ?? 'device default'}</b> · {narration.filteredVoices.length} matching voices shown</p>
                <button type="button" className="voicePreview" onClick={narration.onPreview}>Preview voice</button>
              </div>
            </>
          ) : <p className="settingEmpty">Narration is not supported by this browser. The lessons still work normally.</p>}
        </article>

        <article className="settingsGroup reveal">
          <div className="settingsGroupHead">
            <span>05</span>
            <div><h2>App & keyboard</h2><p>Install it for focused study and learn the fast controls.</p></div>
          </div>
          <div className="settingsActions">
            <button type="button" onClick={onInstall}><span>Install / offline help</span><b>{offlineReady ? 'READY' : 'CHECK'}</b></button>
            <button type="button" onClick={onShortcuts}><span>Keyboard shortcuts</span><b>?</b></button>
          </div>
        </article>

        <article className="settingsGroup settingsWide reveal">
          <div className="settingsGroupHead">
            <span>06</span>
            <div><h2>Data & privacy</h2><p>Your progress stays in this browser. A backup is how you take it to another device.</p></div>
          </div>
          <div className="privacyStrip">
            <div><span>ACCOUNT</span><b>Not required</b></div>
            <div><span>CLOUD UPLOAD</span><b>None</b></div>
            <div><span>FIELD NOTES</span><b>{notesCount} lesson{notesCount === 1 ? '' : 's'}</b></div>
          </div>
          <div className="settingsDataActions">
            <button className="btn primary" type="button" onClick={onBackup}>↓ Download backup</button>
            <button className="btn ghost" type="button" onClick={onRestore}>↑ Restore backup</button>
            <button className="btn ghost" type="button" onClick={onExportNotes} disabled={notesCount === 0}>↓ Export field notes</button>
          </div>
          {restore && (
            <p className={restore.ok ? 'settingsResult ok' : 'settingsResult bad'} role="status">
              {restore.ok
                ? `Backup ready: ${restore.lessons} lessons and ${restore.cards} review cards included.${restore.skipped.length ? ` Skipped: ${restore.skipped.join('; ')}.` : ''}`
                : restore.error}
            </p>
          )}
        </article>

        <article className="settingsGroup settingsWide resetGroup reveal">
          <div className="settingsGroupHead">
            <span>07</span>
            <div><h2>Factory reset</h2><p>Erase all Cipher School data saved in this browser and return to a fresh start.</p></div>
          </div>
          <div className="resetSummary">
            <div>
              <b>This permanently takes everything back to zero.</b>
              <p>It removes completed lessons, review history, streaks, exercises, field notes, missions, capstones, portfolio evidence, your route and every preference from this device.</p>
              <button className="resetBackup" type="button" onClick={onBackup}>↓ Download a backup first</button>
            </div>
            {!resetArmed ? (
              <button
                className="resetButton"
                type="button"
                onClick={() => { setResetArmed(true); setResetDone(false); setResetPhrase(''); }}
              >
                Reset Cipher School…
              </button>
            ) : (
              <div className="resetConfirm" role="group" aria-label="Confirm complete Cipher School reset">
                <label>
                  <span>Type <b>RESET</b> to confirm</span>
                  <input value={resetPhrase} onChange={(event) => setResetPhrase(event.target.value)} autoComplete="off" spellCheck="false" />
                </label>
                <div>
                  <button type="button" onClick={() => { setResetArmed(false); setResetPhrase(''); }}>Cancel</button>
                  <button
                    className="confirmReset"
                    type="button"
                    disabled={resetPhrase.trim() !== 'RESET'}
                    onClick={() => {
                      onReset();
                      setResetArmed(false);
                      setResetDone(true);
                      setResetPhrase('');
                    }}
                  >
                    Erase everything
                  </button>
                </div>
              </div>
            )}
          </div>
          {resetDone && <p className="settingsResult ok" role="status">Cipher School has been reset. Progress and settings are back to zero on this device.</p>}
        </article>
      </div>
    </section>
  );
}
