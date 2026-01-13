import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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

    console.log('=== TTS Request ===');
    console.log('Material:', materialId, 'Section:', sectionId);
    console.log('Voice:', voiceGender, 'Rate:', speakingRate);
    console.log('Text length:', sectionText.length);

    // Convert text to SSML
    const ssml = convertToSSML(sectionText);
    
    // Create content hash for caching
    const contentHash = createHash('sha256')
      .update(`${ssml}_${voiceGender}_${speakingRate}`)
      .digest('hex');

    console.log('Content hash:', contentHash);

    // Check if we already have this audio cached
    const cachedAudio = await base44.asServiceRole.entities.AudioCache.filter({ contentHash });
    if (cachedAudio.length > 0) {
      console.log('✓ Found cached audio, generating signed URL...');
      
      // Generate signed URL for the cached private file
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: cachedAudio[0].audioUrl,
        expires_in: 3600 // 1 hour
      });
      
      console.log('✓ Signed URL created');
      return Response.json({ audioUrl: signed_url, cached: true });
    }

    console.log('No cache found, generating audio with Google TTS...');

    // Get Google Cloud credentials
    const credentials = JSON.parse(Deno.env.get('GOOGLE_TTS_SERVICE_ACCOUNT_JSON'));
    
    // Voice configuration based on gender
    const voiceName = voiceGender === 'male' ? 'en-GB-Neural2-B' : 'en-GB-Neural2-A';

    // Prepare TTS request
    const ttsRequest = {
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

    console.log('Calling Google TTS API...');

    // Call Google Cloud Text-to-Speech REST API
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken(credentials)}`
        },
        body: JSON.stringify(ttsRequest)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', errorText);
      return Response.json({ error: 'TTS generation failed', details: errorText }, { status: 500 });
    }

    const ttsResult = await response.json();
    const audioContent = Uint8Array.from(atob(ttsResult.audioContent), c => c.charCodeAt(0));

    console.log('✓ Audio generated, size:', audioContent.length, 'bytes');

    // Upload audio file to PRIVATE storage
    const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
    const audioFile = new File([audioBlob], `audio_${contentHash}.mp3`, { type: 'audio/mpeg' });
    
    console.log('Uploading to private storage...');
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: audioFile });

    console.log('✓ Uploaded to private storage:', file_uri);

    // Cache the file URI
    await base44.asServiceRole.entities.AudioCache.create({
      contentHash,
      audioUrl: file_uri, // Store the private file URI
      textLength: sectionText.length,
      voiceGender,
      speakingRate
    });

    console.log('✓ Cached in database');

    // Generate signed URL for immediate use
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: file_uri,
      expires_in: 3600 // 1 hour
    });

    console.log('✓ Signed URL created');
    console.log('=== TTS Complete ===');

    return Response.json({ audioUrl: signed_url, cached: false });
  } catch (error) {
    console.error('=== TTS ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});

// Get OAuth2 access token from service account
async function getAccessToken(credentials) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(signature);
  const jwt = `${unsignedToken}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function pemToDer(pem) {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(data) {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else if (data instanceof ArrayBuffer) {
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  } else {
    base64 = btoa(String.fromCharCode(...data));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function convertToSSML(text) {
  // Remove HTML tags but preserve structure
  let cleaned = text.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/p>/gi, '\n\n');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  
  // Split into paragraphs
  const paragraphs = cleaned.split('\n\n').filter(p => p.trim());
  
  // Build SSML
  let ssml = '<speak>';
  
  paragraphs.forEach((para) => {
    const trimmed = para.trim();
    if (!trimmed) return;
    
    // Check if it's a heading (short line, possibly all caps or title case)
    const isHeading = trimmed.length < 100 && (
      trimmed === trimmed.toUpperCase() || 
      /^[A-Z0-9][A-Za-z0-9\s\-:()]+$/.test(trimmed)
    );
    
    if (isHeading) {
      ssml += `<break time="700ms"/><emphasis level="strong">${escapeXml(trimmed)}</emphasis><break time="500ms"/>`;
    } else {
      // Regular paragraph - add natural pauses at sentence boundaries
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
      sentences.forEach(sentence => {
        const cleaned = sentence.trim();
        if (cleaned) {
          ssml += escapeXml(cleaned) + '<break time="400ms"/>';
        }
      });
      ssml += '<break time="700ms"/>'; // Longer pause after paragraph
    }
  });
  
  ssml += '</speak>';
  return ssml;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}