// Singleton AudioContext to avoid autoplay policy restrictions
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let activeSource: AudioBufferSourceNode | null = null; // 현재 재생 중인 소스 추적

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// 소리 파일 로드 및 디코딩
const loadSound = async (ctx: AudioContext) => {
    if (audioBuffer) return audioBuffer;

    try {
        const response = await fetch('/sound.mp3');
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (e) {
        console.error("Failed to load sound:", e);
        return null;
    }
};

// iOS 등에서 사용자 액션(클릭 등)이 있을 때 미리 오디오 컨텍스트를 깨워두는 함수
export const initAudioContext = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch (e) {
            console.error("Audio resume failed:", e);
        }
    }
    // 미리 로드 (프리로드)
    if (!audioBuffer) {
        loadSound(ctx);
    }
};

export const playSuccessSound = async (isSoundEnabled: boolean, volumeLevel: number = 1) => {
    if (!isSoundEnabled) return;

    const ctx = getAudioContext();

    // 브라우저 정책으로 인해 AudioContext가 suspended 상태일 경우 깨워줍니다.
    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch (e) {
            console.error("Audio resume failed:", e);
        }
    }

    const buffer = await loadSound(ctx);
    if (!buffer) return;

    // 이전 소리가 재생 중이면 중지
    if (activeSource) {
        try {
            activeSource.stop();
        } catch (e) {
            // 이미 멈춘 경우 등 무시
        }
    }

    // Volume mapping: 1 -> 0.25, 2 -> 0.5, 3 -> 0.8, 4 -> 1.0
    const volumeMap = [0.25, 0.5, 0.8, 1.0];
    const masterVolume = volumeMap[Math.min(Math.max(volumeLevel, 1), 4) - 1] || 0.1;

    // Create Source and Gain Node
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = masterVolume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
    activeSource = source; // 현재 소스로 등록

    // 재생이 끝나면 activeSource 해제 (메모리 누수 방지 및 로직 정리)
    source.onended = () => {
        if (activeSource === source) {
            activeSource = null;
        }
    };

    // Haptic Feedback: Sync with notes (3 short pulses)
    if (navigator.vibrate) {
        setTimeout(() => navigator.vibrate(50), 0);
        setTimeout(() => navigator.vibrate(50), 100);
        setTimeout(() => navigator.vibrate(50), 200);
    }
};
