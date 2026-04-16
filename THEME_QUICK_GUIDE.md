# ✨ Magical Theme - Quick Reference Guide

## 🎨 Color Classes

### Gradients
```html
<div class="gradient-primary">Indigo → Purple → Pink</div>
<div class="gradient-sunset">Orange → Rose → Pink</div>
<div class="gradient-ocean">Cyan → Blue → Indigo</div>
<div class="gradient-aurora">Green → Cyan → Indigo</div>
<div class="gradient-fire">Yellow → Orange → Pink</div>
<div class="gradient-cosmic">Purple → Indigo → Cyan</div>
```

### Text Gradients
```html
<h1 class="text-gradient">Magical Heading</h1>
<h2 class="text-gradient-sunset">Sunset Text</h2>
<h3 class="text-gradient-ocean">Ocean Text</h3>
```

## 💎 Effect Classes

### Glass Morphism
```html
<div class="glass">Translucent glass effect</div>
<div class="glass-dark">Dark glass effect</div>
<div class="card card-glass">Glass card</div>
```

### Neumorphism
```html
<div class="neuro">Soft 3D effect</div>
<div class="neuro-inset">Inset 3D effect</div>
```

### Glow Effects
```html
<div class="glow">Primary glow</div>
<div class="glow-cyan">Cyan glow</div>
<div class="glow-purple">Purple glow</div>
<button class="btn btn-primary glow">Glowing button</button>
```

## 🎭 Animation Classes

### Entrance Animations
```html
<div class="animate-fade-in">Fade in</div>
<div class="animate-slide-in-left">Slide from left</div>
<div class="animate-slide-in-right">Slide from right</div>
<div class="animate-scale-in">Scale up</div>
<div class="animate-rotate-in">Rotate in</div>
```

### Continuous Animations
```html
<div class="animate-float">Floating</div>
<div class="animate-bounce">Bouncing</div>
<div class="animate-pulse">Pulsing</div>
<div class="animate-spin">Spinning</div>
<div class="animate-wave">Waving</div>
<div class="animate-glow">Glowing pulse</div>
```

### Hover Animations
```html
<div class="hover-lift">Lift on hover</div>
<div class="hover-scale">Scale on hover</div>
<div class="hover-rotate">Rotate on hover</div>
<div class="hover-glow">Glow on hover</div>
```

## 🎯 Button Styles

### Button Variants
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-glass">Glass</button>
<button class="btn btn-neon">Neon</button>
```

### Button Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Animated Buttons
```html
<button class="btn btn-primary animate-pulse">Pulsing</button>
<button class="btn btn-secondary animate-float">Floating</button>
<button class="btn btn-neon animate-glow">Glowing</button>
```

## 💎 Card Styles

### Card Variants
```html
<div class="card">Standard card</div>
<div class="card card-glass">Glass card</div>
<div class="card card-gradient">Gradient card</div>
<div class="card card-hover-lift">Bounce on hover</div>
<div class="card card-3d">3D rotation</div>
```

### Card with Effects
```html
<div class="card glow particles">
  <h3>Magical Card</h3>
  <p>With glow and particles</p>
</div>
```

## 🌟 Pattern Effects

### Background Patterns
```html
<div class="particles">Floating particles</div>
<div class="grid-pattern">Grid overlay</div>
<div class="dot-pattern">Dot pattern</div>
```

### Special Effects
```html
<div class="holographic">Holographic effect</div>
<div class="neon-border">Neon border</div>
<div class="gradient-border">Gradient border</div>
<div class="spotlight">Spotlight on hover</div>
<div class="ripple">Ripple on click</div>
```

## 🎨 Complete Examples

### Hero Section
```html
<section class="particles">
  <div class="container">
    <h1 class="text-gradient animate-fade-in">
      Welcome to ReWear
    </h1>
    <p class="animate-slide-in-left">
      Sustainable fashion platform
    </p>
    <button class="btn btn-primary animate-scale-in glow">
      Get Started
    </button>
  </div>
</section>
```

### Feature Card
```html
<div class="card card-glass hover-lift animate-fade-in">
  <div class="gradient-primary" style="width: 60px; height: 60px; border-radius: 12px;"></div>
  <h3>AI-Powered</h3>
  <p>Smart garment analysis</p>
  <button class="btn btn-outline btn-sm">Learn More</button>
</div>
```

### Stats Display
```html
<div class="card neuro">
  <h2 class="text-gradient">1,234</h2>
  <p class="text-muted">Happy Customers</p>
  <div class="animate-pulse" style="width: 100%; height: 4px; background: var(--gradient-primary);"></div>
</div>
```

### Call-to-Action
```html
<div class="card card-gradient glow">
  <h2 style="color: white;">Ready to Start?</h2>
  <p style="color: rgba(255,255,255,0.9);">Join thousands of users</p>
  <button class="btn btn-glass animate-bounce">
    Sign Up Now
  </button>
</div>
```

### Testimonial Card
```html
<div class="card card-glass spotlight">
  <div class="flex gap-md">
    <div class="neuro" style="width: 60px; height: 60px; border-radius: 50%;"></div>
    <div>
      <h4>John Doe</h4>
      <p class="text-muted">CEO, Fashion Co</p>
    </div>
  </div>
  <p>"Amazing platform with stunning design!"</p>
  <div class="gradient-primary" style="height: 2px; width: 50px;"></div>
</div>
```

## 🎯 Pro Tips

1. **Combine effects** for maximum impact:
   ```html
   <div class="card card-glass glow particles animate-fade-in">
   ```

2. **Use gradients** for important elements:
   ```html
   <h1 class="text-gradient">Important Heading</h1>
   ```

3. **Add animations** to draw attention:
   ```html
   <button class="btn btn-primary animate-pulse glow">
   ```

4. **Layer effects** for depth:
   ```html
   <div class="card neuro">
     <div class="gradient-primary" style="padding: 20px; border-radius: 12px;">
       <h3 style="color: white;">Layered Effect</h3>
     </div>
   </div>
   ```

5. **Use hover effects** for interactivity:
   ```html
   <div class="card hover-lift hover-glow">
   ```

## 🌈 Color Variables

Use in inline styles or custom CSS:

```css
/* Primary Colors */
var(--color-primary)        /* #6366f1 */
var(--color-primary-light)  /* #818cf8 */
var(--color-primary-dark)   /* #4f46e5 */

/* Secondary Colors */
var(--color-secondary)      /* #ec4899 */
var(--color-secondary-light)/* #f472b6 */
var(--color-secondary-dark) /* #db2777 */

/* Accent Colors */
var(--color-accent-cyan)    /* #06b6d4 */
var(--color-accent-purple)  /* #a855f7 */
var(--color-accent-orange)  /* #f97316 */
var(--color-accent-green)   /* #10b981 */

/* Gradients */
var(--gradient-primary)
var(--gradient-sunset)
var(--gradient-ocean)
var(--gradient-aurora)
var(--gradient-fire)
var(--gradient-cosmic)
```

## 📱 Responsive Classes

All effects are responsive by default. Use standard responsive utilities:

```html
<div class="card" style="width: 100%; max-width: 400px;">
  <!-- Automatically responsive -->
</div>
```

## ⚡ Performance Tips

1. Use CSS animations (already optimized)
2. Limit glow effects on mobile
3. Reduce backdrop-filter on low-end devices
4. Use `will-change` for frequently animated elements

---

**Quick Start:**
1. Add class names to your HTML
2. See instant magical effects
3. Combine for unique designs

**Documentation:** See `MAGICAL_THEME_COMPLETE.md` for full details

✨ **Happy designing!** ✨
