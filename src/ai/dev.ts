import { config } from 'dotenv';
config();

import '@/ai/flows/translate-response.ts';
import '@/ai/flows/generate-image-prompt.ts';
import '@/ai/flows/chat-flow.ts'; // Added new chat flow
