# FinHub

A comprehensive financial planning platform built with Vite and React, designed to empower users with tools and insights for making informed financial decisions.

## Overview

FinHub provides interactive financial calculators, portfolio tracking, and planning tools to help users:

- Plan their investments and withdrawals
- Track portfolio performance across multiple asset classes
- Understand complex financial concepts
- Make data-driven financial decisions
- Visualize their financial journey

## Features

### Financial Calculators

- **SIP to SWP Calculator**

  - Calculate optimal transition from investment to withdrawal phase
  - Interactive charts for visualization
  - Customizable parameters (investment amount, duration, expected returns)
  - Detailed breakdown of results

- **Zakat Calculator**

  - Calculate annual Zakat obligations
  - Easy-to-use interface for Islamic finance compliance
  - Comprehensive asset and liability tracking

- **Share Averaging Calculator**
  - Calculate optimal share purchases to reach target average price
  - Investment strategy optimization

### Portfolio Tracker (In Development)

- **Multi-Asset Portfolio Management**

  - Track stocks, mutual funds, bonds, and alternative investments
  - Real-time portfolio valuation and performance metrics
  - Asset allocation visualization and rebalancing suggestions

- **Investment Analytics**

  - Performance tracking with detailed charts and metrics
  - Risk analysis and diversification insights
  - Goal-based investment tracking

- **Secure Authentication**
  - OAuth integration with Google and GitHub
  - Secure data storage with Supabase backend

## Tech Stack

### Frontend

- **Framework**: Vite + React 18 with TypeScript
- **Routing**: React Router DOM for client-side navigation
- **Styling**:
  - Tailwind CSS for utility-first styling
  - Shadcn/UI for consistent, accessible components
- **Data Visualization**:
  - Recharts for portfolio performance charts
  - Nivo charts for advanced financial visualizations
- **State Management**:
  - TanStack Query for server state management
  - React Context API for client state

### Backend & Database

- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with OAuth providers
- **Database**: PostgreSQL with Row Level Security (RLS)

### Development Tools

- **Language**: TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Form Handling**:
  - React Hook Form for form management
  - Zod for schema validation
- **Code Quality**:
  - ESLint for code linting
  - Prettier for code formatting
  - Husky for pre-commit hooks

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/UmairJibran/FinHub.git
cd FinHub
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
# Add your Supabase credentials and other environment variables
```

4. Start the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Main app pages (converted from Next.js)
├── components/             # Reusable UI components
│   ├── layout/            # Layout components (Header, Footer)
│   └── ui/                # Shadcn/UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
│   └── supabase/         # Supabase client configuration
├── modules/               # Feature-specific modules
│   ├── portfolio-tracker/ # Portfolio tracking functionality
│   ├── sip-swp/          # SIP-SWP calculator
│   ├── zakat/            # Zakat calculator
│   └── share-averaging/   # Share averaging calculator
└── pages/                 # Additional pages (Auth, Dashboard, etc.)
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Umair Jibran - [@umairjibran7](https://twitter.com/umairjibran7)

Project Link: [https://github.com/UmairJibran/FinHub](https://github.com/UmairJibran/FinHub)
