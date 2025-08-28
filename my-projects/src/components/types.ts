export type Item = {
  id: string;
  name: string;
  description?: string;
};
export type ProjectState = {
  name: string;
  description?: string;
  isOpen: boolean;
  isFocused: boolean;
  isMinimalized: boolean;
  isPlaying: boolean;
  closeRequested: boolean;
  isFullScreen: boolean;
  position?: { x: number; y: number };
}