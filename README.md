# Early Retirement Simulator

A browser-based financial independence simulator that helps you visualize when your portfolio's passive return will exceed your inflation-adjusted living expenses — the **crossover point** toward early retirement.

---

## Features

- **Crossover detection** — finds the first year when annual passive return ≥ annual expenses
- **Inflation-adjusted projections** — expenses grow year-over-year at your chosen inflation rate
- **Interactive sliders + text inputs** — tweak any parameter and the chart updates instantly
- **Shareable URLs** — every change is reflected in the query string so you can share your exact scenario
- **Age-aware X-axis** — enter your current age to show age instead of relative/calendar years on the chart
- **Dark / light theme** — respects your OS preference, toggleable in-app
- **Bilingual** — English and Serbian (sr/en), stored in `localStorage`

## Parameters

| Parameter | Description |
|---|---|
| Current capital | Starting portfolio value |
| Monthly need (net) | How much you need per month in today's prices |
| Monthly contribution | Amount you invest every month |
| Annual inflation % | Expected price growth per year |
| Annual return % | Expected nominal portfolio return per year |
| Horizon (years) | How many years to simulate |
| Age *(optional)* | Enables age-based X-axis and age-at-crossover stat |

## Chart

Three lines are plotted over the simulation horizon:

- **Purple (left axis)** — total capital
- **Red (right axis)** — inflation-adjusted annual expenses
- **Green (right axis)** — annual passive return (capital × return rate)

A dashed reference line marks the crossover year when passive income first overtakes expenses.

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [Recharts](https://recharts.org) for the chart

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build
```

## License

MIT
