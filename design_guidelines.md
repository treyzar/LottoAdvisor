# Design Guidelines - Система Рекомендаций Лотерей СтоЛото

## Design Approach

**Reference-Based Approach**: Drawing inspiration from the official Stoloto lottery website's vibrant, card-based lottery marketplace aesthetic while adapting for a personalized recommendation engine. The design combines the excitement and visual appeal of lottery gaming with the utility of a data-driven recommendation system.

## Core Design Principles

1. **Vibrant & Trustworthy**: Use warm yellows and browns to create excitement while maintaining credibility
2. **Data Visualization with Personality**: Present complex probability data and recommendations in engaging, digestible formats
3. **Guided Experience**: Interactive tutorial system that feels helpful, not intrusive
4. **Progressive Disclosure**: Reveal information strategically through chatbot interactions and recommendation flows

## Typography

**Font Families**:
- Primary Headings: 'Lora', serif (elegant, trustworthy)
- Body & UI: 'Space Grotesk', sans-serif (modern, readable)

**Hierarchy**:
- H1: Lora, 2.5rem (40px), weight 700
- H2: Lora, 2rem (32px), weight 600
- H3: Space Grotesk, 1.5rem (24px), weight 600
- Body Large: Space Grotesk, 1.125rem (18px), weight 400
- Body: Space Grotesk, 1rem (16px), weight 400
- Small/Caption: Space Grotesk, 0.875rem (14px), weight 400

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16, 20 (p-2, m-4, gap-6, etc.)

**Container Strategy**:
- Max-width: 1280px (max-w-7xl) for main content
- Lottery card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Chatbot interface: max-w-2xl centered
- Detail pages: max-w-4xl

**Responsive Breakpoints**:
- Mobile: base (full width cards)
- Tablet: md (2 columns)
- Desktop: lg (3 columns for cards, expanded layouts)

## Component Library

### Navigation
- Sticky header with Stoloto branding
- Main navigation: Главная, Мои Параметры, Обучение
- Floating tutorial toggle button (bottom-right, 4rem diameter, circular)

### Lottery Cards
- Card structure: Image/icon top, title, key stats (jackpot, price, probability), CTA button
- Border radius: 0.875rem throughout
- Elevation: subtle shadow (shadow-md), hover elevation (shadow-lg with transform scale-102)
- Spacing: p-6 internal padding, gap-4 between elements
- "Новая рекомендация!" badge for updated results (top-right corner, red accent)

### Chatbot Interface
- Conversational container: max-w-2xl, centered, min-h-screen with py-20
- Message bubbles: System messages (left-aligned, warm yellow bg), user selections (right-aligned, dark brown bg with light text)
- Bubble spacing: mb-4 between messages, p-4 internal
- Input options: Large touch-friendly buttons for parameter selection (min-h-14, rounded-lg)
- Progress indicator: Step counter at top showing "Шаг 2 из 5"

### Interactive Tutorial System
- Full-screen overlay with backdrop-blur-md
- Spotlight effect: Current focused element has normal appearance, everything else has reduced opacity (0.3) and blur
- Tutorial dialog: Positioned near focused element with arrow pointer
- Dialog design: White bg, shadow-2xl, rounded-2xl, p-8, max-w-md
- Navigation arrows: Large circular buttons (3rem), smooth fade transitions between steps
- Close button: Top-right of dialog, easily accessible
- Animation: 300ms ease-in-out transitions for spotlight movement

### Recommendation Results
- Hero stats section: Total recommendations, match percentage, top prize potential
- Results grid: Lottery cards with personalized explanation overlay/expandable section
- Explanation format: "Выбрано потому что:" followed by bullet points matching user criteria
- Highlighted parameters: Bold text showing matched criteria (e.g., "Цена билета: **100₽** - в вашем бюджете")

### Saved Parameters View
- Timeline/history layout showing saved parameter sets
- Each set displayed as expandable card with date, parameters summary, "Обновить результаты" button
- Comparison view: Side-by-side of previous vs current recommendations

### Forms & Inputs
- Parameter selection: Large option cards with radio/checkbox styling (h-24, hover effects)
- Slider inputs for price/probability ranges with visible value labels
- Submit buttons: Full-width on mobile, auto-width on desktop, h-14, rounded-lg

### Data Displays
- Stats cards: Grid layout showing jackpot, price, win probability, frequency
- Icon-value pairs: Icon on left, value stacked vertically on right
- Probability meters: Visual bar charts with percentage labels

### Modals & Overlays
- Lottery detail modal: Full-screen on mobile, centered max-w-4xl on desktop
- Prize breakdown tables: Striped rows for readability
- Close mechanisms: X button + click outside + Escape key

## Animations

**Strategic Animation Use** (minimal but impactful):
- Tutorial spotlight: Smooth 400ms transition when moving between elements
- Card hover: scale(1.02) with 200ms ease
- Chatbot messages: Slide-in from left (system) or right (user) with 300ms ease
- Page transitions: Fade-in for content sections (opacity 0 to 1, 200ms)
- "New recommendation" badge: Subtle pulse animation (scale 1 to 1.05)

**NO animations for**: Default button states, standard form interactions, scrolling

## Images

**Hero Section**: 
Full-width hero banner (h-96 on desktop, h-64 on mobile) featuring vibrant lottery ticket imagery with blurred overlay. CTA buttons overlaid on hero use backdrop-blur-md backgrounds for readability.

**Lottery Cards**: 
Each lottery card includes small iconic imagery representing the lottery type (e.g., bingo balls, scratch card visuals, numbered tickets). Images are decorative, not critical to function.

**Chatbot Avatar**: 
Small circular bot avatar (3rem) appears with each system message, creating personable interaction.

**Empty States**: 
Friendly illustration when no saved parameters exist or no recommendations match criteria.

## Page-Specific Layouts

### Home/Catalog Page
- Hero section with tagline "Найдите свою удачу" and prominent "Начать подбор" CTA
- Featured lotteries section (3-column grid on desktop)
- "Популярные лотереи" section showing high-traffic options
- Quick stats bar: Total lotteries available, biggest current jackpot, recent winners count

### Chatbot Parameter Collection
- Full-page experience with centered conversation flow
- Fixed header showing "Подбор лотереи" title and exit option
- Bottom-fixed response area on mobile for easy thumb access
- Completion leads to animated transition to results

### Recommendation Results
- Summary banner at top with match score and parameter recap
- Grid of recommended lotteries, each with expanded personalized explanation
- Sidebar (desktop) or collapsible section (mobile) showing applied filters
- "Сохранить параметры" prominent CTA at bottom

### Lottery Detail Page
- Large lottery logo/image at top
- Key stats in prominent cards: Jackpot, ticket price, draw frequency, odds
- Tabs for: Описание, Правила, Призы, История розыгрышей
- Sticky "Рекомендовано для вас" indicator if matches user parameters

### Saved Parameters Dashboard
- Timeline view of saved parameter sets (chronological, newest first)
- Each entry shows: Date saved, parameters summary, recommendation count, "Посмотреть обновления" button
- Comparison mode toggle to see what changed between saves