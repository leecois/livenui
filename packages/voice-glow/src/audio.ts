let context: AudioContext | null = null;
type AudioContextCtor = typeof AudioContext;
function resolveAudioContext(): AudioContextCtor | null {
    if (typeof window === 'undefined')
        return null;
    const w = window as unknown as {
        AudioContext?: AudioContextCtor;
        webkitAudioContext?: AudioContextCtor;
    };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
}
export function isAudioSupported(): boolean {
    return resolveAudioContext() != null;
}
export function getAudioContext(): AudioContext | null {
    const Ctor = resolveAudioContext();
    if (!Ctor)
        return null;
    if (!context)
        context = new Ctor();
    if (context.state === 'suspended') {
        context.resume().catch(() => {
        });
    }
    return context;
}
interface SharedSource {
    node: MediaStreamAudioSourceNode;
    refs: number;
}
const sources = new WeakMap<MediaStream, SharedSource>();
export interface AnalyserLease {
    analyser: AnalyserNode;
    release: () => void;
}
export function acquireAnalyser(stream: MediaStream): AnalyserLease | null {
    const ctx = getAudioContext();
    if (!ctx)
        return null;
    if (stream.getAudioTracks().length === 0)
        return null;
    let shared = sources.get(stream);
    if (!shared) {
        shared = { node: ctx.createMediaStreamSource(stream), refs: 0 };
        sources.set(stream, shared);
    }
    shared.refs += 1;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.5;
    shared.node.connect(analyser);
    let released = false;
    return {
        analyser,
        release: () => {
            if (released)
                return;
            released = true;
            try {
                shared!.node.disconnect(analyser);
            }
            catch {
            }
            shared!.refs -= 1;
            if (shared!.refs <= 0) {
                try {
                    shared!.node.disconnect();
                }
                catch {
                }
                sources.delete(stream);
            }
        },
    };
}
