import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId, content } = await req.json();
    if (!postId || !content?.trim()) return Response.json({ error: 'postId and content are required' }, { status: 400 });

    const userRole = user.role === 'admin' ? 'instructor' : 'learner';

    const comment = await base44.asServiceRole.entities.CommunityComment.create({
      postId,
      userId: user.id,
      userFullName: user.full_name || user.email,
      userRole,
      content: content.trim()
    });

    // Increment commentCount on post
    const posts = await base44.asServiceRole.entities.CommunityPost.filter({ id: postId });
    if (posts[0]) {
      await base44.asServiceRole.entities.CommunityPost.update(postId, {
        commentCount: (posts[0].commentCount || 0) + 1
      });
    }

    return Response.json({ comment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});