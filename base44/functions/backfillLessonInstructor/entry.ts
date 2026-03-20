import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all lessons with null instructorId
    const lessonsWithoutInstructor = await base44.asServiceRole.entities.Lesson.filter({ instructorId: null });
    
    let updated = 0;
    let errors = [];

    for (const lesson of lessonsWithoutInstructor) {
      if (!lesson.pupilId) continue;

      // Get the pupil to find their instructor
      const pupils = await base44.asServiceRole.entities.Pupil.filter({ id: lesson.pupilId });
      
      if (pupils.length > 0 && pupils[0].instructorId) {
        try {
          await base44.asServiceRole.entities.Lesson.update(lesson.id, { 
            instructorId: pupils[0].instructorId 
          });
          updated++;
        } catch (e) {
          errors.push({ lessonId: lesson.id, error: e.message });
        }
      }
    }

    return Response.json({ 
      success: true, 
      updated, 
      total: lessonsWithoutInstructor.length,
      errors 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});