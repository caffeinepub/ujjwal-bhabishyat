import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, MessageCircle, Paperclip, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  sender: "sent" | "received";
  senderName: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    text: "আজকে ক্লাসের সময়সূচি পাঠিয়ে দিন।",
    sender: "received",
    senderName: "অভিভাবক",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "2",
    text: "হ্যাঁ, আজকে বিকেল ৪টা থেকে ৬টা পর্যন্ত ক্লাস আছে।",
    sender: "sent",
    senderName: "Dipak",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
  },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      imageUrl,
      sender: "sent",
      senderName: "Dipak",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText("");

    // Simulate a reply after 1.5s
    if (text.trim()) {
      setTimeout(() => {
        const replies = [
          "ঠিক আছে, বুঝতে পেরেছি।",
          "ধন্যবাদ জানানোর জন্য।",
          "আপনার বার্তা পেয়েছি।",
          "আচ্ছা, পরে জানাব।",
        ];
        const reply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: replies[Math.floor(Math.random() * replies.length)],
          sender: "received",
          senderName: "অভিভাবক",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 1500);
    }
  };

  const handleSend = () => {
    sendMessage(inputText);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = ev.target?.result as string;
      sendMessage("", imageUrl);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be picked again
    e.target.value = "";
  };

  return (
    <div
      data-ocid="chat.page"
      className="flex flex-col h-full bg-background"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-card border-b border-border shadow-sm">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground">
            চ্যাট
          </h2>
          <p className="text-xs text-muted-foreground">
            অভিভাবক ও শিক্ষার্থীদের সাথে
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="text-xs text-muted-foreground">সক্রিয়</span>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center h-full py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              কোনো বার্তা নেই।
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              প্রথম বার্তা পাঠান!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  data-ocid={`chat.message.item.${index + 1}`}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex ${msg.sender === "sent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] space-y-1 ${msg.sender === "sent" ? "items-end" : "items-start"} flex flex-col`}
                  >
                    <span className="text-xs text-muted-foreground px-1">
                      {msg.senderName}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        msg.sender === "sent"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card text-foreground border border-border rounded-tl-sm"
                      }`}
                    >
                      {msg.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(msg.imageUrl!)}
                          className="block mb-2 rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label="ছবি বড় করুন"
                        >
                          <img
                            src={msg.imageUrl}
                            alt="পাঠানো ছবি"
                            className="max-w-[220px] max-h-[180px] object-cover rounded-lg"
                          />
                        </button>
                      )}
                      {msg.text && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="px-4 py-3 bg-card border-t border-border">
        <div className="flex items-center gap-2 bg-background rounded-2xl border border-border px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
          <button
            type="button"
            data-ocid="chat.upload_button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="ছবি সংযুক্ত করুন"
            title="ছবি পাঠান"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="ছবি বেছে নিন"
            title="গ্যালারি থেকে ছবি"
          >
            <Image className="w-4 h-4" />
          </button>
          <Input
            ref={inputRef}
            data-ocid="chat.message_input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="বার্তা লিখুন..."
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-0 h-auto text-sm placeholder:text-muted-foreground/60"
          />
          <Button
            type="button"
            data-ocid="chat.send_button"
            size="icon"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
            aria-label="বার্তা পাঠান"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Enter চাপুন বা বোতামে ক্লিক করুন
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="relative max-w-[90vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="বড় ছবি"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center hover:bg-white transition-colors shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
