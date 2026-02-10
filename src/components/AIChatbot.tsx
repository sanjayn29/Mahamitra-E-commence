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
import { CONTACT_INFO } from '@/constants/contact';

/* ── tiny markdown-bold → <strong> helper ── */
const renderMarkdown = (text: string) =>
  text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

/* ── Local quick-answer patterns (no AI call needed) ── */
const LOCAL_REPLIES: { patterns: RegExp; reply: string }[] = [
  {
    patterns: /^(hi|hello|hey|hii+|hola|namaste|good\s*(morning|afternoon|evening))[\s!?.]*$/i,
    reply: `Hello! 👋 Welcome to **${CONTACT_INFO.company.fullName}** — your premium fashion destination!\n\nHow can I help you today? You can ask me about products, prices, or store info.`,
  },
  {
    patterns: /who\s*are\s*you|what\s*are\s*you|your\s*name/i,
    reply: `I'm the **Mahamitra AI Shopping Assistant** 🤖\n\nI can help you find products, answer store queries, and recommend outfits. Try asking "Show sarees under ₹5000"!`,
  },
  {
    patterns: /address|where\s*(are\s*you|is\s*(the|your)\s*(store|shop|location))|location|visit/i,
    reply: `📍 **Store Address**\n\n${CONTACT_INFO.address.full}\n\n🕐 **Business Hours**\n${CONTACT_INFO.businessHours.weekdays}\n${CONTACT_INFO.businessHours.weekends}`,
  },
  {
    patterns: /email|mail\s*id/i,
    reply: `📧 **Email Us**\n\n${CONTACT_INFO.email.primary}\n\nWe typically respond within 24 hours!`,
  },
  {
    patterns: /phone|call|contact\s*number|mobile|whatsapp/i,
    reply: `📞 **Call / WhatsApp**\n\n${CONTACT_INFO.phone.primary}\n\n🕐 ${CONTACT_INFO.businessHours.weekdays}`,
  },
  {
    patterns: /contact|reach\s*you|get\s*in\s*touch|support/i,
    reply: `📬 **Contact Mahamitra**\n\n📍 ${CONTACT_INFO.address.full}\n📞 ${CONTACT_INFO.phone.primary}\n📧 ${CONTACT_INFO.email.primary}\n\n🕐 ${CONTACT_INFO.businessHours.weekdays}\n🕐 ${CONTACT_INFO.businessHours.weekends}`,
  },
  {
    patterns: /thank|thanks|thx|ty/i,
    reply: `You're welcome! 😊 Happy shopping at **Mahamitra**! Let me know if you need anything else.`,
  },
  {
    patterns: /bye|goodbye|see\s*you/i,
    reply: `Goodbye! 👋 Thank you for visiting **Mahamitra**. Come back anytime!`,
  },
  {
    patterns: /help|what\s*can\s*you\s*do|options/i,
    reply: `I can help you with:\n\n🛍️ **Find products** — "Show sarees under ₹5000"\n🎨 **Filter by color** — "Blue kurtas"\n👗 **Browse categories** — "Women's lehengas"\n📍 **Store info** — "Address", "Phone", "Email"\n⭐ **Recommendations** — "Top rated products"\n💰 **Budget search** — "Products above ₹3000"`,
  },
  {
    patterns: /return|refund|exchange/i,
    reply: `🔄 **Returns & Exchanges**\n\nPlease contact us for return/exchange queries:\n📞 ${CONTACT_INFO.phone.primary}\n📧 ${CONTACT_INFO.email.primary}\n\nOur team will assist you promptly!`,
  },
  {
    patterns: /shipping|delivery|dispatch/i,
    reply: `🚚 **Shipping Info**\n\nWe deliver across India! For delivery timelines and tracking, please contact:\n📞 ${CONTACT_INFO.phone.primary}\n📧 ${CONTACT_INFO.email.primary}`,
  },
];

const getLocalReply = (text: string): string | null => {
  for (const { patterns, reply } of LOCAL_REPLIES) {
    if (patterns.test(text.trim())) return reply;
  }
  return null;
};

/* ── Quick suggestion chips ── */
const QUICK_SUGGESTIONS = [
  { label: '👋 Hi', value: 'Hi' },
  { label: '📍 Store Address', value: 'What is your address?' },
  { label: '📞 Phone Number', value: 'What is your phone number?' },
  { label: '📧 Email', value: 'What is your email?' },
  { label: '🛍️ Sarees under ₹10000', value: 'Show sarees under ₹10000' },
  { label: '💰 Products above ₹3000', value: 'Show products above ₹3000' },
  { label: '👗 Blue kurtas', value: 'Blue kurtas' },
  { label: '⭐ Top rated', value: 'Top rated products' },
  { label: '👶 Baby clothes', value: 'Baby clothes' },
  { label: '🆘 Help', value: 'Help' },
];

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
        'Hi! 👋 Welcome to **Mahamitra Boutique**!\n\nI\'m your AI Shopping Assistant. I can help you with:\n\n🛍️ Find products — "Sarees under ₹5000"\n🎨 Filter by color — "Blue kurtas"\n📍 Store info — "Address", "Phone", "Email"\n💰 Budget search — "Products above ₹3000"\n\nTap a suggestion below or type your question!',
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

    // Check for local quick replies first (no AI call needed)
    const localReply = getLocalReply(text);
    if (localReply) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: localReply,
          timestamp: new Date(),
        },
      ]);
      setLoading(false);
      return;
    }

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
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {QUICK_SUGGESTIONS.map((q) => (
                <button
                  key={q.value}
                  onClick={() => { setInput(q.value); }}
                  className="flex-shrink-0 rounded-full border border-border bg-background px-3 py-1.5
                             text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {q.label}
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
