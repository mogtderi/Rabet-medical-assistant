export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

export interface RoseSettings {
  color: string;
  rotationSpeed: number;
  glowIntensity: number;
  orbitSpeed: number;
  sparkleDensity: number;
  nebulaColor: string;
  showHelpers: boolean;
}
