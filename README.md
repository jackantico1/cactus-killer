# Cactus Killer

A tower defense game where you protect your territory from invading cacti! Place strategic towers to defeat waves of cacti and earn tokens to build more defenses.

## Features

- 5 unique tower types with different abilities:
  - Water Cannon: High fire rate, medium damage
  - Poison Sprayer: Applies damage over time
  - Fire Tower: High damage, low fire rate
  - Ice Tower: Slows down enemies
  - Lightning Rod: Chain damage
- Wave-based gameplay with increasing difficulty
- Token system for purchasing towers
- Score tracking and game over system
- Special effects (poison and slow) from certain towers

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jackantico1/cactus-killer.git
cd cactus-killer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) to play the game in your browser.

## How to Play

1. Start with 300 tokens
2. Click on a tower type from the selection menu (if you have enough tokens)
3. Click anywhere on the game board to place the tower
4. Towers will automatically target and shoot at cacti within their range
5. Earn tokens by destroying cacti
6. Survive as many waves as possible!

## Built With

- React
- TypeScript
- HTML Canvas
- CSS
