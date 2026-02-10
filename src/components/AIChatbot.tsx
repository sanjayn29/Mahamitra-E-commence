import { useState, useRef, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedProduct } from '@/services/productService';
import { getProductsFromAI, ChatMessage } from '@/services/aiService';

/* ── tiny markdown-bold → <strong> helper ── */
const renderMarkdown = (text: string) =>
  text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

/* ── single product card inside the chat ── */
const ChatProductCard = ({ product }: { product: EnhancedProduct }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/product/${product.id}?category=${product.category}`)}
      className="flex items-center gap-3 w-full rounded-lg border border-border/50 bg-background/60 p-2 text-left
                 hover:bg-accent/40 transition-colors"
    >
      <img
        src={product.images[0] || product.image}
        alt={product.name}
        className="h-14 w-14 rounded-md object-cover flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{product.category} · {product.material}</p>
        <p className="text-sm font-semibold text-primary">₹{product.price.toLocaleString()}</p>
      </div>
    </button>
  );
};

/* ═══════════ MAIN COMPONENT ═══════════ */
const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! 👋 I\'m your **Mahamitra AI Assistant**. Ask me anything like:\n\n• "Show sarees under ₹5000"\n• "Blue kurtas for women"\n• "Top-rated lehengas"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // auto-scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // add user bubble
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { summary, products } = await getProductsFromAI(text);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summary,
        products: products.slice(0, 6), // show max 6 in chat
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Oops, something went wrong while searching. Please try again or browse our [shop](/shop).',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full
                   bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95
                   transition-transform duration-200"
        aria-label={open ? 'Close chat' : 'Open AI assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col
                     rounded-2xl border border-border bg-background shadow-2xl
                     h-[560px] max-h-[calc(100vh-8rem)]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-sm font-semibold leading-tight">Mahamitra AI</p>
              <p className="text-[11px] opacity-80">Powered by LLaMA-3</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-primary-foreground/20">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] space-y-2 ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground text-sm'
                      : 'rounded-2xl rounded-tl-sm bg-muted px-4 py-2 text-sm'
                  }`}
                >
                  <p
                    className="whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />

                  {/* product cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map((p) => (
                        <ChatProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {/* typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
              {[
                'Show sarees under ₹10000',
                'Blue kurtas',
                'Top rated products',
                'Lehengas for women',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="flex-shrink-0 rounded-full border border-border bg-background px-3 py-1.5
                             text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-border px-3 py-2"
          >
            <ShoppingBag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!input.trim() || loading}
              className="h-8 w-8 rounded-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
