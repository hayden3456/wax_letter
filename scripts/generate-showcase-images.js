import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local file manually
async function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = await fs.readFile(envPath, 'utf-8');
        const lines = envContent.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
    } catch (error) {
        console.error('Error loading .env.local:', error.message);
    }
}

await loadEnv();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not set in .env.local');
    process.exit(1);
}

const showcaseItems = [
    {
        name: 'wedding',
        prompt: 'Create a beautiful wax-sealed wedding invitation letter. The letter should have elegant calligraphy-style text, cream or ivory colored paper, and a romantic wax seal (could be hearts, initials, or floral design). The overall aesthetic should be romantic and elegant. Make it look like a real photograph of a physical letter with natural lighting.',
        filename: 'wedding_invitation.png'
    },
    {
        name: 'corporate',
        prompt: 'Create a professional corporate letter with a wax seal. The letter should have formal business letterhead, professional typography, white or cream paper, and a sophisticated wax seal (could be a company logo or monogram). The aesthetic should be professional and prestigious. Make it look like a real photograph of a physical letter with natural lighting.',
        filename: 'corporate_letter.png'
    },
    {
        name: 'holiday',
        prompt: 'Create a festive holiday greeting card with a wax seal. The letter should have holiday-themed decorations (snowflakes, holly, or festive patterns), warm colors, and a cheerful wax seal design. The aesthetic should be warm and celebratory. Make it look like a real photograph of a physical letter with natural lighting.',
        filename: 'holiday_card.png'
    },
    {
        name: 'thankyou',
        prompt: 'Create an elegant thank you note with a wax seal. The letter should have graceful handwritten-style text, quality stationery paper, and a tasteful wax seal. The aesthetic should be warm, personal, and appreciative. Make it look like a real photograph of a physical letter with natural lighting.',
        filename: 'thank_you_note.png'
    }
];

async function generateImage(item) {
    console.log(`\nGenerating ${item.name} image...`);

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

        const result = await model.generateContent([item.prompt]);
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
            console.error(`No image found in response for ${item.name}`);
            return false;
        }

        // Save the image to static folder
        const staticPath = path.resolve(__dirname, '../static', item.filename);
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        await fs.writeFile(staticPath, imageBuffer);

        console.log(`✓ Successfully generated and saved ${item.filename}`);
        return true;

    } catch (error) {
        console.error(`Error generating ${item.name}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('Starting showcase image generation...');
    console.log('This will generate 4 images, please wait...\n');

    for (const item of showcaseItems) {
        await generateImage(item);
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✓ All images generated successfully!');
    console.log('Images saved to the static folder.');
}

main().catch(console.error);
