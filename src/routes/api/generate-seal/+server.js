import { GoogleGenerativeAI } from "@google/generative-ai";
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import fs from 'fs/promises';
import path from 'path';

const GOOGLE_API_KEY = env.GOOGLE_API_KEY;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    if (!GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY is not set');
        return json({ error: 'Server configuration error: API key missing' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const logoFile = formData.get('logo');

        if (!logoFile || typeof logoFile === 'string') {
            return json({ error: 'No valid logo file provided' }, { status: 400 });
        }

        const logoBuffer = await logoFile.arrayBuffer();
        const logoBase64 = Buffer.from(logoBuffer).toString('base64');

        // Determine the correct MIME type, supporting SVG
        let mimeType = logoFile.type || 'image/png';
        if (!mimeType.startsWith('image/')) {
            mimeType = 'image/png';
        }

        // Read the base letter image
        // In production/preview, static files might be served differently, but for dev/node adapter:
        const baseLetterPath = path.resolve('static/single_letter_no_bg.png');
        let baseLetterBuffer;
        try {
            baseLetterBuffer = await fs.readFile(baseLetterPath);
        } catch (e) {
            console.error('Error reading base letter:', e);
            return json({ error: 'Failed to read base image' }, { status: 500 });
        }

        const baseLetterBase64 = baseLetterBuffer.toString('base64');

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

        const prompt = "Using the provided images, make the logo given be indented into the wax seal on the letter image. Only chnage the wax seal and the logo should only be in the wax seal. Show the whole letter with the wax seal and the wax seal is the same color single color as the original. CRITICAL: The rest of the letter MUST remain exactly the same pixel-for-pixel. Do not change the lighting, background, dimensions, or paper texture. Only replace the imprinted design on the wax seal. Keep the wax seal color exactly as the original. The output must be hyper-realistic";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: baseLetterBase64,
                    mimeType: "image/png"
                }
            },
            {
                inlineData: {
                    data: logoBase64,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;

        // Extract image data from response
        let generatedImageBase64 = null;

        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    generatedImageBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!generatedImageBase64) {
            console.error('No image found in response:', JSON.stringify(response));
            return json({ error: 'Failed to generate image' }, { status: 500 });
        }

        return json({ image: `data:image/png;base64,${generatedImageBase64}` });

    } catch (error) {
        console.error('Error generating seal:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during generation';
        return json({ error: errorMessage }, { status: 500 });
    }
}
