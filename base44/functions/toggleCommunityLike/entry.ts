import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId } = await req.json();
    if (!postId) return Response.json({ error: 'postId is required' }, { status: 400 });

    // Check if already liked
    const existing = await base44.asServiceRole.entities.CommunityLike.filter({ postId, userId: user.id });

    const posts = await base44.asServiceRole.entities.CommunityPost.filter({ id: postId });
    const post = posts[0];
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    if (existing.length > 0) {
      // Unlike
      await base44.asServiceRole.entities.CommunityLike.delete(existing[0].id);
      const newCount = Math.max(0, (post.likeCount || 0) - 1);
      await base44.asServiceRole.entities.CommunityPost.update(postId, { likeCount: newCount });
      return Response.json({ liked: false, likeCount: newCount });
    } else {
      // Like
      await base44.asServiceRole.entities.CommunityLike.create({ postId, userId: user.id });
      const newCount = (post.likeCount || 0) + 1;
      await base44.asServiceRole.entities.CommunityPost.update(postId, { likeCount: newCount });
      return Response.json({ liked: true, likeCount: newCount });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});