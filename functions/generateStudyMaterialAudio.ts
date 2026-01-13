import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        errorCode: 'UNAUTHORIZED',
        errorSource: 'validation',
        errorMessage: 'User not authenticated'
      }, { status: 401 });
    }

    const { materialId, sectionId, sectionText, voiceGender = 'female', speakingRate = 1.0 } = await req.json();

    if (!sectionText) {
      return Response.json({ 
        errorCode: 'MISSING_TEXT',
        errorSource: 'validation',
        errorMessage: 'sectionText is required'
      }, { status: 400 });
    }

    console.log('=== TTS Request ===');
    console.log('User:', user.email);
    console.log('Material:', materialId, 'Section:', sectionId);
    console.log('Voice:', voiceGender, 'Rate:', speakingRate);
    console.log('Text length:', sectionText.length, 'chars');

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
    let credentialsJson = Deno.env.get('GOOGLE_TTS_SERVICE_ACCOUNT_JSON');
    if (!credentialsJson) {
      console.error('❌ GOOGLE_TTS_SERVICE_ACCOUNT_JSON not found in environment');
      return Response.json({ 
        errorCode: 'MISSING_CREDENTIALS',
        errorSource: 'validation',
        errorMessage: 'Google TTS credentials not configured'
      }, { status: 500 });
    }

    // Remove wrapping quotes if present
    credentialsJson = credentialsJson.trim();
    if ((credentialsJson.startsWith('"') && credentialsJson.endsWith('"')) ||
        (credentialsJson.startsWith("'") && credentialsJson.endsWith("'"))) {
      credentialsJson = credentialsJson.slice(1, -1);
      console.log('Removed wrapping quotes from credentials');
    }

    // Parse credentials
    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
      console.log('✓ Credentials parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse credentials JSON:', parseError.message);
      return Response.json({ 
        errorCode: 'INVALID_CREDENTIALS',
        errorSource: 'validation',
        errorMessage: `Failed to parse credentials: ${parseError.message}`
      }, { status: 500 });
    }

    // Validate required fields
    const requiredFields = ['type', 'project_id', 'client_email', 'private_key', 'token_uri'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required credential fields:', missingFields);
      return Response.json({ 
        errorCode: 'INVALID_CREDENTIALS',
        errorSource: 'validation',
        errorMessage: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 500 });
    }

    if (credentials.type !== 'service_account') {
      console.error('❌ Invalid credential type:', credentials.type);
      return Response.json({ 
        errorCode: 'INVALID_CREDENTIALS',
        errorSource: 'validation',
        errorMessage: `Expected type "service_account", got "${credentials.type}"`
      }, { status: 500 });
    }

    // Fix private key if it has literal \n characters
    if (credentials.private_key.includes('\\n')) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      console.log('✓ Converted literal \\n to newlines in private_key');
    }

    console.log('✓ Credentials validated, project:', credentials.project_id);
    
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

    console.log('TTS Request payload:', {
      inputLength: ssml.length,
      voice: voiceName,
      languageCode: 'en-GB',
      speakingRate,
      audioEncoding: 'MP3'
    });
    console.log('Calling Google TTS API...');

    // Get access token
    let accessToken;
    try {
      accessToken = await getAccessToken(credentials);
      console.log('✓ Access token obtained');
    } catch (tokenError) {
      console.error('❌ Failed to get access token:', tokenError.message);
      return Response.json({ 
        errorCode: 'TOKEN_FAILED',
        errorSource: 'google_tts',
        errorMessage: `Failed to authenticate with Google: ${tokenError.message}`
      }, { status: 500 });
    }

    // Call Google Cloud Text-to-Speech REST API
    let response;
    try {
      response = await fetch(
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(ttsRequest)
        }
      );
      console.log('✓ TTS API response status:', response.status);
    } catch (fetchError) {
      console.error('❌ TTS API network error:', fetchError.message);
      return Response.json({ 
        errorCode: 'NETWORK_ERROR',
        errorSource: 'google_tts',
        errorMessage: `Network error calling Google TTS: ${fetchError.message}`
      }, { status: 500 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google TTS API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return Response.json({ 
        errorCode: 'TTS_API_ERROR',
        errorSource: 'google_tts',
        errorMessage: `Google TTS failed (${response.status}): ${errorText}`,
        details: errorText
      }, { status: 500 });
    }

    let ttsResult;
    try {
      ttsResult = await response.json();
      if (!ttsResult.audioContent) {
        throw new Error('No audioContent in response');
      }
      console.log('✓ TTS response received with audioContent');
    } catch (parseError) {
      console.error('❌ Failed to parse TTS response:', parseError.message);
      return Response.json({ 
        errorCode: 'INVALID_TTS_RESPONSE',
        errorSource: 'google_tts',
        errorMessage: 'Invalid response from Google TTS'
      }, { status: 500 });
    }

    let audioContent;
    try {
      audioContent = Uint8Array.from(atob(ttsResult.audioContent), c => c.charCodeAt(0));
      console.log('✓ Audio decoded, size:', audioContent.length, 'bytes');
    } catch (decodeError) {
      console.error('❌ Failed to decode audio:', decodeError.message);
      return Response.json({ 
        errorCode: 'DECODE_ERROR',
        errorSource: 'google_tts',
        errorMessage: 'Failed to decode audio content'
      }, { status: 500 });
    }

    // Upload audio file to PRIVATE storage
    let file_uri;
    try {
      const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
      const audioFile = new File([audioBlob], `audio_${contentHash}.mp3`, { type: 'audio/mpeg' });
      
      console.log('Uploading to private storage...');
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: audioFile });
      file_uri = uploadResult.file_uri;
      
      if (!file_uri) {
        throw new Error('No file_uri returned from UploadPrivateFile');
      }
      
      console.log('✓ Uploaded to private storage:', file_uri);
    } catch (uploadError) {
      console.error('❌ File upload failed:', uploadError.message);
      return Response.json({ 
        errorCode: 'UPLOAD_FAILED',
        errorSource: 'base44_files',
        errorMessage: `Failed to upload audio file: ${uploadError.message}`
      }, { status: 500 });
    }

    // Cache the file URI
    try {
      await base44.asServiceRole.entities.AudioCache.create({
        contentHash,
        audioUrl: file_uri,
        textLength: sectionText.length,
        voiceGender,
        speakingRate
      });
      console.log('✓ Cached in database');
    } catch (cacheError) {
      console.error('⚠️ Failed to cache in database:', cacheError.message);
      // Continue anyway - we have the file
    }

    // Generate signed URL for immediate use
    let signed_url;
    try {
      const signResult = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: file_uri,
        expires_in: 3600 // 1 hour
      });
      signed_url = signResult.signed_url;
      
      if (!signed_url) {
        throw new Error('No signed_url returned from CreateFileSignedUrl');
      }
      
      console.log('✓ Signed URL created, expires in 1 hour');
    } catch (signError) {
      console.error('❌ Failed to create signed URL:', signError.message);
      return Response.json({ 
        errorCode: 'SIGN_URL_FAILED',
        errorSource: 'base44_files',
        errorMessage: `Failed to create signed URL: ${signError.message}`
      }, { status: 500 });
    }

    console.log('=== TTS Complete ===');
    return Response.json({ audioUrl: signed_url, cached: false });
  } catch (error) {
    console.error('=== TTS ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ 
      errorCode: 'UNKNOWN_ERROR',
      errorSource: 'unknown',
      errorMessage: error.message,
      stack: error.stack 
    }, { status: 500 });
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

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', {
      status: tokenResponse.status,
      body: errorText
    });
    throw new Error(`OAuth token exchange failed (${tokenResponse.status}): ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    console.error('No access_token in response:', tokenData);
    throw new Error('No access token received from Google OAuth');
  }
  
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