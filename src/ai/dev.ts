
import { config } from 'dotenv';
config();

import '@/ai/flows/translate-response.ts';
import '@/ai/flows/generate-image-prompt.ts';
import '@/ai/flows/chat-flow.ts'; 
// import '@/ai/flows/generate-actual-image-flow.ts'; // Temporarily commented out

