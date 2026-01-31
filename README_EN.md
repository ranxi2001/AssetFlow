# AssetFlow

<div align="center">

**A self-hosted, open-source Web3 asset dashboard**

Web2 & Web3 Asset Management | Real-time Price Tracking | Responsive Design

[简体中文](README.md) | English

</div>

---

## Screenshots

<div align="center">

![Dashboard](assets/screenshot-dashboard.png)
*Dashboard - Asset distribution visualization & real-time price tracking*

![Asset Trends & Details](assets/screenshot-detail.png)
*Total Value Trend - 30-day value changes & categorized asset details*

![Privacy Mode](assets/screenshot-privacy.png)
*Privacy Mode - Hide sensitive data with one click for safe sharing*

</div>

---

## Features

- **Multi-asset Support**: Web2 (banks, Alipay, WeChat), Web3 (exchanges, wallets, DeFi), Physical assets (precious metals, forex)
- **Real-time Prices**: CoinGecko API integration for live cryptocurrency prices
- **Responsive Design**: Works perfectly on desktop and mobile
- **Local Storage**: All data stored in local SQLite database for privacy
- **Privacy Mode**: One-click hide sensitive data (amounts, values, locations) for safe sharing
- **Visual Charts**: Asset distribution and trends with Chart.js
- **Modern UI**: Built with Vue 3 + Tailwind CSS
- **Easy Deployment**: One-click start, no complex configuration

---

## Core Features

### Asset Management

- Add, edit, delete asset records
- Asset categorization (Web2/Web3/Physical)
- Asset transfer tracking
- Real-time total value calculation

### Price Tracking

- Real-time cryptocurrency prices (via CoinGecko API)
- Automatic currency conversion (USD to CNY)
- Price history records

### Data Visualization

- Asset distribution pie charts
- Asset value trend charts
- Multi-dimensional statistics

---

## Quick Start

### Requirements

- Node.js >= 16.x
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ranxi2001/AssetFlow.git
cd AssetFlow
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development server**

```bash
npm run dev
```

Frontend runs at `http://localhost:1456`, backend API at `http://localhost:1457`

> [!NOTE]
> **First Run**:
> - The app automatically creates SQLite database file `assetflow.db` in `data/` directory
> - Database initializes all necessary tables (assets, price cache, rates, price history, etc.)
> - Sample data is inserted to help you understand the app features
> - You can edit or delete sample data and add your own assets
> - Database file is excluded in `.gitignore` to protect your privacy

4. **Access the app**

Open `http://localhost:1456` in your browser. On first visit, you can set an access password (optional).

### Production Deployment

1. **Build for production**

```bash
npm run build
```

2. **Start production server**

```bash
PORT=1456 npm run start
```

3. **Run persistently (recommended: pm2)**

```bash
# Install pm2
npm install -g pm2

# Start service
PORT=1456 pm2 start server/index.js --name assetflow

# Auto-start on boot
pm2 save
pm2 startup
```

---

## Project Structure

```
AssetFlow/
├── src/                    # Vue frontend source
│   ├── components/         # Vue components
│   ├── App.vue            # Main app component
│   ├── api.js             # API calls
│   ├── main.js            # App entry
│   └── style.css          # Global styles
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   ├── api.js             # API routes
│   └── db.js              # SQLite database operations
├── data/                   # Data directory
│   └── assetflow.db       # SQLite database (auto-generated)
├── assets/                 # Static assets
├── index.html             # Main HTML file
├── vite.config.js         # Vite config
├── tailwind.config.js     # Tailwind CSS config
└── package.json           # Dependencies
```

---

## API Integration

### CoinGecko API

AssetFlow uses [CoinGecko API](https://www.coingecko.com/en/api) for real-time cryptocurrency prices.

- **Free tier**: 30 requests/minute
- **Supported coins**: BTC, ETH, BNB, USDT, and more

### Exchange Rate API

Supports real-time fiat currency conversion via exchange rate APIs.

---

## Privacy & Security

- **Local Storage**: All data stored in local SQLite database
- **Privacy Mode**: Click the eye button to hide amounts, quantities, and locations
- **No Registration**: No account needed, use directly
- **Data Control**: Backup or export data anytime
- **Open Source**: Fully open source, auditable code

---

## Roadmap

- [x] Privacy mode (one-click hide sensitive data)
- [ ] Support more cryptocurrencies and fiat currencies
- [ ] Data import/export (JSON, CSV)
- [ ] Multi-wallet address management
- [ ] Price alerts
- [ ] Dark mode
- [ ] PWA support (offline use)
- [ ] Multi-language support

---

## Contributing

Contributions are welcome!

1. Fork this project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [CoinGecko](https://www.coingecko.com/) - Cryptocurrency price API
- [Vue.js](https://vuejs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Chart.js](https://www.chartjs.org/) - Chart library

---

## Contact

For questions or suggestions:

- Submit an [Issue](https://github.com/ranxi2001/AssetFlow/issues)
- Email: ranxi.cn@gmail.com

---

<div align="center">

**If this project helps you, please give it a Star!**

Made with love by AssetFlow Team

</div>
