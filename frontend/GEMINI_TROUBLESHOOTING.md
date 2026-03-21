# Gemini API Troubleshooting Guide

## Current Issue
Your Gemini API key is not working with the available models. This is a known issue with Google's Gemini API.

## Option 1: Create a New Gemini API Key (Recommended First Try)

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/app/apikey
   - Make sure you're signed in with your Google account

2. **Create a NEW API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" (important!)
   - Copy the new key

3. **Update Your .env.local**
   ```
   GEMINI_API_KEY=your_new_api_key_here
   ```

4. **Restart the dev server**

## Option 2: Use OpenAI API Instead (Recommended if Gemini keeps failing)

OpenAI is more stable and widely supported:

1. **Get OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Sign up/Login
   - Click "Create new secret key"
   - Copy the key

2. **Add to .env.local**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. I'll update the code to support both APIs

## Option 3: Use Groq API (Free & Fast)

Groq offers free, fast AI APIs:

1. **Get Groq API Key**
   - Visit: https://console.groq.com/keys
   - Sign up with Google/GitHub
   - Create API key

2. **Add to .env.local**
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

## Why This Happens

Google's Gemini API has regional restrictions and model availability changes frequently. The API versions (v1, v1beta) support different models in different regions.

## What I Recommend

1. Try creating a new Gemini API key first (Option 1)
2. If that still fails, use OpenAI (Option 2) - it costs money but very reliable
3. Or use Groq (Option 3) - completely free and very fast!

Let me know which option you'd like to use, and I can update the code accordingly!
