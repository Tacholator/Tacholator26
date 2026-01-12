import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { TextToSpeechClient } from 'npm:@google-cloud/text-to-speech@5.4.0';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { materialId, sectionId, sectionText, voiceGender = 'female', speakingRate = 1.0 } = await req.json();

    if (!sectionText) {
      return Response.json({ error: 'sectionText is required' }, { status: 400 });
    }

    // Create content hash for caching
    const contentHash = createHash('sha256')
      .update(`${sectionText}_${voiceGender}_${speakingRate}`)
      .digest('hex');

    // Check if we already have this audio cached
    const cachedAudio = await base44.asServiceRole.entities.AudioCache.filter({ contentHash });
    if (cachedAudio.length > 0) {
      return Response.json({ audioUrl: cachedAudio[0].audioUrl, cached: true });
    }

    // Convert text to SSML with proper pauses
    const ssml = convertToSSML(sectionText);

    // Initialize Google TTS client
    const credentials = JSON.parse(Deno.env.get('GOOGLE_TTS_SERVICE_ACCOUNT_JSON'));
    const client = new TextToSpeechClient({ credentials });

    // Voice configuration based on gender
    const voiceName = voiceGender === 'male' ? 'en-GB-Neural2-B' : 'en-GB-Neural2-A';

    const request = {
      input: { ssml },
      voice: {
        languageCode: 'en-GB',
        name: voiceName,
        ssmlGender: voiceGender.toUpperCase()
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speakingRate,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    // Generate audio
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // Upload audio file
    const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
    const audioFile = new File([audioBlob], `audio_${contentHash}.mp3`, { type: 'audio/mpeg' });
    
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: audioFile });

    // Cache the audio URL
    await base44.asServiceRole.entities.AudioCache.create({
      contentHash,
      audioUrl: file_url,
      textLength: sectionText.length,
      voiceGender,
      speakingRate
    });

    return Response.json({ audioUrl: file_url, cached: false });
  } catch (error) {
    console.error('TTS Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function convertToSSML(text) {
  // Remove HTML tags but preserve structure
  let cleaned = text.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/p>/gi, '\n\n');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  
  // Split into paragraphs
  const paragraphs = cleaned.split('\n\n').filter(p => p.trim());
  
  // Build SSML
  let ssml = '<speak>';
  
  paragraphs.forEach((para, idx) => {
    const trimmed = para.trim();
    if (!trimmed) return;
    
    // Check if it's a heading (short line, possibly all caps or title case)
    const isHeading = trimmed.length < 100 && (
      trimmed === trimmed.toUpperCase() || 
      /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(trimmed)
    );
    
    if (isHeading) {
      ssml += `<break time="800ms"/><emphasis level="strong">${trimmed}</emphasis><break time="600ms"/>`;
    } else {
      // Regular paragraph with natural pauses
      const sentences = trimmed.split(/([.!?]+\s+)/);
      sentences.forEach(sentence => {
        if (sentence.trim()) {
          ssml += sentence;
          if (/[.!?]$/.test(sentence.trim())) {
            ssml += '<break time="400ms"/>';
          }
        }
      });
      ssml += '<break time="800ms"/>';
    }
  });
  
  ssml += '</speak>';
  return ssml;
}