import React, { useEffect, useState } from 'react';
import { Bell, Camera, Volume2, Monitor, Sparkles } from 'lucide-react';

interface ReleaseNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

const RELEASES = [
    {
        version: 'v1.2.0',
        date: '2024.01',
        features: [
            {
                icon: <Camera size={16} />,
                color: 'rose',
                title: '최애 사진 변경 기능',
                desc: '이제 쉬는 시간마다 새로운 사진으로 교체할 수 있어요.'
            },
            {
                icon: <Volume2 size={16} />,
                color: 'amber',
                title: '소리 및 햅틱 피드백',
                desc: '시작과 종료 시 기분 좋은 알림음이 재생됩니다.)'
            },
            {
                icon: <Monitor size={16} />,
                color: 'emerald',
                title: '화면 최적화 & UX 개선',
                desc: '모바일에서 화면 잘림 현상을 수정했습니다.\n이미지 크롭 시 확대/축소가 훨씬 부드러워졌어요.'
            }
        ]
    },
    {
        version: 'v1.0.0',
        date: '2023.12',
        features: [
            {
                icon: <Sparkles size={16} />,
                color: 'indigo',
                title: '최애 뽀모도로 런칭!',
                desc: '최애와 함께하는 뽀모도로 타이머가 시작되었습니다.\n나만의 최애와 집중하는 시간을 가져보세요.'
            }
        ]
    }
];

export const LATEST_VERSION = RELEASES[0].version;

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({
    isOpen,
    onClose,
    isDarkMode
}) => {
    const [activeVersion, setActiveVersion] = useState<string>('v1.1.0');

    useEffect(() => {
        if (!isOpen) return;
        const handlePopState = (e: PopStateEvent) => {
            e.preventDefault();
            onClose();
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const activeRelease = RELEASES.find(r => r.version === activeVersion) || RELEASES[0];

    return (
        <>
            <div
                className="fixed inset-0 z-[700] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div
                className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-[710]
          rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom-full
          ${isDarkMode ? 'bg-[#161B22] border-[#30363D]' : 'bg-surface border-border'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mt-4 mb-2" />
                <div className="p-8 pt-4 pb-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* 헤더 */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                            <Bell size={28} className="animate-wiggle" />
                            <div className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-text-primary'}`}>
                                새로운 소식이 도착했어요!
                            </h3>
                            <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                RELEASE NOTES
                            </p>
                        </div>
                    </div>

                    {/* 버전 탭 */}
                    <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                        {RELEASES.map((release) => (
                            <button
                                key={release.version}
                                onClick={() => setActiveVersion(release.version)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-wide transition-all active:scale-95
                  ${activeVersion === release.version
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                        : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}
                            >
                                {release.version}
                            </button>
                        ))}
                    </div>

                    {/* 컨텐츠 리스트 */}
                    <div className="space-y-6 pt-2 min-h-[200px] animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeVersion}>
                        {activeRelease.features.map((feature, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${feature.color === 'rose' ? 'bg-rose-100 text-rose-500' :
                                        feature.color === 'amber' ? 'bg-amber-100 text-amber-500' :
                                            feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-500' :
                                                'bg-indigo-100 text-indigo-500'
                                        }`}>
                                        {feature.icon}
                                    </div>
                                    <h4 className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{feature.title}</h4>
                                </div>
                                <p className={`text-xs leading-relaxed whitespace-pre-wrap pl-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
              ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                    >
                        <span>확인했습니다</span>
                    </button>
                </div>
            </div>
        </>
    );
};
