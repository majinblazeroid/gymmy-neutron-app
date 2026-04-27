@AGENTS.md

## Design System

Full guide: `docs/design-language.md`

### Brand Color Palette (`app/globals.css`)

| Token | Hex | Usage |
|---|---|---|
| `--celadon` | `#adf7b6` | Gym / workout sections |
| `--peach-glow` | `#ffc09f` | BJJ sections |
| `--cool-horizon` | `#79addc` | Run / post-workout / info panels |
| `--light-gold` | `#ffee93` | Achievements / done states |
| `--lemon-chiffon` | `#fcf5c7` | Home card background |

### Rules
- Color lives on **panels/tiles only** — cards inside panels are always white (`bg-white`)
- Never put brand color in text — only in backgrounds
- Icons inside cards: always `text-gray-400`, no colored icon containers
- Page background: `#f9f9f8` | Card background: `#ffffff`
- Primary text: `#495057` (`text-[#495057]`) | Secondary: `text-gray-400`
- Spacing: `pt-10` page top, `space-y-8` between major sections
- Border radius: panels `rounded-3xl`, cards `rounded-2xl`, badges `rounded-full`
- Panel opacity: 18–22% for main brand colors (e.g. `rgba(173,247,182,0.20)`)
- Pastel tiles (solid color): use dark text (`#495057`), not white
