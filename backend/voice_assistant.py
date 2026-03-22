"""
Toro Voice Assistant
====================
Wake word : "toro"
Stop word : "stop" (interrupts TTS playback)

Flow:
  idle     → hear "toro"          → recording
  recording → 3 s silence         → processing
  processing → Gemini replies      → speaking
  speaking  → audio done | "stop" → idle
"""

import os
import re
import json
import time
import tempfile
import threading
from pathlib import Path
from datetime import datetime, timedelta

import requests

import pygame
import speech_recognition as sr
from dotenv import load_dotenv
import google.genai as genai
from google.oauth2 import service_account
from google.cloud import texttospeech
from google.cloud import speech as google_speech

load_dotenv()

# ── constants ────────────────────────────────────────────────────────────────
WAKE_WORD       = "hello"
STOP_WORD       = "stop"
SILENCE_TIMEOUT = 3.0
REQUEST_FILE    = Path("toro_request.txt")
STATE_FILE      = Path("toro_state.txt")   # read by FastAPI status endpoint

# Phrase hints — always derived from the actual wake/stop words so they stay in sync
STT_HINTS = [WAKE_WORD, STOP_WORD, f"hey {WAKE_WORD}", f"{WAKE_WORD} {STOP_WORD}"]

SYSTEM_PROMPT = (
    "You are Toro, a sharp and friendly voice assistant. "
    "Keep every reply under 3 sentences unless the user explicitly asks for detail. "
    "No bullet points — speak naturally as if in conversation."
)

# ── ANSI colours ─────────────────────────────────────────────────────────────
G = "\033[92m"; Y = "\033[93m"; B = "\033[94m"; R = "\033[91m"; X = "\033[0m"


# ── Finnhub stock context ─────────────────────────────────────────────────────
from ticker_bank import resolve_tickers

_TICKER_EXCLUDE = {
    'I', 'A', 'AI', 'US', 'USD', 'API', 'ETF', 'IPO', 'CEO', 'CFO', 'COO',
    'PE', 'EPS', 'ROI', 'GDP', 'CPI', 'FED', 'SEC', 'NYSE', 'NASDAQ',
    'AM', 'PM', 'OK', 'IT', 'OR', 'IF', 'IN', 'AT', 'BY', 'TO', 'ON',
    'JP', 'EU', 'UK', 'CA', 'MY', 'ME', 'HE', 'SHE', 'THE', 'AND', 'FOR',
    'ARE', 'NOT', 'BUT', 'ALL', 'ANY', 'CAN', 'HAS', 'HAD', 'ITS', 'LET',
    'NEW', 'NOW', 'OLD', 'OWN', 'WAY', 'WHO', 'WHY', 'HOW', 'TOP',
}

def _extract_tickers(text: str):
    return resolve_tickers(text, _TICKER_EXCLUDE)

def _fetch_finnhub_context(ticker: str, api_key: str) -> str:
    base = "https://finnhub.io/api/v1"
    parts = []
    try:
        q = requests.get(f"{base}/quote", params={"symbol": ticker, "token": api_key}, timeout=5).json()
        if q.get("c"):
            parts.append(
                f"Price: ${q['c']:.2f}, change {q.get('dp', 0):+.2f}% today"
                f" (open ${q['o']:.2f}, high ${q['h']:.2f}, low ${q['l']:.2f})"
            )
    except Exception:
        pass
    try:
        p = requests.get(f"{base}/stock/profile2", params={"symbol": ticker, "token": api_key}, timeout=5).json()
        if p.get("name"):
            parts.append(f"{p['name']}, {p.get('finnhubIndustry','')}, market cap ${p.get('marketCapitalization',0):,.0f}M")
    except Exception:
        pass
    try:
        m = requests.get(f"{base}/stock/metric", params={"symbol": ticker, "metric": "all", "token": api_key}, timeout=5).json().get("metric", {})
        metrics = []
        if m.get("peBasicExclExtraTTM"):     metrics.append(f"P/E {m['peBasicExclExtraTTM']:.1f}")
        if m.get("52WeekHigh"):              metrics.append(f"52W high ${m['52WeekHigh']:.2f}")
        if m.get("52WeekLow"):               metrics.append(f"52W low ${m['52WeekLow']:.2f}")
        if m.get("epsBasicExclExtraItemsTTM"): metrics.append(f"EPS ${m['epsBasicExclExtraItemsTTM']:.2f}")
        if m.get("revenueGrowthTTMYoy"):     metrics.append(f"revenue growth {m['revenueGrowthTTMYoy']:.1f}% YoY")
        if m.get("netMarginTTM"):            metrics.append(f"net margin {m['netMarginTTM']:.1f}%")
        if metrics:
            parts.append(", ".join(metrics))
    except Exception:
        pass
    try:
        from_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
        to_date   = datetime.now().strftime("%Y-%m-%d")
        news = requests.get(f"{base}/company-news", params={"symbol": ticker, "from": from_date, "to": to_date, "token": api_key}, timeout=5).json()
        headlines = [item["headline"] for item in news[:4] if item.get("headline")]
        if headlines:
            parts.append("Recent news: " + "; ".join(headlines))
    except Exception:
        pass
    if not parts:
        return ""
    return f"\n[Live data for {ticker}: " + " | ".join(parts) + "]"


# ── helpers ───────────────────────────────────────────────────────────────────
def _init_gemini() -> genai.Client:
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    return genai.Client(api_key=key)


def _init_tts():
    raw = os.getenv("GOOGLE_TTS_CREDENTIALS")
    if not raw:
        print(f"{R}[TTS] GOOGLE_TTS_CREDENTIALS not set — TTS disabled.{X}")
        return None
    info = json.loads(raw)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    return texttospeech.TextToSpeechClient(credentials=creds)


# ── main class ────────────────────────────────────────────────────────────────
class ToroAssistant:
    def __init__(self):
        self.gemini  = _init_gemini()
        self.tts     = _init_tts()
        self.rec     = sr.Recognizer()
        self.mic     = sr.Microphone()   # used for recording + speaking
        self.mic_bg  = sr.Microphone()   # dedicated instance for background idle listening
        self.running = False
        self.history: list[dict] = []
        self._stop_flag = threading.Event()
        self._pending: str = ""

        # Build a reusable Cloud Speech client (avoids re-auth on every call)
        self._cloud_stt: google_speech.SpeechClient | None = None
        raw_creds = os.getenv("GOOGLE_TTS_CREDENTIALS")
        if raw_creds:
            try:
                creds_info = json.loads(raw_creds)
                creds = service_account.Credentials.from_service_account_info(
                    creds_info,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"],
                )
                self._cloud_stt = google_speech.SpeechClient(credentials=creds)
                print(f"{G}Cloud STT client initialized with phrase hints{X}")
            except Exception as e:
                print(f"{R}[Cloud STT init failed] {e} — will use free STT{X}")

        pygame.mixer.init()

        self._set_state("idle")

        # Lower the energy threshold so quiet speech is still detected.
        # adjust_for_ambient_noise will raise it from this floor if needed.
        self.rec.energy_threshold = 300
        self.rec.dynamic_energy_threshold = True   # auto-adjusts over time
        self.rec.pause_threshold = 0.8             # seconds of silence = end of phrase
        self.rec.phrase_threshold = 0.3            # min seconds to count as speech
        self.rec.non_speaking_duration = 0.5       # seconds of silence at phrase edges

        print(f"{G}Calibrating microphone for ambient noise…{X}")
        with self.mic as src:
            self.rec.adjust_for_ambient_noise(src, duration=2)
        print(f"{G}Energy threshold set to {self.rec.energy_threshold:.0f}{X}")
        print(f"{G}Ready — say \"{WAKE_WORD}\" to begin.{X}\n")

    # ── state file ────────────────────────────────────────────────────────────
    def _set_state(self, state: str):
        self.state = state
        try:
            STATE_FILE.write_text(state)
        except Exception:
            pass

    # ── speech-to-text ────────────────────────────────────────────────────────
    def _stt(self, audio: sr.AudioData) -> str:
        """
        Use Google Cloud Speech-to-Text directly (bypasses speech_recognition's
        recognize_google_cloud which incorrectly treats the JSON string as a file path).
        Falls back to the free Web STT if the cloud client is unavailable.
        """
        if self._cloud_stt:
            try:
                recognition_audio = google_speech.RecognitionAudio(
                    content=audio.get_flac_data(convert_rate=16000)
                )
                config = google_speech.RecognitionConfig(
                    encoding=google_speech.RecognitionConfig.AudioEncoding.FLAC,
                    sample_rate_hertz=16000,
                    language_code="en-US",
                    speech_contexts=[
                        google_speech.SpeechContext(phrases=STT_HINTS, boost=20.0)
                    ],
                )
                response = self._cloud_stt.recognize(config=config, audio=recognition_audio)
                if response.results:
                    text = response.results[0].alternatives[0].transcript.lower().strip()
                    print(f"       [cloud STT] → \"{text}\"")
                    return text
                return ""
            except Exception as e:
                print(f"{R}[Cloud STT error] {e} — falling back{X}")

        # Fallback: free Google Web Speech API
        try:
            text = self.rec.recognize_google(audio).lower().strip()
            print(f"       [free STT] → \"{text}\"")
            return text
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as e:
            print(f"{R}[STT error] {e}{X}")
            return ""

    # ── text-to-speech ────────────────────────────────────────────────────────
    def _tts_bytes(self, text: str) -> bytes | None:
        if not self.tts:
            return None
        try:
            resp = self.tts.synthesize_speech(
                input=texttospeech.SynthesisInput(text=text),
                voice=texttospeech.VoiceSelectionParams(
                    language_code="en-US",
                    ssml_gender=texttospeech.SsmlVoiceGender.MALE,
                ),
                audio_config=texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3
                ),
            )
            return resp.audio_content
        except Exception as e:
            print(f"{R}[TTS error] {e}{X}")
            return None

    # ── state handlers ────────────────────────────────────────────────────────
    def _idle(self):
        """
        Use listen_in_background so there are ZERO gaps in wake-word monitoring.
        The callback fires in a daemon thread for every phrase the mic captures.
        """
        self._wake_event = threading.Event()
        print(f"{B}[Idle] Continuously listening for \"{WAKE_WORD}\"…{X}")

        def _callback(recognizer, audio):
            # Ignore if we already woke up or are no longer idle
            if self._wake_event.is_set() or self.state != "idle":
                return
            text = self._stt(audio)
            if text:
                print(f"       heard: {text}")
            if WAKE_WORD in text:
                print(f"{G}[Wake] \"{WAKE_WORD}\" detected!{X}")
                self._wake_event.set()

        # Use a dedicated mic instance so self.mic stays free for recording/speaking
        stop_bg = self.rec.listen_in_background(
            self.mic_bg, _callback, phrase_time_limit=2
        )

        # Block until wake word is detected or the assistant is stopped
        self._wake_event.wait()
        # wait_for_stop=True ensures the background thread fully releases mic_bg
        stop_bg(wait_for_stop=True)

        if self.running:
            self._set_state("recording")

    def _record(self, src: sr.AudioSource):
        print(f"{Y}[Recording] Go ahead — I'm listening…{X}")
        REQUEST_FILE.write_text("")
        chunks: list[str] = []

        while self.running:
            try:
                audio = self.rec.listen(
                    src,
                    timeout=SILENCE_TIMEOUT,
                    phrase_time_limit=15,
                )
                text = self._stt(audio)
                if text:
                    text = text.replace(WAKE_WORD, "").strip()
                if text:
                    print(f"       + {text}")
                    chunks.append(text)
                elif chunks:
                    # Empty transcription after real speech = silence detected → send now
                    break
            except sr.WaitTimeoutError:
                # Hard timeout — also done
                break

        if chunks:
            full = " ".join(chunks)
            REQUEST_FILE.write_text(full)
            print(f"\n{Y}━━━ Request captured ━━━{X}")
            print(f"{Y}  \"{full}\"{X}")
            print(f"{Y}━━━━━━━━━━━━━━━━━━━━━━━{X}\n")
            self._set_state("processing")
        else:
            print(f"{Y}[Recording] Nothing captured — back to idle.{X}")
            self._set_state("idle")

    def _process(self):
        request = REQUEST_FILE.read_text().strip()
        if not request:
            self._set_state("idle")
            return

        # Enrich with live Finnhub data for any tickers mentioned
        finnhub_key = os.getenv("FINNHUB_API_KEY")
        enriched = request
        if finnhub_key:
            tickers = _extract_tickers(request)
            for ticker in tickers:
                ctx = _fetch_finnhub_context(ticker, finnhub_key)
                if ctx:
                    print(f"{G}[Finnhub] Injecting data for {ticker}{X}")
                    enriched += ctx

        print(f"{B}┌─ Sending to Gemini (gemini-2.5-flash)…{X}")
        t0 = time.time()

        self.history.append({"role": "user", "parts": [{"text": enriched}]})
        trimmed = self.history[-10:]

        messages = []
        for i, msg in enumerate(trimmed):
            if i == 0 and msg["role"] == "user":
                messages.append({
                    "role": "user",
                    "parts": [{"text": f"{SYSTEM_PROMPT}\n\nUser: {msg['parts'][0]['text']}"}],
                })
            else:
                messages.append(msg)

        try:
            response = self.gemini.models.generate_content(
                model="gemini-2.5-flash",
                contents=messages,
                config={"temperature": 0.7},
            )
            answer = response.text.strip()
        except Exception as e:
            print(f"{R}[Gemini error] {e}{X}")
            answer = "Sorry, I had trouble getting a response."

        elapsed = time.time() - t0
        self.history.append({"role": "model", "parts": [{"text": answer}]})
        print(f"{B}└─ Gemini replied in {elapsed:.1f}s{X}")
        print(f"{G}   \"{answer}\"{X}\n")

        # Clear request file — no new input accepted until TTS starts
        REQUEST_FILE.write_text("")
        self._pending = answer
        self._set_state("speaking")

    def _speak(self, src: sr.AudioSource):
        answer = self._pending
        self._pending = ""

        if not answer:
            self._set_state("idle")
            return

        print(f"{G}┌─ Generating audio via Google Cloud TTS…{X}")
        t0 = time.time()
        audio_bytes = self._tts_bytes(answer)
        if not audio_bytes:
            print(f"{R}[Speak] No audio — skipping.{X}")
            self._set_state("idle")
            return

        elapsed = time.time() - t0
        print(f"{G}└─ TTS ready in {elapsed:.1f}s  ▶ Playing (say \"{STOP_WORD}\" to interrupt){X}\n")

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as fh:
            fh.write(audio_bytes)
            tmp = fh.name

        self._stop_flag.clear()
        pygame.mixer.music.load(tmp)
        pygame.mixer.music.play()

        # Only now does the mic open to listen for the stop word
        try:
            while pygame.mixer.music.get_busy() and not self._stop_flag.is_set():
                try:
                    audio = self.rec.listen(src, timeout=0.8, phrase_time_limit=2)
                    heard = self._stt(audio)
                    if heard:
                        print(f"       [stop listener] → \"{heard}\"")
                    if STOP_WORD in heard:
                        print(f"{R}[Speaking] \"{STOP_WORD}\" detected — stopping.{X}")
                        self._stop_flag.set()
                except sr.WaitTimeoutError:
                    pass
        finally:
            pygame.mixer.music.stop()
            try:
                os.unlink(tmp)
            except OSError:
                pass

        print(f"{G}[Speaking] Done.{X}\n")
        self._set_state("idle")

    # ── main loop ─────────────────────────────────────────────────────────────
    def run(self):
        self.running = True
        while self.running:
            try:
                if self.state == "idle":
                    # listen_in_background opens/closes the mic itself — no context needed
                    self._idle()
                elif self.state in ("recording", "speaking"):
                    # Explicit mic context for capturing the request / stop-word
                    with self.mic as src:
                        self.rec.adjust_for_ambient_noise(src, duration=0.3)
                        if   self.state == "recording": self._record(src)
                        elif self.state == "speaking":  self._speak(src)
                elif self.state == "processing":
                    self._process()
            except Exception as e:
                print(f"{R}[Loop error] {e} — resetting to idle{X}")
                self._set_state("idle")

    def stop(self):
        self.running = False
        self._stop_flag.set()
        pygame.mixer.music.stop()
        pygame.mixer.quit()
        try:
            STATE_FILE.write_text("stopped")
        except Exception:
            pass


# ── entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    assistant = ToroAssistant()
    try:
        assistant.run()
    except KeyboardInterrupt:
        print(f"\n{R}Shutting down Toro…{X}")
        assistant.stop()
