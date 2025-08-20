// types/webrtc.d.ts
// Extiende el tipo nativo para que TS conozca setSinkId sin usar ts-ignore.
interface HTMLMediaElement {
  setSinkId?(sinkId: string): Promise<void>;
}
