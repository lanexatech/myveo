import { GoogleGenAI, Type } from "@google/genai";
import { VideoOptions, PromptFormData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is missing.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const loadingMessages = [
    "The model is warming up...",
    "Analyzing your prompt and image...",
    "Generating initial video frames...",
    "This can take a few minutes, hang tight!",
    "Compositing video scenes...",
    "Rendering the final video at high resolution...",
    "Almost there, adding finishing touches..."
];

export const generateVideo = async (
    prompt: string,
    image: { base64: string; mimeType: string } | null,
    options: VideoOptions,
    setLoadingMessage: (message: string) => void
): Promise<string> => {
    
    const requestPayload: any = {
        model: 'veo-3.0-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
        }
    };

    if (image) {
        requestPayload.image = {
            imageBytes: image.base64,
            mimeType: image.mimeType
        };
    }

    setLoadingMessage("Sending request to VEO-3...");
    let operation = await ai.models.generateVideos(requestPayload);

    let messageIndex = 0;
    while (!operation.done) {
        setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video URI not found in the API response.");
    }

    setLoadingMessage("Downloading generated video...");
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        throw new Error(`Failed to download the generated video. Status: ${videoResponse.status}. Details: ${errorText}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return videoUrl;
};

const formProperties = {
    subjek: { type: Type.STRING, description: 'Karakter atau objek utama.' },
    usia: { type: Type.STRING, description: 'Usia subjek jika relevan.' },
    warnaKulit: { type: Type.STRING, description: 'Warna kulit subjek.' },
    wajah: { type: Type.STRING, description: 'Deskripsi detail wajah subjek.' },
    rambut: { type: Type.STRING, description: 'Gaya dan warna rambut subjek.' },
    pakaian: { type: Type.STRING, description: 'Pakaian yang dikenakan subjek.' },
    asal: { type: Type.STRING, description: 'Asal negara atau etnisitas subjek.' },
    asesoris: { type: Type.STRING, description: 'Aksesoris yang dikenakan subjek.' },
    aksi: { type: Type.STRING, description: 'Tindakan yang dilakukan subjek.' },
    ekspresi: { type: Type.STRING, description: 'Ekspresi wajah atau emosi subjek.' },
    tempat: { type: Type.STRING, description: 'Lokasi atau setting video.' },
    waktu: { type: Type.STRING, description: 'Waktu (pagi, siang, malam, golden hour).' },
    gerakanKamera: { type: Type.STRING, description: 'Pergerakan kamera (panning, zoom, dll.).' },
    pencahayaan: { type: Type.STRING, description: 'Jenis pencahayaan (lembut, dramatis, dll.).' },
    gayaVideo: { type: Type.STRING, description: 'Gaya visual video (sinematik, realistis, dll.).' },
    kualitasVideo: { type: Type.STRING, description: 'Kualitas video (4K, HD, detail tinggi).' },
    suasanaVideo: { type: Type.STRING, description: 'Mood atau atmosfer video (ceria, misterius).' },
    suaraMusik: { type: Type.STRING, description: 'Deskripsi suara atau musik latar.' },
    kalimatDiucapkan: { type: Type.STRING, description: 'Dialog atau kalimat yang diucapkan, jika ada.' },
    detailTambahan: { type: Type.STRING, description: 'Detail penting lainnya.' },
};

export const expandPromptIdea = async (idea: string): Promise<Partial<PromptFormData>> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Kembangkan ide prompt video ini menjadi detail yang kaya dan spesifik: "${idea}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: formProperties,
            },
            systemInstruction: "Anda adalah asisten kreatif yang ahli dalam membuat konsep visual untuk video. Tugas Anda adalah mengambil ide sederhana dan mengembangkannya menjadi detail-detail yang spesifik dan imajinatif untuk setiap kategori yang diberikan. Berikan jawaban dalam Bahasa Indonesia.",
        },
    });

    const parsedJson = JSON.parse(response.text);
    return parsedJson;
}

export const generateFinalPrompts = async (formData: PromptFormData): Promise<{ indonesia: string; inggris: string; json: string; }> => {
    const fullPromptContext = `
        Buat prompt video berdasarkan detail berikut:
        - Subjek: ${formData.subjek}
        - Detail Subjek: Usia ${formData.usia}, kulit ${formData.warnaKulit}, wajah ${formData.wajah}, rambut ${formData.rambut}, pakaian ${formData.pakaian}, asal ${formData.asal}, aksesoris ${formData.asesoris}
        - Aksi & Emosi: Melakukan '${formData.aksi}' dengan ekspresi '${formData.ekspresi}'
        - Latar: Di ${formData.tempat} pada waktu ${formData.waktu}
        - Sinematografi: Gerakan kamera ${formData.gerakanKamera}, pencahayaan ${formData.pencahayaan}
        - Gaya & Suasana: Gaya video ${formData.gayaVideo} dengan kualitas ${formData.kualitasVideo}, menciptakan suasana ${formData.suasanaVideo}
        - Audio: Dengan suara/musik ${formData.suaraMusik}.
        - Dialog: ${formData.kalimatDiucapkan ? `Subjek mengucapkan: "${formData.kalimatDiucapkan}"` : 'Tidak ada dialog.'}
        - Detail Tambahan: ${formData.detailTambahan}
        - Hindari: ${formData.negativePrompt}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPromptContext,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    indonesia: { type: Type.STRING, description: "Buat paragraf prompt yang deskriptif dan naratif dalam Bahasa Indonesia." },
                    inggris: { type: Type.STRING, description: "Terjemahkan prompt Bahasa Indonesia ke Bahasa Inggris secara akurat dan natural, KECUALI untuk field 'kalimatDiucapkan' jika ada." },
                    json: { type: Type.STRING, description: "Format prompt Bahasa Inggris ke dalam string JSON yang rapi." }
                }
            },
            systemInstruction: "Anda adalah seorang prompt engineer ahli. Tugas Anda adalah mengambil detail terstruktur dan mengubahnya menjadi tiga format: 1. Paragraf naratif yang indah dalam Bahasa Indonesia. 2. Terjemahan akurat ke Bahasa Inggris, mempertahankan dialog asli jika ada. 3. String JSON dari prompt Bahasa Inggris.",
        },
    });

    const parsedJson = JSON.parse(response.text);
    return parsedJson;
}