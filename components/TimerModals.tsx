
import React from 'react';
import { X, Terminal, FastForward, FileSearch, CheckCircle2, Save, Key, AlertCircle, Heart, Star, CloudOff } from 'lucide-react';
import { CharacterProfile } from '../types';
import { LEVEL_TITLES } from './TimerConfig';

// ----------------------------------------------------------------------
// 1. 관리자 인증 모달
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 2. 관리자 패널 (최신 수정 반영: 딴짓 횟수 + 모델 버전)
// ----------------------------------------------------------------------
interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CharacterProfile;
  onTimeLeap: () => void;
  onLevelChange: (level: number) => void;
  clicks: number;
  distractions: number; 
  isApiKeyAlert: boolean;
  onToggleApiKeyAlert: () => void;
  isCongested: boolean; // 👈 혼잡 상태 여부 추가
  onToggleCongested: () => void; // 👈 혼잡 상태 토글 함수 추가
  retryDelay?: number;
  activeModel?: string; 
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, profile, onTimeLeap, onLevelChange, 
  clicks, distractions, 
  isApiKeyAlert, onToggleApiKeyAlert, 
  isCongested, onToggleCongested,
  retryDelay = 15000, activeModel = '-' 
}) => {
  if (!isOpen) return null;

  const getNetworkStatus = () => {
    const seconds = retryDelay / 1000;
    if (seconds <= 30) return { text: `정상 (${seconds}s)`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (seconds <= 60) return { text: `지연 중... (${seconds}s)`, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { text: `오류 누적 (${seconds}s)`, color: 'text-rose-500', bg: 'bg-rose-500/10' };
  };

  const status = getNetworkStatus();

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
        
        {/* AI 상태 모니터링 */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">🤖 AI Network Status</p>
          <div className={`flex items-center justify-between p-2 rounded-lg border border-white/5 ${status.bg}`}>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${status.color}`}>{status.text}</span>
                <span className="text-[10px] font-black bg-white/10 text-white px-1.5 py-0.5 rounded uppercase">
                    {activeModel}
                </span>
            </div>
            
            <div className="flex gap-1">
              <span className="text-[10px] text-white/40">C:{profile.dialogueCache.click.length}</span>
              <span className="text-[10px] text-white/40">|</span>
              <span className="text-[10px] text-white/40">S:{profile.dialogueCache.scolding.length}</span>
            </div>
          </div>
          <p className="text-[9px] text-white/30 pl-1">* 실패 시 대기 시간이 2배로 증가</p>
        </div>

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
        
        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Test Simulation</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onToggleApiKeyAlert} 
              className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all group ${isApiKeyAlert && !isCongested ? 'bg-rose-500/20 border-rose-500/40' : 'bg-white/5 border-white/10'}`}
            >
              <Key size={16} className={`mb-1 ${isApiKeyAlert && !isCongested ? 'text-rose-400 animate-pulse' : 'text-white/20'}`} />
              <span className={`text-[9px] font-bold ${isApiKeyAlert && !isCongested ? 'text-rose-400' : 'text-white'}`}>키 만료(401)</span>
            </button>
            <button 
              onClick={onToggleCongested} 
              className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all group ${isCongested ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/5 border-white/10'}`}
            >
              <CloudOff size={16} className={`mb-1 ${isCongested ? 'text-amber-400 animate-pulse' : 'text-white/20'}`} />
              <span className={`text-[9px] font-bold ${isCongested ? 'text-amber-400' : 'text-white'}`}>서버 혼잡(429)</span>
            </button>
          </div>
          <p className="text-[9px] text-white/30 text-center">* 휴식(BREAK) 시간 진입 시 팝업 발생</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <FileSearch size={10} /> Internal Diagnostics
          </p>
          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
            <div>
                <p className="text-white/30 text-[8px] font-bold uppercase mb-0.5">Interactions</p>
                <p className="text-white font-black">{clicks} Clicks</p>
            </div>
            <div className="text-right">
                <p className="text-rose-500/50 text-[8px] font-bold uppercase mb-0.5">Distractions</p>
                <p className="text-rose-400 font-black">{distractions} Detected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. 사이클 선택 모달
// ----------------------------------------------------------------------
interface CycleChoiceModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  completedCycles: number;
  onChoice: (option: 'LONG' | 'SHORT') => void;
  onExport: () => void;
}

export const CycleChoiceModal: React.FC<CycleChoiceModalProps> = ({ isOpen, isDarkMode, completedCycles, onChoice, onExport }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-sm border p-8 rounded-3xl shadow-2xl text-center space-y-6 transform animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}>
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary"><CheckCircle2 size={48} /></div>
        <div className="space-y-2">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>{completedCycles}번째 사이클을 완료했습니다!</h3>
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

// ----------------------------------------------------------------------
// 4. 호감도 가이드 모달
// ----------------------------------------------------------------------
interface AffinityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  isDarkMode: boolean;
  characterName: string;
}

export const AffinityGuideModal: React.FC<AffinityGuideModalProps> = ({ isOpen, onClose, currentLevel, isDarkMode, characterName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-[280px] rounded-[2rem] shadow-2xl border p-8 space-y-6 transform animate-in zoom-in-95 duration-300 relative ${isDarkMode ? 'bg-[#161B22] border-white/10' : 'bg-surface border-border'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center space-y-1">
          <Heart size={16} className="text-rose-500 fill-rose-500 mx-auto mb-2 opacity-80" />
          <h3 className={`text-base font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{characterName}와의 관계</h3>
        </div>

        <div className="flex flex-col gap-1.5 py-2">
          {Object.entries(LEVEL_TITLES).map(([lv, title]) => {
            const levelNum = parseInt(lv);
            const isCurrent = levelNum === currentLevel;

            return (
              <div key={lv} className="flex justify-start items-center h-8">
                <div 
                  className={`text-[13px] font-bold transition-all inline-flex items-center
                    ${isCurrent 
                      ? 'px-2 py-0.5 border-2 border-primary rounded-lg bg-primary/5 text-primary scale-[1.05]' 
                      : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}
                >
                  Lv{lv}. {title}
                  {isCurrent && <Star size={10} className="ml-1.5 text-primary fill-primary animate-pulse" />}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg
            ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-black'}`}
        >
          확인
        </button>
      </div>
    </div>
  );
};
