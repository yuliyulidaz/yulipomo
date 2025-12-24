import React from 'react';
import { X, Terminal, FastForward, FileSearch, CheckCircle2, Save } from 'lucide-react';
import { CharacterProfile } from '../types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  setPassword: (val: string) => void;
  onVerify: (e: React.FormEvent) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, password, setPassword, onVerify }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <form onSubmit={onVerify} className="w-full max-w-xs bg-surface border border-border p-6 rounded-3xl shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-tighter">
          <Terminal size={16} /> God Mode Access
        </div>
        <input 
          type="password" 
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="ENTER PASSWORD"
          className="w-full bg-background border-2 border-border focus:border-primary outline-none px-4 py-3 rounded-xl text-center font-mono tracking-widest text-lg"
        />
        <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">VERIFY</button>
        <button type="button" onClick={onClose} className="w-full text-[10px] font-bold text-text-secondary uppercase">Cancel</button>
      </form>
    </div>
  );
};

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CharacterProfile;
  onTimeLeap: () => void;
  onLevelChange: (level: number) => void;
  clicks: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, profile, onTimeLeap, onLevelChange, clicks }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-6 left-6 z-[150] w-72 bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-left-4 duration-500">
      <div className="bg-primary/20 px-5 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary-light" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Admin Control</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Time Manipulation</p>
          <button onClick={onTimeLeap} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
            <span className="text-xs font-bold text-white group-hover:text-primary-light">시간 도약 (10초)</span>
            <FastForward size={16} className="text-primary-light" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Affinity Level</p>
            <span className="text-xs font-black text-primary-light">Lv.{profile.level}</span>
          </div>
          <input 
            type="range" min="1" max="10" step="1" 
            value={profile.level}
            onChange={(e) => onLevelChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-light" 
          />
        </div>
        <div className="space-y-2 pt-2 border-t border-white/5">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <FileSearch size={10} /> Internal Diagnostics
          </p>
          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
            <p className="text-white/30 text-[8px] font-bold uppercase mb-0.5">Interactions</p>
            <p className="text-white font-black">{clicks} Clicks</p>
          </div>
          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
             <p className="text-white/30 text-[8px] font-bold uppercase border-b border-white/5 pb-1 mb-1.5">Dialogue Cache Status</p>
             <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-white/60">
                <span>Start: {profile.dialogueCache.start.length}</span>
                <span>Finish: {profile.dialogueCache.praising.length}</span>
                <span>Scold: {profile.dialogueCache.scolding.length}</span>
                <span>Click: {profile.dialogueCache.click.length}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CycleChoiceModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onChoice: (option: 'LONG' | 'SHORT') => void;
  onExport: () => void;
}

export const CycleChoiceModal: React.FC<CycleChoiceModalProps> = ({ isOpen, isDarkMode, onChoice, onExport }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-sm border p-8 rounded-3xl shadow-2xl text-center space-y-6 transform animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary"><CheckCircle2 size={48} /></div>
        <div className="space-y-2">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>1사이클 달성!</h3>
          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-text-secondary'}`}>열심히 한 당신을 위해 선택지를 준비했어요.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 pt-2">
          <button onClick={() => onChoice('LONG')} className={`w-full py-4 px-6 border rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group ${isDarkMode ? 'bg-[#0B0E14] border-[#30363D] hover:bg-slate-800' : 'bg-background border-border hover:bg-border'}`}>
            <span className={isDarkMode ? 'text-slate-100' : 'text-text-primary'}>푹 쉴게 (30분)</span>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest opacity-60">XP +10</span>
          </button>
          <button onClick={() => onChoice('SHORT')} className="w-full py-4 px-6 bg-primary hover:bg-primary-light border border-primary-dark/10 rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group shadow-lg shadow-primary/20">
            <span className="text-white">5분만 쉴래 (열공 모드)</span>
            <span className="text-[10px] text-accent-soft font-black uppercase tracking-widest">XP +30 🔥</span>
          </button>
          <button onClick={onExport} className={`w-full py-4 px-6 border rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 group ${isDarkMode ? 'bg-[#0B0E14] border-[#30363D] hover:bg-slate-800' : 'bg-background border-border hover:bg-border'}`}>
            <span className={isDarkMode ? 'text-slate-100' : 'text-text-primary'}>저장하고 다음에 만나기</span>
            <span className="text-[10px] text-primary-light font-black uppercase tracking-widest opacity-60">백업 파일 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
};