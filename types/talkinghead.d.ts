// TalkingHead is loaded at runtime from public/ — these types are for reference only
declare module "/talkinghead/talkinghead.mjs" {
  export class TalkingHead {
    audioCtx: AudioContext;
    audioSpeechGainNode: GainNode;
    mtAvatar: Record<string, { newvalue: number; needsUpdate: boolean }>;
    constructor(element: HTMLElement, options?: Record<string, any>);
    showAvatar(config: Record<string, any>, onProgress?: (ev: ProgressEvent) => void): Promise<void>;
    stop(): void;
  }
}

declare module "/talkinghead/headaudio.min.mjs" {
  export class HeadAudio {
    node: AudioWorkletNode;
    onvalue: (key: string, value: number) => void;
    constructor(ctx: AudioContext, options?: Record<string, any>);
    init(): Promise<void>;
  }
}
