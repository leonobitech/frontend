# Blog Components 📝

Modern, production-ready blog components for Leonobitech frontend.

## Components

### BlogHero
Hero section with animated gradient background and grid pattern overlay.

**Features:**
- Animated gradient background
- Framer Motion animations
- Grid pattern overlay
- Responsive design

**Usage:**
```tsx
import { BlogHero } from "@/components/blog";

export default function BlogPage() {
  return <BlogHero />;
}
```

---

### FeaturedPost
Large, featured post card with gradient border and special styling.

**Features:**
- Gradient border with hover effects
- Large image with overlay
- Featured badge
- Tags and meta information
- Smooth animations

**Props:**
```typescript
interface FeaturedPostProps {
  post: Post;
}
```

**Usage:**
```tsx
import { FeaturedPost } from "@/components/blog";

<FeaturedPost post={featuredPost} />
```

---

### PostCard
Modern post card with glassmorphism effects.

**Features:**
- Glassmorphism background
- Hover glow effect
- Image zoom on hover
- Category badge
- Tags
- Responsive layout

**Props:**
```typescript
interface PostCardProps {
  post: Post;
  index: number; // For staggered animations
}
```

**Usage:**
```tsx
import { PostCard } from "@/components/blog";

<PostCard post={post} index={0} />
```

---

## Post Type

```typescript
interface Post {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  readTime: string;
  image: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
  };
}
```

---

## Design Principles

### Inspired By
- **Vercel Blog**: Clean, minimalist design
- **Linear**: Subtle animations and gradients
- **Stripe**: Professional and polished

### Features
- **Glassmorphism**: Backdrop blur effects
- **Gradient Borders**: Animated gradient borders on hover
- **Smooth Animations**: Framer Motion for all interactions
- **Dark Mode**: Perfectly adapted for light/dark themes
- **Responsive**: Mobile-first design
- **Accessible**: Semantic HTML, ARIA labels

### Performance
- **Image Optimization**: Next.js Image component with lazy loading
- **Animation Performance**: GPU-accelerated transforms
- **Bundle Size**: Tree-shakeable components

---

## SEO & Open Graph

The blog page includes comprehensive meta tags for:
- **LinkedIn**: Open Graph optimized
- **Twitter**: Twitter Card support
- **Google**: Structured data ready

```tsx
export const metadata: Metadata = {
  title: "Engineering Blog | Leonobitech",
  description: "Deep dives into Rust, architecture...",
  openGraph: {
    // ... LinkedIn optimization
  },
  twitter: {
    // ... Twitter cards
  },
};
```

---

## Customization

### Colors
Gradients use Tailwind's color palette:
- Purple: `purple-500`
- Pink: `pink-500`
- Blue: `blue-500`

Adjust in each component's gradient definitions.

### Animations
Animation timing can be adjusted:
- Stagger delay: `index * 0.1` in PostCard
- Gradient animation: `15s` in BlogHero

### Typography
Uses Geist Sans font (defined in layout).

---

## Future Enhancements

- [ ] Search functionality
- [ ] Category filtering
- [ ] Tag filtering
- [ ] Pagination
- [ ] Reading progress indicator
- [ ] Share buttons
- [ ] View count
- [ ] Related posts
- [ ] Newsletter signup

---

## Dependencies

- `framer-motion`: Animations
- `lucide-react`: Icons
- `next`: Image optimization, Link
- `@/components/ui/badge`: Shadcn badge component

---

Built with ❤️ by Leonobitech
