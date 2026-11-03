# CalorieMeter 🍽️

A modern AI-powered calorie tracking app built with Next.js. Take photos of your food and get instant nutritional analysis using AI.

## ✨ Key Features

- 📸 **Smart Food Analysis** - Point, shoot, and get instant calorie counts
- 🤖 **AI-Powered Corrections** - Fix analysis results with natural language ("That's actually a large pizza slice")
- 📊 **Daily Tracking** - Visual progress bars and meal history
- 👤 **Personalized Goals** - BMI calculator and custom calorie targets
- 📱 **Mobile-First** - Optimized camera interface for phones
- 🔒 **Privacy-First** - All data stays on your device
- ⚡ **Works Offline** - Progressive Web App with offline support

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/caloriemeter.git
cd caloriemeter
npm install

# Start development
npm run dev
# Open http://localhost:3000
```

**No setup required** - includes a test API key to get started immediately.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI**: Google Gemini AI (2.0 Flash, 1.5 Pro, 1.5 Flash)
- **Styling**: Tailwind CSS 4.0
- **Storage**: Browser LocalStorage (privacy-first)
- **Testing**: Jest + React Testing Library
- **PWA**: Service Worker + Offline Support

## 📱 How It Works

1. **Take a Photo** - Use your phone's camera or upload an image
2. **AI Analysis** - Gemini AI identifies foods and calculates calories
3. **Natural Corrections** - Say "That's grilled chicken, not fried" to fix mistakes
4. **Track Progress** - See daily totals and weekly trends
5. **Stay on Target** - Get personalized calorie goals based on your profile

## 🎯 Smart Features

### AI-Powered Analysis
- Multi-model fallback (Gemini 3.8 Flash → 3.6 Flash → 3.5 Flash-Lite → 3.1 Flash-Lite → 2.5 Pro)
- Identifies multiple foods in one photo
- Provides detailed nutritional breakdowns
- Estimates portion sizes and cooking methods

### Natural Language Corrections
```text
User: "That's actually a large pizza slice, not small"
AI: ✅ Updated to large pizza slice (450 → 680 calories)
```

### Comprehensive Tracking
- Daily calorie goals with progress visualization
- 7-day history with trend analysis
- Built-in food database (30+ common foods)
- Export/import your data

### Health Integration
- BMI calculator and health metrics
- Personalized calorie recommendations
- Activity level-based calculations
- Metric/Imperial unit support

## 🔧 Configuration

### Optional: Personal API Key
```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```
Get your free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Environment Options
- **Development**: Uses included test API key
- **Production**: Add your own key for unlimited usage
- **Rate Limits**: Intelligent rate limiting with retry logic


## 🔒 Privacy & Security

- **Local Storage**: All personal data stays on your device
- **No Tracking**: No analytics or user tracking
- **Secure API**: Environment-based API key management
- **Data Control**: Export, import, or delete your data anytime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License 


---

**CalorieMeter** - Smart calorie tracking through AI-powered food analysis 🍽️✨

