-- Community System Enhancements
-- Migration: 101_community_enhancements.sql
-- Adds missing columns and tables for full community functionality

-- Add missing columns to posts table if they don't exist
DO $$
BEGIN
    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'location') THEN
        ALTER TABLE posts ADD COLUMN location VARCHAR(255);
    END IF;
    
    -- Add media_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_url') THEN
        ALTER TABLE posts ADD COLUMN media_url VARCHAR(500);
    END IF;
    
    -- Add media_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_type') THEN
        ALTER TABLE posts ADD COLUMN media_type VARCHAR(50);
    END IF;
END $$;

-- Post Likes table (if not exists from community_posts migration)
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Comments table (if not exists)
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment Likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Trending Topics table (if not exists)
CREATE TABLE IF NOT EXISTS trending_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own likes" ON post_likes;
CREATE POLICY "Users can manage their own likes" ON post_likes 
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for post_bookmarks
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON post_bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON post_bookmarks 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON post_bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON post_bookmarks 
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for post_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
CREATE POLICY "Anyone can view comments" ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;
CREATE POLICY "Authenticated users can create comments" ON post_comments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own comments" ON post_comments;
CREATE POLICY "Users can manage their own comments" ON post_comments 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
CREATE POLICY "Users can delete their own comments" ON post_comments 
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
CREATE POLICY "Anyone can view comment likes" ON comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own comment likes" ON comment_likes;
CREATE POLICY "Users can manage their own comment likes" ON comment_likes 
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for trending_topics
DROP POLICY IF EXISTS "Anyone can view active trending topics" ON trending_topics;
CREATE POLICY "Anyone can view active trending topics" ON trending_topics 
    FOR SELECT USING (is_active = true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Functions to increment/decrement counts (with secure search_path)
CREATE OR REPLACE FUNCTION public.increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_comment_likes_count(comment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.post_comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_comment_likes_count(comment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.post_comments SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_poll_votes(option_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.community_poll_options 
    SET votes_count = COALESCE(votes_count, 0) + 1 
    WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comment_likes_count(UUID) TO authenticated;
