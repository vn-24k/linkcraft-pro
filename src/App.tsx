import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  BarChart3, 
  Download, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  Layers, 
  Palette, 
  Plus, 
  TrendingUp, 
  Globe, 
  MousePointerClick,
  Share2
} from 'lucide-react';
import { linksDb, LinkItem } from './supabase';

const QR_COLORS = [
  { name: 'Azul Real', hex: '#2563EB', bg: 'bg-blue-600' },
  { name: 'Esmeralda', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Roxo Nobre', hex: '#7C3AED', bg: 'bg-purple-600' },
  { name: 'Laranja Fogo', hex: '#EA580C', bg: 'bg-orange-600' },
  { name: 'Grafite', hex: '#0F172A', bg: 'bg-slate-900' }
];

export default function App() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [originalUrl, setOriginalUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(QR_COLORS[0].hex);
  const [creating, setCreating] = useState(false);

  // Active / Selected Link for QR Preview
  const [activeLink, setActiveLink] = useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Redirecionamento inteligente se acessado via ?r=slug
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectSlug = params.get('r');
    if (redirectSlug) {
      handleDirectRedirect(redirectSlug);
    }
  }, []);

  async function handleDirectRedirect(targetSlug: string) {
    try {
      const allLinks = await linksDb.getLinks();
      const match = allLinks.find(l => l.slug.toLowerCase() === targetSlug.toLowerCase());
      if (match) {
        await linksDb.incrementClick(match.slug, match.clicks);
        window.location.href = match.original_url;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Carregar links do Supabase
  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const data = await linksDb.getLinks();
      setLinks(data);
      if (data.length > 0 && !activeLink) {
        setActiveLink(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Criar novo link encurtado
  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    if (!originalUrl) return;

    let cleanUrl = originalUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let finalSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!finalSlug) {
      finalSlug = Math.random().toString(36).substring(2, 8);
    }

    const finalTitle = title.trim() || new URL(cleanUrl).hostname;

    setCreating(true);
    try {
      const created = await linksDb.createLink({
        original_url: cleanUrl,
        slug: finalSlug,
        title: finalTitle,
        clicks: 0,
        qr_color: selectedColor
      });

      if (created) {
        setLinks(prev => [created, ...prev]);
        setActiveLink(created);
        setOriginalUrl('');
        setSlug('');
        setTitle('');
      } else {
        alert('Este slug já está em uso ou ocorreu um erro. Tente outro nome.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  // Excluir link
  async function handleDeleteLink(id: string) {
    await linksDb.deleteLink(id);
    setLinks(prev => prev.filter(l => l.id !== id));
    if (activeLink?.id === id) {
      setActiveLink(links.find(l => l.id !== id) || null);
    }
  }

  // Simular clique e abrir destino
  async function handleLinkClick(linkItem: LinkItem) {
    await linksDb.incrementClick(linkItem.slug, linkItem.clicks);
    setLinks(prev => prev.map(l => l.id === linkItem.id ? { ...l, clicks: l.clicks + 1 } : l));
    if (activeLink?.id === linkItem.id) {
      setActiveLink({ ...linkItem, clicks: linkItem.clicks + 1 });
    }
    window.open(linkItem.original_url, '_blank');
  }

  function getShortUrl(item: LinkItem) {
    return `${window.location.origin}/?r=${item.slug}`;
  }

  function copyToClipboard(item: LinkItem) {
    const text = getShortUrl(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Gera URL do QR Code de alta resolução com API SVG/PNG
  function getQrCodeUrl(url: string, colorHex: string, size = 400) {
    const cleanHex = colorHex.replace('#', '');
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=${cleanHex}&format=png`;
  }

  // Baixar QR Code
  async function downloadQrCode(item: LinkItem) {
    const qrUrl = getQrCodeUrl(getShortUrl(item), item.qr_color || selectedColor, 600);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qrcode-${item.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  }

  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                Link<span className="text-blue-600">Craft</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Links de Marca & QR Code Pro
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PostgreSQL Supabase Online</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-blue-800 font-bold flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>{totalClicks} cliques totais</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        {/* Banner Hero & Criador de Links */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Ferramenta de Alta Performance
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              Encurte links longos e gere QR Codes de marca em segundos.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Crie URLs memoráveis para seus clientes, baixe QR Codes em alta resolução para cartões ou cardápios e veja as métricas de cliques em tempo real no Supabase.
            </p>
          </div>

          {/* Formulário de Encurtamento */}
          <form onSubmit={handleCreateLink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* URL Original */}
              <div className="md:col-span-6 relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  1. Cole a URL de Destino *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="https://suaempresa.com.br/produto-especial"
                    value={originalUrl}
                    onChange={e => setOriginalUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Slug Personalizado */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  2. Slug Curto (Opcional)
                </label>
                <div className="relative">
                  <span className="text-xs font-semibold text-slate-400 absolute left-3 top-3">/</span>
                  <input
                    type="text"
                    placeholder="ex: proposta-2026"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Título de Referência */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  3. Título / Descrição
                </label>
                <input
                  type="text"
                  placeholder="ex: Portfólio Vinicius"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50"
                />
              </div>
            </div>

            {/* Linha Inferior: Cores do QR Code & Botão de Ação */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Cor do QR Code:
                </span>
                <div className="flex items-center gap-1.5">
                  {QR_COLORS.map(color => (
                    <button
                      type="button"
                      key={color.hex}
                      onClick={() => setSelectedColor(color.hex)}
                      className={`w-6 h-6 rounded-full transition-all ${color.bg} ${
                        selectedColor === color.hex 
                          ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-sm' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {creating ? (
                  <span>Gravando no Supabase...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Criar Link & QR Code
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Grade de Conteúdo: Lista de Links (Esquerda) + Preview Pro de QR Code (Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Lista de Links Encurtados */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-extrabold text-slate-900">Seus Links Gerados</h2>
                <p className="text-xs text-slate-500">Persistência permanente no banco de dados</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {links.length} {links.length === 1 ? 'link ativo' : 'links ativos'}
              </span>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
                Carregando links do Supabase...
              </div>
            ) : links.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
                <Link2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-sm text-slate-700">Nenhum link criado ainda</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Cole uma URL no formulário acima para gerar seu primeiro link curto e QR Code de alta resolução.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map(item => {
                  const isSelected = activeLink?.id === item.id;
                  const isCopied = copiedId === item.id;
                  const shortUrl = getShortUrl(item);

                  return (
                    /* COMPONENTE UIVERSE ADAPTADO E ISOLADO */
                    <div
                      key={item.id}
                      onClick={() => setActiveLink(item)}
                      className={`uiv_scoped_card cursor-pointer ${
                        isSelected ? 'ring-2 ring-blue-600/30 border-blue-500 shadow-md' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 truncate">
                              {item.title || item.slug}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              /{item.slug}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 truncate max-w-md font-mono">
                            {item.original_url}
                          </p>

                          <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <MousePointerClick className="w-3.5 h-3.5 text-blue-600" />
                              {item.clicks || 0} cliques
                            </span>
                            <span>•</span>
                            <span>Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => copyToClipboard(item)}
                            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                              isCopied
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Copiar Link Curto"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{isCopied ? 'Copiado!' : 'Copiar'}</span>
                          </button>

                          <button
                            onClick={() => handleLinkClick(item)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Testar Redirecionamento"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteLink(item.id)}
                            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Excluir Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita: Preview do QR Code Pro & Cartão de Compartilhamento */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm sticky top-20 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview do QR Code</span>
                {activeLink && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Pronto para Download
                  </span>
                )}
              </div>
              <h2 className="text-xl font-heading font-extrabold text-slate-900 mt-1">
                {activeLink ? activeLink.title || `/${activeLink.slug}` : 'Selecione um Link'}
              </h2>
            </div>

            {activeLink ? (
              <div className="space-y-6">
                {/* Cartão Visual com QR Code Centralizado */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 text-center space-y-4 shadow-inner">
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <img 
                      src={getQrCodeUrl(getShortUrl(activeLink), activeLink.qr_color || selectedColor, 300)}
                      alt={`QR Code para ${activeLink.slug}`}
                      className="w-48 h-48 mx-auto rounded-xl object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Link Curto Oficial</span>
                    <p className="text-sm font-bold text-blue-600 font-mono select-all">
                      {getShortUrl(activeLink)}
                    </p>
                  </div>
                </div>

                {/* Métricas do Link Selecionado */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-left">
                    <span className="text-[11px] font-semibold text-slate-400">Total de Acessos</span>
                    <p className="text-xl font-heading font-extrabold text-slate-900 mt-0.5">
                      {activeLink.clicks || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-left">
                    <span className="text-[11px] font-semibold text-slate-400">Status</span>
                    <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ativo 24/7
                    </p>
                  </div>
                </div>

                {/* Botões de Ação do QR Code */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => downloadQrCode(activeLink)}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> Baixar QR Code em Alta Resolução (PNG)
                  </button>

                  <button
                    onClick={() => copyToClipboard(activeLink)}
                    className="w-full py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar URL do Link Curto
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Selecione ou crie um link para visualizar o QR Code profissional.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Profissional */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LinkCraft — Desenvolvido por <strong className="text-slate-800">Vinicius Caetano</strong>.</p>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-semibold">PostgreSQL Supabase</span>
            <span>•</span>
            <span>Componentes Uiverse Integrados</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Zero Spam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
