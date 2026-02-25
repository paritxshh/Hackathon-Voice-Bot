import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({ apiKey: 'your_api_key' });

// Get raw response with headers
const { data, rawResponse } = await client.textToSpeech
  .convert('voice_id', {
    text: 'Hello, world!',
    modelId: 'eleven_multilingual_v2',
  })
  .withRawResponse();

// Access character cost from headers
const charCost = rawResponse.headers.get('x-character-count');
const requestId = rawResponse.headers.get('request-id');
const audioData = data;
