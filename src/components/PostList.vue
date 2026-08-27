<template>
  <div class="postlist">
    <section class="postlist__list" aria-label="文章列表">
      <PostCard
        v-for="(post, i) in posts"
        :key="post.slug"
        :post="post"
        :url="`/posts/${post.slug}/`"
        :index="i"
      />
    </section>
    <div v-if="posts.length === 0" class="postlist__empty">
      <p>没有符合条件的文章。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import PostCard from "@components/PostCard.vue";
import type { Post } from "@utils/content-utils";

defineProps<{
  posts: Post[];
}>();
</script>

<style scoped>
.postlist__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.postlist__empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
