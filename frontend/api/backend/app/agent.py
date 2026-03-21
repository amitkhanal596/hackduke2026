import os
import uuid
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class WealthVisorAgent:
    """
    WealthVisor chat agent that:
    - Loads a system prompt from an .md file (Agent-Prompt.md)
    - Optionally ingests any .docx files present in the workspace for extra context
    - Uses Google Gemini via google-generativeai
    - Maintains simple in-memory session histories
    """

    def __init__(self, system_prompt_path: Path, workspace_root: Optional[Path] = None):
        self.workspace_root = workspace_root or Path(__file__).resolve().parent.parent
        self.system_prompt_path = system_prompt_path

        # Conversation sessions: session_id -> List[{role, content}]
        self.sessions: Dict[str, List[Dict[str, str]]] = {}

        # Provider selection (Gemini-only)
        self.provider, self.model = self._detect_provider()
        self.client = self._init_client()

        # Load base system instructions
        self.base_system_prompt = self._load_system_prompt()

        # Extend with .docx context if present
        self.extra_context = self._load_docx_context()

    def _detect_provider(self) -> Tuple[str, str]:
        """
        Decide which LLM provider to use based on env vars.
        Gemini-only: requires GOOGLE_API_KEY or GEMINI_API_KEY.
        """
        google_key = os.getenv("GOOGLE_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")
        print(f"[Agent Debug] GOOGLE_API_KEY exists: {google_key is not None}")
        print(f"[Agent Debug] GEMINI_API_KEY exists: {gemini_key is not None}")

        final_key = google_key or gemini_key
        if final_key:
            model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            print(f"[Agent Debug] Using Gemini with model: {model}")
            return "gemini", model
        print("[Agent Debug] No API key found, using mock")
        return "none", "mock"

    def _init_client(self):
        if self.provider == "gemini":
            try:
                import google.generativeai as genai  # type: ignore
                api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
                print(f"[Agent Debug] Configuring Gemini with API key: {api_key[:10]}...")
                genai.configure(api_key=api_key)
                print("[Agent Debug] Gemini client configured successfully")
                return genai
            except Exception as e:
                print(f"[Agent Debug] Error initializing Gemini client: {e}")
                return None
        return None

    def _load_system_prompt(self) -> str:
        try:
            return self.system_prompt_path.read_text(encoding="utf-8")
        except Exception:
            return (
                "You are WealthVisor, an intelligent personal wealth manager and financial "
                "planning assistant. Provide structured, conservative, and personalized guidance."
            )

    def _load_docx_context(self) -> str:
        """
        Look for .docx files anywhere under the workspace root and extract text to use as
        additional read-only context for the agent. If none are present or python-docx
        isn't installed, returns an empty string.
        """
        try:
            from docx import Document  # type: ignore
        except Exception:
            return ""

        if not self.workspace_root or not self.workspace_root.exists():
            return ""

        docx_texts: List[str] = []
        for path in self.workspace_root.rglob("*.docx"):
            try:
                doc = Document(str(path))
                paragraphs = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
                if paragraphs:
                    docx_texts.append(f"[File: {path.name}]\n" + "\n".join(paragraphs))
            except Exception:
                continue

        if not docx_texts:
            return ""

        combined = (
            "\n\n---\n\nAdditional Financial Context from .docx files (read-only):\n" +
            "\n\n".join(docx_texts[:3])  # limit to first 3 files for brevity
        )
        return combined

    def _get_or_create_session(self, session_id: Optional[str]) -> str:
        if session_id and session_id in self.sessions:
            return session_id
        new_id = session_id or str(uuid.uuid4())
        if new_id not in self.sessions:
            system_message = {
                "role": "system",
                "content": self.base_system_prompt + (self.extra_context or ""),
            }
            self.sessions[new_id] = [system_message]
        return new_id

    def chat(self, message: str, session_id: Optional[str] = None) -> Dict[str, str]:
        """
        Send a user message and get the assistant reply. Returns {session_id, reply}.
        """
        sid = self._get_or_create_session(session_id)
        history = self.sessions[sid]
        history.append({"role": "user", "content": message})

        reply_text = self._generate_reply(history)
        history.append({"role": "assistant", "content": reply_text})
        return {"session_id": sid, "reply": reply_text}

    def _generate_reply(self, history: List[Dict[str, str]]) -> str:
        if self.provider == "gemini" and self.client is not None:
            try:
                # Prepare system instruction and convert history to Gemini roles
                system_msg = next((m["content"] for m in history if m["role"] == "system"), "")
                convo = [m for m in history if m["role"] != "system"]

                # Combine system message into first user message
                messages = []
                if convo and system_msg:
                    first_user_content = f"{system_msg}\n\nUser: {convo[0]['content']}"
                    messages.append({"role": "user", "parts": [first_user_content]})
                    convo = convo[1:]  # Skip first message since we included it

                for m in convo:
                    role = "user" if m["role"] == "user" else "model"
                    messages.append({"role": role, "parts": [m["content"]]})

                # Create model - use gemini-2.5-flash for latest stable model
                model = self.client.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(messages, generation_config={"temperature": 0.2})
                return getattr(response, "text", "") or ""
            except Exception as e:
                return f"Sorry, I had trouble contacting the model: {e}"

        # Fallback mock reply
        return (
            "I'm configured as WealthVisor but no Gemini API key was found. "
            "Please add GOOGLE_API_KEY or GEMINI_API_KEY to use live responses."
        )

    def history(self, session_id: str) -> List[Dict[str, str]]:
        return self.sessions.get(session_id, [])

    def provider_info(self) -> Dict[str, str]:
        return {"provider": self.provider, "model": self.model}
