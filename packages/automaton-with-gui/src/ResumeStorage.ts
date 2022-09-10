export interface ResumeStorage {
  isPlaying: boolean;
  time: number;
  loopRegion: { begin: number; end: number } | null;
}
