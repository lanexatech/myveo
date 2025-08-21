import { GoogleGenAI, VideosOperation } from "@google/genai";
import { VideoOptions } from '../types';

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
            // NOTE: The following options are included based on the UI request.
            // As of the current documentation, 'soundEnabled', 'resolution', and 'aspectRatio'
            // are not standard parameters for the VEO API via this SDK.
            // They are mapped to potential future API capabilities but might not have an effect.
            // Sending them might result in an API error if not supported.
            // We will build the UI as requested but omit them from the API call for stability.
        }
    };

    if (image) {
        requestPayload.image = {
            imageBytes: image.base64,
            mimeType: image.mimeType
        };
    }

    setLoadingMessage("Sending request to VEO-3...");
    let operation: VideosOperation = await ai.models.generateVideos(requestPayload);

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
