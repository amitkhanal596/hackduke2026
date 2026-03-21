# Setting Up Google Gemini AI for News Summaries

The AI Summary feature requires a Google Gemini API key. Follow these steps to set it up:

## Steps to Get Your API Key

1. **Visit Google AI Studio**
   - Go to [https://ai.google.dev/](https://ai.google.dev/)
   - Sign in with your Google account

2. **Create an API Key**
   - Click on "Get API Key" or "API Keys" in the navigation
   - Click "Create API Key"
   - Copy your new API key

3. **Add the API Key to Your Project**
   - Open the `.env.local` file in the `frontend` directory
   - Find the line: `GEMINI_API_KEY=your_gemini_api_key_here`
   - Replace `your_gemini_api_key_here` with your actual API key
   - Save the file

   Example:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
   ```

4. **Restart the Development Server**
   - Stop the server (Ctrl+C in the terminal)
   - Start it again: `npm run dev`

## Troubleshooting

### Error: "Invalid or missing Gemini API key"
- Make sure you copied the entire API key
- Check that there are no spaces before or after the API key
- Verify the key is set in `.env.local`, not `.env.example`
- Restart the development server after updating the file

### Error: "API quota exceeded"
- You've reached the free tier limit
- Wait for the quota to reset (usually 24 hours)
- Or upgrade to a paid plan at [Google Cloud Console](https://console.cloud.google.com/)

## Features

Once configured, the AI Summary feature will:
- Analyze all news articles from your tracked stocks
- Identify major market trends
- Highlight significant company events
- Point out economic indicators
- Suggest investment opportunities or risks

## Free Tier Limits

Google Gemini's free tier includes:
- 60 requests per minute
- 1,500 requests per day

This should be more than enough for personal use!
