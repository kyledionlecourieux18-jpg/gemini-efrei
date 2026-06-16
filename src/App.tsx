import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import {
  Shield,
  Heart,
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  Phone,
  School,
  MessageCircle,
  Users,
  Eye,
  ArrowRight,
  Stethoscope,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────── */
interface DisplayMsg {
  role: 'user' | 'bot'
  content: string
}
interface GeminiMsg {
  role: 'user' | 'model'
  parts: { text: string }[]
}

/* ─── Gemini system prompt ───────────────────────────────── */
const SYSTEM_INSTRUCTION = `Tu es SpeakUp, un compagnon IA bienveillant pour les jeunes victimes ou témoins de harcèlement scolaire et de cyberharcèlement.
Tu es empathique, doux, non-jugeant. Tu utilises un langage simple, naturel et accessible pour les adolescents.
Tu écoutes d'abord, puis tu orientes progressivement vers les ressources adaptées : 3018 (cyberharcèlement), 3020 (harcèlement scolaire), 3114 (prévention suicide).
Tu ne donnes jamais de leçons. Tu valides les émotions. Tu poses des questions ouvertes. Tes réponses font 2-4 phrases max.
Si la personne est en danger immédiat, invite-la à appeler le 17 ou le 112.`

const WELCOME_MSG: DisplayMsg = {
  role: 'bot',
  content:
    "Hey 💜 Je suis **SpeakUp**. Ici, c'est un espace safe : ni jugement, ni leçon, juste de l'écoute.\n\nRaconte-moi ce qui se passe — avec tes mots, sans pression. Je suis là.",
}

const QUICK_REPLIES = [
  '😔 Je me fais harceler au lycée…',
  '😡 Quelqu\'un poste des trucs méchants sur moi',
  '😰 Je suis témoin et je sais pas quoi faire',
  '😶 J\'ai trop peur d\'en parler à mes parents',
]

/* ─── Bold text renderer ─────────────────────────────────── */
function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

/* ─── Avatar ─────────────────────────────────────────────── */
function BotAvatar({ size = 7 }: { size?: number }) {
  return (
    <div
      className={`grid h-${size} w-${size} shrink-0 place-items-center rounded-full text-white`}
      style={{ background: 'linear-gradient(135deg, hsl(235,60%,59%), hsl(28,91%,54%))' }}
    >
      <Bot className={`h-${size - 3} w-${size - 3}`} aria-hidden />
    </div>
  )
}

/* ─── Phone resource card ────────────────────────────────── */
function PhoneCard({
  number,
  label,
  badge,
  featured,
}: {
  number: string
  label: string
  badge?: string
  featured?: boolean
}) {
  return (
    <a
      href={`tel:${number}`}
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-card ${
        featured
          ? 'border-primary/40 bg-primary/5 shadow-glow'
          : 'border-border bg-secondary/40 hover:border-primary/40 hover:bg-white'
      }`}
    >
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
        style={{ background: 'linear-gradient(135deg, hsl(235,60%,59%), hsl(28,91%,54%))' }}
      >
        <Phone className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-foreground">{number}</span>
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
              style={{ background: 'linear-gradient(135deg, hsl(235,60%,59%), hsl(28,91%,54%))' }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </a>
  )
}

/* ─── School contact card ────────────────────────────────── */
function SchoolCard({
  Icon,
  title,
  desc,
}: {
  Icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/60 p-3 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs leading-relaxed text-muted-foreground">{desc}</div>
      </div>
    </div>
  )
}

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  const [displayMsgs, setDisplayMsgs] = useState<DisplayMsg[]>([WELCOME_MSG])
  const [history, setHistory] = useState<GeminiMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMsgs, loading])

  /* Auto-resize textarea */
  const resizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userText = text.trim()
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userDisplay: DisplayMsg = { role: 'user', content: userText }
    setDisplayMsgs(prev => [...prev, userDisplay])

    const newHistory: GeminiMsg[] = [
      ...history,
      { role: 'user', parts: [{ text: userText }] },
    ]
    setHistory(newHistory)
    setLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('missing api key')

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: newHistory,
          }),
        }
      )
      const data = await res.json()
      const botText: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Je t'entends. Dis-m'en plus, je suis là. 💜"

      setHistory(prev => [...prev, { role: 'model', parts: [{ text: botText }] }])
      setDisplayMsgs(prev => [...prev, { role: 'bot', content: botText }])
    } catch {
      setDisplayMsgs(prev => [
        ...prev,
        { role: 'bot', content: "Je t'entends. Dis-m'en plus, je suis là pour toi. 💜" },
      ])
    }

    setLoading(false)
  }

  function resetChat() {
    setDisplayMsgs([WELCOME_MSG])
    setHistory([])
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-12 top-16 h-56 w-56 rounded-full blur-3xl" style={{ background: 'hsl(235 60% 59% / 0.12)' }} />
          <div className="absolute right-0 top-32 h-64 w-64 rounded-full blur-3xl" style={{ background: 'hsl(28 91% 54% / 0.12)' }} />
          <div className="absolute bottom-0 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'hsl(235 60% 59% / 0.06)' }} />
        </div>

        <div className="relative mx-auto max-w-xl">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
            <Shield className="h-3.5 w-3.5 text-primary" aria-hidden />
            SpeakUp · Bienveillant &amp; confidentiel
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Tu n'es plus seul.
            <span className="mt-2 block text-gradient">Parle. Je t'écoute.</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Discute avec <strong className="font-bold text-foreground">SpeakUp</strong>, un compagnon IA bienveillant. Que tu sois victime ou témoin, il t'écoute et t'aide à passer à l'action — pas à pas.
          </p>

          {/* CTA */}
          <a href="#chat" className="btn-primary mt-8 w-full sm:w-auto">
            Commencer à parler
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>

          {/* Feature pills */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { Icon: Heart, label: 'Bienveillant' },
              { Icon: Shield, label: 'Anonyme' },
              { Icon: Sparkles, label: 'Sans jugement' },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white/70 p-3 text-center shadow-sm backdrop-blur"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chat ─────────────────────────────────────────── */}
      <section id="chat" className="px-4 pb-16 pt-10 sm:px-8" aria-label="Chat avec SpeakUp">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="flex items-center gap-3">
                <BotAvatar size={9} />
                <div>
                  <div className="text-sm font-bold text-foreground">SpeakUp</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-soft" />
                    En ligne · anonyme
                  </div>
                </div>
              </div>
              <button
                onClick={resetChat}
                className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label="Nouvelle conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Nouveau
              </button>
            </div>

            {/* Messages */}
            <div className="h-[480px] space-y-4 overflow-y-auto px-4 py-5 sm:px-5" role="log" aria-live="polite">
              {displayMsgs.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'bot' && <BotAvatar size={7} />}
                  <div className={`max-w-[80%] ${msg.role === 'bot' ? 'bubble-bot' : 'bubble-user'}`}>
                    {msg.content.split('\n').map((line, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <br />}
                        {renderBold(line)}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2 justify-start animate-fade-in">
                  <BotAvatar size={7} />
                  <div className="bubble-bot flex items-center gap-1 px-4 py-3">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick replies */}
            <div className="flex flex-wrap gap-2 border-t border-border/50 bg-secondary/20 px-4 py-3">
              {QUICK_REPLIES.map(r => (
                <button
                  key={r}
                  disabled={loading}
                  onClick={() => sendMessage(r)}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-40"
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input) }}
              className="flex items-end gap-2 border-t border-border/50 bg-white p-3"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={loading}
                onChange={e => { setInput(e.target.value); resizeTextarea() }}
                onKeyDown={handleKeyDown}
                placeholder="Écris ce que tu ressens…"
                className="max-h-32 flex-1 resize-none rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Envoyer"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-glow transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, hsl(235,60%,59%), hsl(28,91%,54%))' }}
              >
                <Send className="h-5 w-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Resources ────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-8" aria-label="Ressources">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
            <div className="p-6 sm:p-8">
              {/* Section badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(235,60%,59%), hsl(28,91%,54%))' }}
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                De l'aide tout de suite
              </div>

              <h3 className="mt-4 text-xl font-extrabold text-foreground">Des numéros gratuits et anonymes</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tu peux appeler même si tu n'es pas sûr(e) — ils sont là pour ça.</p>

              {/* Phone numbers */}
              <div className="mt-4 grid gap-3">
                <PhoneCard number="3018" label="Cyberharcèlement · gratuit · 7j/7 · appel ou tchat" badge="Recommandé" featured />
                <PhoneCard number="3020" label="Harcèlement scolaire · gratuit · lundi → samedi" />
                <PhoneCard number="3114" label="Prévention du suicide · 24h/24 · 7j/7" />
              </div>

              {/* School contacts */}
              <div className="mt-6 mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase tracking-wide text-primary">Au lycée, frappe à ces portes</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3">
                <SchoolCard Icon={School} title="Le CPE" desc="Signaler, organiser ta protection, adapter ton emploi du temps." />
                <SchoolCard Icon={Stethoscope} title="L'infirmière scolaire" desc="Parler en toute confidentialité, sans que personne d'autre ne sache." />
                <SchoolCard Icon={MessageCircle} title="Un prof avec qui tu te sens à l'aise" desc="Celui ou celle dont tu te dis « lui/elle, je peux ». Fais-toi confiance." />
                <SchoolCard Icon={Users} title="Les Ambassadeurs pHARe" desc="Des élèves formés contre le harcèlement, présents dans ton lycée." />
                <SchoolCard Icon={Eye} title="Tu es témoin ?" desc="Ne ris pas, ne filme pas. Parle à la victime, et préviens un adulte." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-white/60 px-5 py-8 text-center text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">SpeakUp · Stop au Harcèlement</p>
        <p className="mt-1">En cas de danger immédiat, appelle le <strong className="text-foreground">17</strong> ou le <strong className="text-foreground">112</strong>.</p>
      </footer>
    </div>
  )
}
