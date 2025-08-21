import React, { useState, useCallback } from 'react';
import { generateVideo } from './services/geminiService';
import { AspectRatio, Resolution, VideoOptions } from './types';
import UploadIcon from './components/icons/UploadIcon';
import CloseIcon from './components/icons/CloseIcon';
import Loader from './components/Loader';
import VideoPlayer from './components/VideoPlayer';

// Define props for the reusable button component
interface OptionButtonProps<T> {
  value: T;
  selectedValue: T;
  onClick: (value: T) => void;
  children: React.ReactNode;
}

// Define the reusable button component outside of the App component.
// This prevents re-definition on every render and helps with type inference.
const OptionButton = <T,>({ value, selectedValue, onClick, children }: OptionButtonProps<T>) => (
    <button
        onClick={() => onClick(value)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedValue === value ? 'bg-indigo-500 text-white shadow' : 'bg-white/60 hover:bg-indigo-100 text-indigo-800'}`}
    >
        {children}
    </button>
);

const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A photorealistic video of a cat wearing sunglasses, riding a skateboard on Mars.');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const [options, setOptions] = useState<VideoOptions>({
        aspectRatio: '16:9',
        soundEnabled: true,
        resolution: '1080p'
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImageBase64(base64String);
                setImagePreviewUrl(URL.createObjectURL(file));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImageBase64(null);
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        setImagePreviewUrl(null);
    };
    
    const handleSubmit = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Prompt cannot be empty.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setGeneratedVideoUrl(null);

        try {
            const videoUrl = await generateVideo(
                prompt,
                imageFile && imageBase64 ? { base64: imageBase64, mimeType: imageFile.type } : null,
                options,
                setLoadingMessage
            );
            setGeneratedVideoUrl(videoUrl);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, imageFile, imageBase64, options]);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-purple-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
            <main className="w-full max-w-6xl mx-auto bg-white/50 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-indigo-200/50 overflow-hidden">
                <div className="p-6 border-b border-white/30">
                    <h1 className="text-3xl font-bold text-indigo-900">VEO-3 Video Generator</h1>
                    <p className="mt-1 text-indigo-700">Bring your ideas to life with Google's latest video generation model.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/30">
                    {/* Controls Panel */}
                    <div className="p-6 flex flex-col gap-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-bold text-indigo-800 mb-2">1. Your Prompt</label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter a descriptive prompt or JSON object..."
                                className="w-full h-36 p-3 bg-white/70 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-indigo-900 placeholder-indigo-400"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-indigo-800 mb-2">2. Reference Image (Optional)</label>
                             <input
                                type="file"
                                id="image-upload"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                                disabled={isLoading}
                            />
                            <label htmlFor="image-upload" className="flex justify-center items-center gap-2 w-full px-4 py-3 bg-white/70 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all">
                               <UploadIcon className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-medium text-indigo-800">{imageFile ? imageFile.name : 'Click to upload an image'}</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-indigo-800 mb-2">3. Generation Options</label>
                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-indigo-800 w-24">Aspect Ratio</span>
                                    <div className="flex gap-2 p-1 bg-indigo-100/50 rounded-lg">
                                        <OptionButton value="16:9" selectedValue={options.aspectRatio} onClick={val => setOptions(o => ({ ...o, aspectRatio: val }))}>16:9</OptionButton>
                                        <OptionButton value="9:16" selectedValue={options.aspectRatio} onClick={val => setOptions(o => ({ ...o, aspectRatio: val }))}>9:16</OptionButton>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-indigo-800 w-24">Resolution</span>
                                     <div className="flex gap-2 p-1 bg-indigo-100/50 rounded-lg">
                                        <OptionButton value="720p" selectedValue={options.resolution} onClick={val => setOptions(o => ({ ...o, resolution: val }))}>720p</OptionButton>
                                        <OptionButton value="1080p" selectedValue={options.resolution} onClick={val => setOptions(o => ({ ...o, resolution: val }))}>1080p</OptionButton>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-indigo-800 w-24">Sound</span>
                                    <div className="flex gap-2 p-1 bg-indigo-100/50 rounded-lg">
                                       <OptionButton value={true} selectedValue={options.soundEnabled} onClick={val => setOptions(o => ({ ...o, soundEnabled: val }))}>Enabled</OptionButton>
                                       <OptionButton value={false} selectedValue={options.soundEnabled} onClick={val => setOptions(o => ({ ...o, soundEnabled: val }))}>Disabled</OptionButton>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full mt-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-indigo-400/50"
                        >
                            {isLoading ? 'Generating...' : 'Generate Video'}
                        </button>
                    </div>

                    {/* Output Panel */}
                    <div className="p-6 bg-indigo-50/50 min-h-[300px] md:min-h-0 flex flex-col items-center justify-center">
                        {error && <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>}
                        
                        {!error && isLoading && <Loader message={loadingMessage} />}
                        
                        {!error && !isLoading && generatedVideoUrl && <VideoPlayer videoUrl={generatedVideoUrl} />}
                        
                        {!error && !isLoading && !generatedVideoUrl && (
                            <div className="w-full text-center">
                                {imagePreviewUrl ? (
                                    <div className="relative group w-full aspect-video rounded-lg overflow-hidden shadow-inner bg-gray-100">
                                        <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                                        <button 
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove image"
                                        >
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full aspect-video flex flex-col items-center justify-center bg-indigo-100/70 border-2 border-dashed border-indigo-200 rounded-lg p-4">
                                        <p className="font-semibold text-indigo-800">Your generated video will appear here</p>
                                        <p className="text-sm text-indigo-600 mt-1">Upload an image for a visual preview</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
