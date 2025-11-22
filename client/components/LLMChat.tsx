import { useState, useRef, useEffect } from "react";
import { Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface LLMChatProps {
  open: boolean;
  onClose: () => void;
  onGenerateSection?: (sectionConfig: any) => void;
  currentSectionType?: string;
}

export default function LLMChat({
  open,
  onClose,
  onGenerateSection,
  currentSectionType,
}: LLMChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("llm-api-key") || "",
  );
  const [showApiSetup, setShowApiSetup] = useState(!apiKey);
  const [provider, setProvider] = useState<"openai" | "anthropic">(
    () =>
      (localStorage.getItem("llm-provider") as "openai" | "anthropic") ||
      "openai",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveApiKey = () => {
    localStorage.setItem("llm-api-key", apiKey);
    localStorage.setItem("llm-provider", provider);
    setShowApiSetup(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let response;

      if (provider === "openai") {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a helpful page builder assistant. When asked to generate sections or templates, respond ONLY with valid JSON that follows this schema:
{
  "type": "hero|features|cta|text|gallery",
  "config": {
    ... section-specific config ...
  }
}
For other questions, provide helpful guidance. Keep responses concise.`,
              },
              ...messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: "user", content: input },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });
      } else {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `You are a helpful page builder assistant. When asked to generate sections or templates, respond ONLY with valid JSON that follows this schema:
{
  "type": "hero|features|cta|text|gallery",
  "config": {
    ... section-specific config ...
  }
}
For other questions, provide helpful guidance. Keep responses concise.\n\n${input}`,
              },
            ],
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      let assistantContent = "";

      if (provider === "openai") {
        const data = await response.json();
        assistantContent = data.choices[0]?.message?.content || "No response";
      } else {
        const data = await response.json();
        assistantContent = data.content[0]?.text || "No response";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("LLM Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const parseAndInsertSection = (jsonText: string) => {
    try {
      const cleaned = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const config = JSON.parse(cleaned);
      if (config.type && config.config) {
        onGenerateSection?.(config);
        onClose();
      }
    } catch (error) {
      alert("Could not parse section JSON");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-96 bg-slate-800 border-prometheus-fire/40 flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Assistant</DialogTitle>
        </DialogHeader>

        {showApiSetup ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(e.target.value as "openai" | "anthropic")
                }
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200"
              >
                <option value="openai">OpenAI (GPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {provider === "openai" ? "OpenAI API Key" : "Anthropic API Key"}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200"
              />
              <p className="text-xs opacity-60 mt-2">
                {provider === "openai"
                  ? "Get your API key from https://platform.openai.com/api-keys"
                  : "Get your API key from https://console.anthropic.com"}
              </p>
            </div>
            <Button
              onClick={saveApiKey}
              disabled={!apiKey}
              className="w-full bg-prometheus-fire hover:bg-prometheus-fire/90 text-white"
            >
              Save & Continue
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-prometheus-smoke/30 rounded-lg p-4">
              {messages.length === 0 ? (
                <div className="text-center text-sm opacity-60 py-8">
                  <p className="mb-2">👋 Welcome to the AI Assistant!</p>
                  <p>
                    I can help you generate sections, templates, or rewrite
                    content.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-prometheus-fire text-prometheus-night"
                          : "bg-prometheus-smoke/70 text-prometheus-fire-light"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.role === "assistant" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(message.content, message.id)
                            }
                            className="h-6 px-2 text-xs"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          {message.content.includes('"type"') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                parseAndInsertSection(message.content)
                              }
                              className="h-6 px-2 text-xs hover:bg-prometheus-fire/20"
                            >
                              Insert
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const selected = window.getSelection();
                              if (selected && selected.toString()) {
                                setInput(
                                  `Rewrite this: "${selected.toString()}"`,
                                );
                              }
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            Rewrite
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Generate a section, rewrite content, or ask for help..."
                className="flex-1 px-3 py-2 bg-prometheus-smoke/50 border border-prometheus-smoke rounded-lg text-prometheus-fire-light text-sm"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-prometheus-fire hover:bg-prometheus-fire/90 text-prometheus-night"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowApiSetup(true)}
                variant="outline"
                size="sm"
                className="border-prometheus-fire/30"
              >
                Setup
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
