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

    console.log('=== TTS Request ===');
    console.log('User:', user.email);
    console.log('Material:', materialId, 'Section:', sectionId);
    console.log('Voice:', voiceGender, 'Rate:', speakingRate);
    console.log('Text length:', sectionText?.length || 0, 'chars');

    if (!sectionText || sectionText.trim().length === 0) {
      console.error('❌ VALIDATION_INPUT: sectionText is empty');
      return Response.json({ 
        errorCode: 'TTS_MISSING_TEXT',
        errorStage: 'VALIDATION_INPUT',
        errorMessage: 'sectionText is required and cannot be empty',
        httpStatus: 400
      }, { status: 400 });
    }

    // Convert text to SSML first
    let ssml;
    try {
      ssml = convertToSSML(sectionText);
      console.log('✓ SSML generated, length:', ssml.length, 'chars');
    } catch (ssmlError) {
      console.error('❌ SSML_BUILD failed:', ssmlError.message);
      return Response.json({ 
        errorCode: 'TTS_SSML_BUILD_FAILED',
        errorStage: 'SSML_BUILD',
        errorMessage: `Failed to convert text to SSML: ${ssmlError.message}`,
        httpStatus: 500
      }, { status: 500 });
    }

    // Google TTS has a 5000 character limit - chunk if needed
    if (ssml.length > 5000) {
      console.log('⚠️ SSML too long (', ssml.length, 'chars), chunking into smaller pieces...');
    }
    
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
    
    // If SSML is too long, we need to chunk it
    const ssmlChunks = ssml.length > 5000 ? chunkSSML(ssml, 4500) : [ssml];
    console.log('Number of SSML chunks:', ssmlChunks.length);

    // Get Google Cloud credentials
    let credentialsJson = Deno.env.get('GOOGLE_TTS_SERVICE_ACCOUNT_JSON');
    if (!credentialsJson) {
      console.error('❌ VALIDATION_INPUT: GOOGLE_TTS_SERVICE_ACCOUNT_JSON not found in environment');
      return Response.json({ 
        errorCode: 'TTS_MISSING_CREDENTIALS',
        errorStage: 'VALIDATION_INPUT',
        errorMessage: 'Google TTS credentials not configured. Please contact support.',
        httpStatus: 500
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
      console.log('Project ID:', credentials.project_id);
      console.log('Client email:', credentials.client_email);
    } catch (parseError) {
      console.error('❌ VALIDATION_INPUT: Failed to parse credentials JSON:', parseError.message);
      return Response.json({ 
        errorCode: 'TTS_INVALID_CREDENTIALS',
        errorStage: 'VALIDATION_INPUT',
        errorMessage: `Failed to parse credentials: ${parseError.message}`,
        httpStatus: 500
      }, { status: 500 });
    }

    // Validate required fields
    const requiredFields = ['type', 'project_id', 'client_email', 'private_key', 'token_uri'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ VALIDATION_INPUT: Missing required credential fields:', missingFields);
      return Response.json({ 
        errorCode: 'TTS_INVALID_CREDENTIALS',
        errorStage: 'VALIDATION_INPUT',
        errorMessage: `Missing required credential fields: ${missingFields.join(', ')}`,
        httpStatus: 500
      }, { status: 500 });
    }

    if (credentials.type !== 'service_account') {
      console.error('❌ VALIDATION_INPUT: Invalid credential type:', credentials.type);
      return Response.json({ 
        errorCode: 'TTS_INVALID_CREDENTIALS',
        errorStage: 'VALIDATION_INPUT',
        errorMessage: `Expected type "service_account", got "${credentials.type}"`,
        httpStatus: 500
      }, { status: 500 });
    }

    // Fix private key if it has literal \n characters
    if (credentials.private_key.includes('\\n')) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      console.log('✓ Converted literal \\n to newlines in private_key');
    }

    console.log('✓ Credentials validated, project:', credentials.project_id);
    
    // Voice configuration based on gender with fallback
    const voiceMap = {
      'male': 'en-GB-Neural2-B',
      'female': 'en-GB-Neural2-A'
    };
    const voiceName = voiceMap[voiceGender] || 'en-GB-Neural2-A'; // Default to female
    console.log('Selected voice:', voiceName, 'for gender:', voiceGender);



    // Get access token
    let accessToken;
    try {
      accessToken = await getAccessToken(credentials);
      console.log('✓ OAuth access token obtained, length:', accessToken?.length || 0);
    } catch (tokenError) {
      console.error('❌ GOOGLE_TTS_CALL: Failed to get access token:', tokenError.message);
      return Response.json({ 
        errorCode: 'TTS_AUTH_FAILED',
        errorStage: 'GOOGLE_TTS_CALL',
        errorMessage: `Failed to authenticate with Google: ${tokenError.message}`,
        httpStatus: 500
      }, { status: 500 });
    }

    // Process each chunk and combine audio
    const audioChunks = [];
    
    for (let i = 0; i < ssmlChunks.length; i++) {
      const chunk = ssmlChunks[i];
      console.log(`Processing chunk ${i + 1}/${ssmlChunks.length}, length: ${chunk.length} chars`);
      
      const ttsRequest = {
        input: { ssml: chunk },
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

      console.log(`Calling Google TTS API for chunk ${i + 1}...`);

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
        console.log(`✓ TTS API response for chunk ${i + 1}, status:`, response.status);
      } catch (fetchError) {
        console.error(`❌ GOOGLE_TTS_CALL: Network error on chunk ${i + 1}:`, fetchError.message);
        return Response.json({ 
          errorCode: 'TTS_NETWORK_ERROR',
          errorStage: 'GOOGLE_TTS_CALL',
          errorMessage: `Network error calling Google TTS: ${fetchError.message}`,
          httpStatus: 500
        }, { status: 500 });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GOOGLE_TTS_CALL: API error on chunk ${i + 1}:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          voiceName,
          speakingRate,
          chunkLength: chunk.length
        });
        
        let errorCode = `TTS_GOOGLE_${response.status}`;
        let errorMessage = `Google TTS API error (${response.status})`;
        
        // Parse Google error for specific issues
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
            if (errorMessage.includes('API not enabled')) {
              errorCode = 'TTS_API_NOT_ENABLED';
              errorMessage = 'Google Text-to-Speech API is not enabled for this project';
            } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
              errorCode = 'TTS_PERMISSION_DENIED';
              errorMessage = 'Service account lacks permission to call Text-to-Speech API';
            } else if (errorMessage.includes('quota')) {
              errorCode = 'TTS_QUOTA_EXCEEDED';
              errorMessage = 'Google TTS quota exceeded';
            } else if (errorMessage.includes('voice')) {
              errorCode = 'TTS_VOICE_INVALID';
              errorMessage = `Invalid voice name: ${voiceName}`;
            }
          }
        } catch (e) {
          // Not JSON, use generic error
        }
        
        return Response.json({ 
          errorCode,
          errorStage: 'GOOGLE_TTS_CALL',
          errorMessage,
          httpStatus: response.status,
          details: errorText
        }, { status: 500 });
      }

      let ttsResult;
      try {
        ttsResult = await response.json();
        
        if (!ttsResult.audioContent) {
          console.error(`❌ GOOGLE_TTS_CALL: No audioContent in chunk ${i + 1}:`, Object.keys(ttsResult));
          throw new Error('No audioContent in response');
        }
        console.log(`✓ Chunk ${i + 1} audioContent present, length:`, ttsResult.audioContent.length);
      } catch (parseError) {
        console.error(`❌ GOOGLE_TTS_CALL: Failed to parse TTS response for chunk ${i + 1}:`, parseError.message);
        return Response.json({ 
          errorCode: 'TTS_INVALID_RESPONSE',
          errorStage: 'GOOGLE_TTS_CALL',
          errorMessage: 'Invalid or empty response from Google TTS',
          httpStatus: 500
        }, { status: 500 });
      }

      let audioContentBytes;
      try {
        audioContentBytes = Uint8Array.from(atob(ttsResult.audioContent), c => c.charCodeAt(0));
        console.log(`✓ Chunk ${i + 1} decoded, size:`, audioContentBytes.length, 'bytes');
        
        if (audioContentBytes.length === 0) {
          console.error(`❌ GOOGLE_TTS_CALL: Decoded audio is empty for chunk ${i + 1}`);
          throw new Error('Decoded audio content is empty');
        }
        
        audioChunks.push(audioContentBytes);
      } catch (decodeError) {
        console.error(`❌ GOOGLE_TTS_CALL: Failed to decode audio for chunk ${i + 1}:`, decodeError.message);
        return Response.json({ 
          errorCode: 'TTS_DECODE_FAILED',
          errorStage: 'GOOGLE_TTS_CALL',
          errorMessage: 'Failed to decode audio content from Google TTS',
          httpStatus: 500
        }, { status: 500 });
      }
    }

    // Combine all audio chunks
    let audioContent;
    if (audioChunks.length === 1) {
      audioContent = audioChunks[0];
    } else {
      console.log('Combining', audioChunks.length, 'audio chunks...');
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      audioContent = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunks) {
        audioContent.set(chunk, offset);
        offset += chunk.length;
      }
      console.log('✓ Combined audio size:', audioContent.length, 'bytes');
    }

    // Upload audio file to PRIVATE storage
    let file_uri;
    try {
      const audioBlob = new Blob([audioContent], { type: 'audio/mpeg' });
      const audioFile = new File([audioBlob], `audio_${contentHash}.mp3`, { type: 'audio/mpeg' });
      
      console.log('Uploading to private storage, file size:', audioBlob.size, 'bytes');
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: audioFile });
      console.log('Upload result:', uploadResult);
      
      file_uri = uploadResult.file_uri;
      
      if (!file_uri) {
        console.error('❌ BASE44_FILE_UPLOAD: No file_uri in upload result:', uploadResult);
        throw new Error('No file_uri returned from UploadPrivateFile');
      }
      
      console.log('✓ Uploaded to private storage:', file_uri);
    } catch (uploadError) {
      console.error('❌ BASE44_FILE_UPLOAD: Upload failed:', uploadError.message);
      return Response.json({ 
        errorCode: 'TTS_UPLOAD_FAILED',
        errorStage: 'BASE44_FILE_UPLOAD',
        errorMessage: `Failed to upload audio file: ${uploadError.message}`,
        httpStatus: 500
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
      console.log('Creating signed URL for file_uri:', file_uri);
      const signResult = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: file_uri,
        expires_in: 3600 // 1 hour
      });
      console.log('Sign result:', signResult);
      
      signed_url = signResult.signed_url;
      
      if (!signed_url) {
        console.error('❌ SIGNED_URL: No signed_url in result:', signResult);
        throw new Error('No signed_url returned from CreateFileSignedUrl');
      }
      
      console.log('✓ Signed URL created, expires in 1 hour');
      console.log('Signed URL preview:', signed_url.substring(0, 100) + '...');
    } catch (signError) {
      console.error('❌ SIGNED_URL: Failed to create signed URL:', signError.message);
      return Response.json({ 
        errorCode: 'TTS_SIGN_URL_FAILED',
        errorStage: 'SIGNED_URL',
        errorMessage: `Failed to create signed URL: ${signError.message}`,
        httpStatus: 500
      }, { status: 500 });
    }

    console.log('=== TTS Complete ===');
    return Response.json({ audioUrl: signed_url, cached: false });
  } catch (error) {
    console.error('=== TTS UNEXPECTED ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ 
      errorCode: 'TTS_UNKNOWN_ERROR',
      errorStage: 'UNKNOWN',
      errorMessage: `Unexpected error: ${error.message}`,
      httpStatus: 500,
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

function chunkSSML(ssml, maxChunkSize = 4500) {
  // Extract content between <speak> tags
  const content = ssml.replace('<speak>', '').replace('</speak>', '');
  
  // Split by sentence/paragraph breaks
  const segments = content.split(/(<break time="[0-9]+ms"\/>)/g).filter(s => s.trim());
  
  const chunks = [];
  let currentChunk = '<speak>';
  
  for (const segment of segments) {
    // Check if adding this segment would exceed limit
    if ((currentChunk + segment + '</speak>').length > maxChunkSize && currentChunk.length > 20) {
      // Close current chunk and start new one
      currentChunk += '</speak>';
      chunks.push(currentChunk);
      currentChunk = '<speak>' + segment;
    } else {
      currentChunk += segment;
    }
  }
  
  // Add final chunk
  if (currentChunk.length > 20) {
    currentChunk += '</speak>';
    chunks.push(currentChunk);
  }
  
  return chunks;
}