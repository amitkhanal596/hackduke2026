import os
import uuid
import importlib
from typing import Dict, List, Optional, Tuple
from pathlib import Path

AIMessage = HumanMessage = SystemMessage = None
ChatGoogleGenerativeAI = None


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
        self.max_history_messages = int(os.getenv("CHAT_MAX_HISTORY_MESSAGES", "24"))

        # Conversation sessions: session_id -> List[{role, content}]
        self.sessions: Dict[str, List[Dict[str, str]]] = {}

        # Provider selection (Gemini-only)
        self.provider, self.model = self._detect_provider()
        self.llm = self._init_llm()

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
            model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
            print(f"[Agent Debug] Using Gemini with model: {model}")
            return "gemini", model
        print("[Agent Debug] No API key found, using mock")
        return "none", "mock"

    def _init_llm(self):
        if self.provider == "gemini":
            try:
                api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
                if not api_key:
                    return None
                if not self._load_langchain_deps():
                    print("[Agent Debug] LangChain Gemini package not installed")
                    return None
                print(f"[Agent Debug] Configuring LangChain Gemini model: {self.model}")
                llm = ChatGoogleGenerativeAI(
                    model=self.model,
                    google_api_key=api_key,
                    temperature=0.2,
                )
                print("[Agent Debug] LangChain Gemini model configured successfully")
                return llm
            except Exception as e:
                print(f"[Agent Debug] Error initializing LangChain Gemini model: {e}")
                return None
        return None

    def _load_langchain_deps(self) -> bool:
        global AIMessage, HumanMessage, SystemMessage, ChatGoogleGenerativeAI

        if all([AIMessage, HumanMessage, SystemMessage, ChatGoogleGenerativeAI]):
            return True

        try:
            messages_module = importlib.import_module("langchain_core.messages")
            google_genai_module = importlib.import_module("langchain_google_genai")

            AIMessage = getattr(messages_module, "AIMessage")
            HumanMessage = getattr(messages_module, "HumanMessage")
            SystemMessage = getattr(messages_module, "SystemMessage")
            ChatGoogleGenerativeAI = getattr(google_genai_module, "ChatGoogleGenerativeAI")
            return True
        except Exception:
            return False

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
            self.sessions[new_id] = []
        return new_id

    def _system_prompt(self) -> str:
        return self.base_system_prompt + (self.extra_context or "")

    def _trim_history(self, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        if len(history) <= self.max_history_messages:
            return history
        return history[-self.max_history_messages :]

    def _to_langchain_messages(self, history: List[Dict[str, str]]):
        if not all([SystemMessage, HumanMessage, AIMessage]):
            return []
        messages = [SystemMessage(content=self._system_prompt())]
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        return messages

    def chat(self, message: str, session_id: Optional[str] = None) -> Dict[str, str]:
        """
        Send a user message and get the assistant reply. Returns {session_id, reply}.
        """
        sid = self._get_or_create_session(session_id)
        history = self.sessions[sid]
        history.append({"role": "user", "content": message})
        history = self._trim_history(history)
        self.sessions[sid] = history

        reply_text = self._generate_reply(history)
        history.append({"role": "assistant", "content": reply_text})
        self.sessions[sid] = self._trim_history(history)
        return {"session_id": sid, "reply": reply_text}

    def _generate_reply(self, history: List[Dict[str, str]]) -> str:
        if self.provider == "gemini" and self.llm is not None:
            try:
                messages = self._to_langchain_messages(history)
                response = self.llm.invoke(messages)
                content = getattr(response, "content", "")
                if isinstance(content, str):
                    return content
                return str(content)
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
