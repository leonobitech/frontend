declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    audioCtx: AudioContext;
    audioSpeechGainNode: GainNode;
    mtAvatar: Record<string, { newvalue: number; needsUpdate: boolean }>;
    constructor(element: HTMLElement, options?: Record<string, any>);
    showAvatar(config: Record<string, any>, onProgress?: (ev: ProgressEvent) => void): Promise<void>;
    stop(): void;
  }
}
