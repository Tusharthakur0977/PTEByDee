// src/config/openai.ts
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OpenAI API key is missing from environment variables.');
}

const openai = new OpenAI({ apiKey });

export default openai;
