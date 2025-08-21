import React, { useState, useCallback } from 'react';
import { PromptFormData } from '../types';
import { expandPromptIdea, generateFinalPrompts } from '../services/geminiService';
import ClipboardIcon from './icons/ClipboardIcon';
import SendIcon from './icons/SendIcon';

interface PromptGeneratorProps {
  formData: PromptFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromptFormData>>;
  indonesianPrompt: string;
  setIndonesianPrompt: React.Dispatch<React.SetStateAction<string>>;
  englishPrompt: string;
  setEnglishPrompt: React.Dispatch<React.SetStateAction<string>>;
  jsonPrompt: string;
  setJsonPrompt: React.Dispatch<React.SetStateAction<string>>;
  setVideoPrompt: (prompt: string) => void;
  setActiveTab: (tab: 'videoGenerator' | 'promptGenerator') => void;
}

const FormField: React.FC<{ name: keyof PromptFormData; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; disabled: boolean; }> = ({ name, label, value, onChange, disabled }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-bold text-indigo-800 mb-1.5">{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={3}
      className="w-full p-2 bg-white/70 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-indigo-900 placeholder-indigo-400 text-sm"
    />
  </div>
);

const OutputField: React.FC<{ label: string; value: string; isEditable?: boolean; onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onUsePrompt?: () => void; }> = ({ label, value, isEditable = false, onChange, onUsePrompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-sm font-bold text-indigo-800">{label}</label>
        <div className="flex items-center gap-4">
          {onUsePrompt && (
              <button 
                onClick={onUsePrompt} 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={!value}
                title="Gunakan prompt ini di Generator Video"
              >
                <SendIcon className="w-4 h-4" />
                Gunakan
              </button>
          )}
          <button onClick={handleCopy} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50" disabled={!value}>
            <ClipboardIcon className="w-4 h-4" />
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
        </div>
      </div>
      <textarea
        readOnly={!isEditable}
        value={value}
        onChange={onChange}
        rows={5}
        className={`w-full p-3 bg-white/90 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-indigo-900 placeholder-indigo-400 ${!isEditable ? 'bg-indigo-50/50' : ''}`}
      />
    </div>
  );
};


const PromptGenerator: React.FC<PromptGeneratorProps> = ({
  formData,
  setFormData,
  indonesianPrompt,
  setIndonesianPrompt,
  englishPrompt,
  setEnglishPrompt,
  jsonPrompt,
  setJsonPrompt,
  setVideoPrompt,
  setActiveTab,
}) => {
  const [isLoadingExpand, setIsLoadingExpand] = useState(false);
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [setFormData]);

  const handleExpand = async () => {
    if (!formData.idePrompt.trim()) {
        setError("Masukkan ide prompt terlebih dahulu.");
        return;
    }
    setError(null);
    setIsLoadingExpand(true);
    try {
        const result = await expandPromptIdea(formData.idePrompt);
        setFormData(prev => ({ 
            ...prev, 
            ...result,
            idePrompt: prev.idePrompt // Keep the original idea
        }));
    } catch (err: any) {
        setError(err.message || 'Gagal mengembangkan ide.');
    } finally {
        setIsLoadingExpand(false);
    }
  };

  const handleGenerate = async () => {
      setError(null);
      setIsLoadingGenerate(true);
      setIndonesianPrompt('');
      setEnglishPrompt('');
      setJsonPrompt('');
      try {
        const results = await generateFinalPrompts(formData);
        setIndonesianPrompt(results.indonesia);
        setEnglishPrompt(results.inggris);
        
        try {
            const parsedJson = JSON.parse(results.json);
            setJsonPrompt(JSON.stringify(parsedJson, null, 2));
        } catch {
             setJsonPrompt(results.json);
        }

      } catch (err: any) {
        setError(err.message || 'Gagal membuat prompt akhir.');
      } finally {
        setIsLoadingGenerate(false);
      }
  };
  
  const handleUsePrompt = (prompt: string) => {
    if (prompt) {
      setVideoPrompt(prompt);
      setActiveTab('videoGenerator');
    }
  };

  return (
    <div className="p-6">
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>}
      
      <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
        <div className="flex-grow w-full">
            <label htmlFor="idePrompt" className="block text-sm font-bold text-indigo-800 mb-1.5">1. Ide Prompt Awal</label>
            <textarea
                id="idePrompt"
                name="idePrompt"
                value={formData.idePrompt}
                onChange={(e) => setFormData(prev => ({...prev, idePrompt: e.target.value}))}
                placeholder="Contoh: Astronot di pantai"
                rows={3}
                className="w-full p-3 bg-white/70 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-indigo-900 placeholder-indigo-400"
                disabled={isLoadingExpand || isLoadingGenerate}
            />
        </div>
        <div className="w-full md:w-auto self-end">
            <button
                onClick={handleExpand}
                disabled={isLoadingExpand || isLoadingGenerate || !formData.idePrompt.trim()}
                className="w-full md:w-auto bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-md"
            >
                {isLoadingExpand ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : "Kembangkan"}
            </button>
        </div>
      </div>

      <p className="text-sm font-bold text-indigo-800 mb-4">2. Detail Prompt (Isi manual atau kembangkan dari ide)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
        <FormField name="subjek" label="Subjek" value={formData.subjek} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="usia" label="Usia" value={formData.usia} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="warnaKulit" label="Warna Kulit" value={formData.warnaKulit} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="wajah" label="Wajah" value={formData.wajah} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="rambut" label="Rambut" value={formData.rambut} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="pakaian" label="Pakaian" value={formData.pakaian} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="asal" label="Asal (Negara)" value={formData.asal} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="asesoris" label="Asesoris" value={formData.asesoris} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="aksi" label="Aksi" value={formData.aksi} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="ekspresi" label="Ekspresi" value={formData.ekspresi} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="tempat" label="Tempat" value={formData.tempat} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="waktu" label="Waktu" value={formData.waktu} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="gerakanKamera" label="Gerakan Kamera" value={formData.gerakanKamera} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="pencahayaan" label="Pencahayaan" value={formData.pencahayaan} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="gayaVideo" label="Gaya Video" value={formData.gayaVideo} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="kualitasVideo" label="Kualitas Video" value={formData.kualitasVideo} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="suasanaVideo" label="Suasana Video" value={formData.suasanaVideo} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="suaraMusik" label="Suara atau Musik" value={formData.suaraMusik} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="kalimatDiucapkan" label="Kalimat yang Diucapkan" value={formData.kalimatDiucapkan} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="detailTambahan" label="Detail Tambahan" value={formData.detailTambahan} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
        <FormField name="negativePrompt" label="Negative Prompt (Otomatis)" value={formData.negativePrompt} onChange={handleInputChange} disabled={isLoadingExpand || isLoadingGenerate} />
      </div>

      <button
          onClick={handleGenerate}
          disabled={isLoadingExpand || isLoadingGenerate}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-indigo-400/50 mb-6"
      >
          {isLoadingGenerate ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Memproses...</>
          ) : '3. Buat Prompt Akhir'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OutputField 
            label="Hasil Prompt (Bahasa Indonesia)" 
            value={indonesianPrompt}
            isEditable
            onChange={(e) => setIndonesianPrompt(e.target.value)}
          />
          <OutputField 
            label="Hasil Prompt (Bahasa Inggris)" 
            value={englishPrompt} 
            onUsePrompt={() => handleUsePrompt(englishPrompt)}
          />
          <OutputField 
            label="Hasil Prompt (Format JSON)" 
            value={jsonPrompt} 
            onUsePrompt={() => handleUsePrompt(jsonPrompt)}
          />
      </div>

    </div>
  );
};

export default PromptGenerator;