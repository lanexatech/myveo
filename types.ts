export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

export interface VideoOptions {
  aspectRatio: AspectRatio;
  soundEnabled: boolean;
  resolution: Resolution;
}

export interface PromptFormData {
  idePrompt: string;
  subjek: string;
  usia: string;
  warnaKulit: string;
  wajah: string;
  rambut: string;
  pakaian: string;
  asal: string;
  asesoris: string;
  aksi: string;
  ekspresi: string;
  tempat: string;
  waktu: string;
  gerakanKamera: string;
  pencahayaan: string;
  gayaVideo: string;
  kualitasVideo: string;
  suasanaVideo: string;
  suaraMusik: string;
  kalimatDiucapkan: string;
  detailTambahan: string;
  negativePrompt: string;
}
