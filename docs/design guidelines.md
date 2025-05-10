# **AI Super-Nanny Mobile PWA Style Guide**

## **Design Philosophy**

A soothing, intuitive interface designed for sleep-deprived parents operating one-handed, prioritizing voice interaction, with careful attention to night mode usability and cognitive load reduction.

## **Color Palette**

### **Primary Colors**

* **Deep Indigo (\#1F2937)**: Primary background for dark mode  
* **Soft Lavender (\#7C3AED)**: Main brand color, primary actions, key UI elements

### **Secondary Colors**

* **Midnight Blue (\#111827)**: Secondary background elements  
* **Cool Gray (\#9CA3AF)**: Secondary text, non-highlighted elements

### **Accent Colors**

* **Gentle Mint (\#10B981)**: Feeding events, success indicators  
* **Calm Blue (\#3B82F6)**: Sleep events, restful interactions  
* **Warm Amber (\#F59E0B)**: Diaper events, attention indicators  
* **Soft Violet (\#8B5CF6)**: Milestone events, developmental markers

### **Functional Colors**

* **Success Teal (\#059669)**: Confirmations, positive actions  
* **Warning Amber (\#D97706)**: Caution states, important notices  
* **Error Rose (\#E11D48)**: Error states, urgent attention needed  
* **Info Sapphire (\#2563EB)**: Informational elements, help indicators

### **Background Colors**

* **Night Black (\#030712)**: Deepest background (night mode)  
* **Charcoal (\#1F2937)**: Primary background (night mode)  
* **Slate (\#374151)**: Card backgrounds, elevated surfaces  
* **Warm Dark (\#4B5563)**: Tertiary surfaces, form fields

### **Light Mode Alternatives**

* **Pearl White (\#F9FAFB)**: Primary background  
* **Soft Gray (\#F3F4F6)**: Secondary background  
* **Pure White (\#FFFFFF)**: Card backgrounds

## **Typography**

### **Font Family**

* **Primary Font**: SF Pro Text

### **Font Weights**

* **Regular (400)**: Body text, secondary information  
* **Medium (500)**: Subheadings, important information  
* **Semibold (600)**: Interactive elements, key information  
* **Bold (700)**: Main headings, emphasis points

### **Font Styles**

* **Large Heading**: 24px/Bold, tracking \-0.5px  
* **Medium Heading**: 20px/Semibold, tracking \-0.3px  
* **Small Heading**: 18px/Semibold, tracking \-0.2px  
* **Body Large**: 16px/Regular, line height 24px  
* **Body Standard**: 15px/Regular, line height 22px  
* **Body Small**: 14px/Regular, line height 20px  
* **Caption**: 12px/Medium, line height 16px, tracking 0.2px  
* **Button Text**: 16px/Semibold

### **Text Colors**

* **Primary Text (Dark Mode)**: `#F9FAFB` (Pearl White at 95% opacity)  
* **Secondary Text (Dark Mode)**: `#D1D5DB` (Light Gray at 80% opacity)  
* **Tertiary Text (Dark Mode)**: `#9CA3AF` (Cool Gray at 60% opacity)

## **UI Components**

### **Button Styling**

#### **Primary Action Button**

* **Shape**: Pill shape (fully rounded) for thumb-friendly interaction  
* **Size**: 56px height, full width or 240px max  
* **Color**: Soft Lavender (`#7C3AED`) gradient to Violet (`#8B5CF6`)  
* **Text**: White, 16px/Semibold, centered  
* **States**:  
  * Pressed: 10% darker, slight scale down (0.98)  
  * Disabled: 40% opacity, non-interactive

#### **Secondary Button**

* **Shape**: 12px rounded corners  
* **Size**: 48px height  
* **Color**: Transparent with 1.5px Soft Lavender border  
* **Text**: Soft Lavender, 16px/Medium  
* **States**:  
  * Pressed: 10% Soft Lavender background  
  * Disabled: 40% opacity border and text

#### **Voice Capture Button**

* **Shape**: Circular (56px diameter)  
* **Position**: Centered at bottom of screen within thumb reach  
* **Color**: Soft Lavender to Violet gradient  
* **Icon**: Microphone icon (white)  
* **States**:  
  * Listening: Pulsing animation, red recording indicator  
  * Processing: Spinner animation

#### **Icon Button**

* **Shape**: Circular (44px)  
* **Color**: Transparent  
* **Icon**: Feature-appropriate, 24px  
* **States**:  
  * Pressed: 10% Soft Lavender background  
  * Selected: 15% Soft Lavender background, Soft Lavender icon

### **Card Styling**

#### **Timeline Card**

* **Shape**: 16px rounded corners  
* **Background**: Slate (`#374151`) in dark mode  
* **Border**: 1px border with color matching event type  
* **Shadow**: Subtle inner highlight (1px) at top edge  
* **Padding**: 16px  
* **Layout**: Icon left-aligned with event type, time right-aligned

#### **Information Card**

* **Shape**: 12px rounded corners  
* **Background**: Slate (`#374151`) with subtle gradient (2%)  
* **Shadow**: Very subtle drop shadow (2px blur, 10% opacity)  
* **Padding**: 20px  
* **States**:  
  * Interactive: Slight scale on press (1.01)  
  * Highlighted: Left accent border (3px) in feature color

#### **Chat Message Card**

* **Shape**:  
  * User messages: 16px rounded with sharper corner at bottom right  
  * AI responses: 16px rounded with sharper corner at bottom left  
* **Background**:  
  * User: Soft Lavender gradient (20% opacity)  
  * AI: Slate (`#374151`)  
* **Padding**: 14px  
* **Medical Information**: Teal left border for evidence-based info

### **Input Styling**

#### **Text Field**

* **Shape**: 12px rounded corners  
* **Background**: Warm Dark (`#4B5563`)  
* **Border**: None in resting state  
* **Text**: Pearl White  
* **States**:  
  * Focus: 1.5px Soft Lavender border  
  * Error: 1.5px Error Rose border

#### **Dropdown/Select**

* **Same as text field** plus:  
* **Indicator**: Chevron icon (Secondary)  
* **Options Menu**: Matches card styling

#### **Toggle**

* **Track**: Pill shape, 30px width  
* **Thumb**: Circular, 4px smaller than track height  
* **Colors**:  
  * Off: Cool Gray track, Pearl White thumb  
  * On: Soft Lavender track, Pearl White thumb  
* **Animation**: Smooth 300ms transition

### **Visual Elements**

#### **Icons**

* **Style**: Rounded, slightly heavier for visibility in low light  
* **Weight**: 2px stroke  
* **Sizes**:  
  * Standard: 24px  
  * Menu/Tab: 28px (larger touch targets for tired parents)  
  * Indicator: 20px  
* **Colors**: Match text hierarchy levels

#### **Event Type Indicators**

* **Feeding (Green)**: Bottle/breastfeeding icon  
* **Sleep (Blue)**: Moon/stars icon  
* **Diaper (Amber)**: Diaper icon  
* **Milestone (Violet)**: Star/flag icon

### **App Spacing**

#### **Base Unit**

* 8px as fundamental spacing unit

#### **Layout Spacing**

* **Screen Padding**: 20px sides (safe area \+ 4px)  
* **Section Spacing**: 32px between major sections  
* **Card Spacing**: 16px between cards  
* **Element Spacing**: 8px between related elements, 12px between groups

#### **Thumb-Friendly Zone**

* **Primary Action Zone**: Bottom 20% of screen, centered  
* **Safe Secondary Actions**: Top corners, bottom corners  
* **Avoid**: Center of screen (requires stretching while holding baby)

### **Motion and Animation**

#### **Timing**

* **Quick**: 200ms (state changes, feedback)  
* **Standard**: 300ms (transitions, animations)  
* **Deliberate**: 450ms (major view changes)

#### **Easing**

* **Standard**: Ease-out-cubic (natural feeling)  
* **Energetic**: Ease-out-back (slight overshoot for emphasis)  
* **Precise**: Ease-in-out (smooth, controlled)

#### **Transition Types**

* **Cards**: Fade \+ slight rise  
* **Dialogs**: Fade \+ scale from 0.95 to 1  
* **Page Transitions**: Slide from direction of navigation  
* **Voice Button**: Subtle pulse when waiting to record

### **Night Mode Excellence**

#### **Automatic Switching**

* Default to dark mode during evening hours (8pm-6am)  
* Manual override always available

#### **Night Vision Preservation**

* Red-shifted UI elements during night hours  
* Reduce blue light emission  
* Lowered overall brightness with adaptive control

#### **Night Mode Adaptations**

* **Increased contrast** for critical information  
* **Larger touch targets** (min 44px) for bleary-eyed parents  
* **Simplified layouts** with reduced information density

