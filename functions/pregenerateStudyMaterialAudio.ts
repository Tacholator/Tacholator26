import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Pre-generates audio for study material in multiple voices and speeds
 * Called by admin when saving/publishing material
 */
Deno.serve(async (req) => {
  console.log('=== PREGENERATE STUDY MATERIAL AUDIO ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate and verify admin
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Parse request body
    const { materialId, sectionId, sectionText } = await req.json();
    
    if (!materialId || !sectionId || !sectionText) {
      return Response.json({ 
        error: 'Missing required fields: materialId, sectionId, sectionText' 
      }, { status: 400 });
    }
    
    console.log('Generating audio for:', { materialId, sectionId, textLength: sectionText.length });
    
    // Define configurations to pre-generate
    const configs = [
      { voiceGender: 'female', speakingRate: 1.0 },
      { voiceGender: 'male', speakingRate: 1.0 },
      { voiceGender: 'female', speakingRate: 0.8 },
      { voiceGender: 'female', speakingRate: 1.2 },
    ];
    
    const results = [];
    
    // Generate audio for each configuration
    for (const config of configs) {
      console.log(`Generating: ${config.voiceGender} @ ${config.speakingRate}x`);
      
      try {
        // Call the main generation function
        const response = await base44.asServiceRole.functions.invoke('generateStudyMaterialAudio', {
          materialId: materialId.toString(),
          sectionId,
          sectionText,
          voiceGender: config.voiceGender,
          speakingRate: config.speakingRate
        });
        
        if (response.data?.audioUrl) {
          console.log(`✓ Generated ${config.voiceGender} @ ${config.speakingRate}x`);
          results.push({
            voiceGender: config.voiceGender,
            speakingRate: config.speakingRate,
            status: 'success',
            audioUrl: response.data.audioUrl
          });
        } else {
          console.error(`❌ Failed to generate ${config.voiceGender} @ ${config.speakingRate}x`);
          results.push({
            voiceGender: config.voiceGender,
            speakingRate: config.speakingRate,
            status: 'failed',
            error: 'No audio URL returned'
          });
        }
      } catch (error) {
        console.error(`❌ Error generating ${config.voiceGender} @ ${config.speakingRate}x:`, error.message);
        results.push({
          voiceGender: config.voiceGender,
          speakingRate: config.speakingRate,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    console.log(`Completed: ${successCount} success, ${failedCount} failed`);
    
    return Response.json({
      success: true,
      message: `Generated ${successCount} of ${configs.length} audio variants`,
      successCount,
      failedCount,
      results
    });
    
  } catch (error) {
    console.error('❌ Pregeneration error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});