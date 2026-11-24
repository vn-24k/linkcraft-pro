/**
 * Supabase Client para LinkCraft Pro
 * Conectado ao PostgreSQL na nuvem (us-west-1)
 */

export const SUPABASE_URL = "https://hfgxsloyssxwfulyzftt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZ3hzbG95c3N4d2Z1bHl6ZnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODQzNzksImV4cCI6MjA5NDI2MDM3OX0.zDw_CGyNPMs4KGEWmDnQMzgh-SccxalFlB2c07CfJv4";

export interface LinkItem {
  id: string;
  original_url: string;
  slug: string;
  title: string;
  clicks: number;
  qr_color: string;
  created_at: string;
}

export const linksDb = {
  // Buscar todos os links
  async getLinks(): Promise<LinkItem[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/links?order=created_at.desc`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Erro ao buscar links do Supabase:", e);
    }
    return [];
  },

  // Criar novo link
  async createLink(link: Omit<LinkItem, 'id' | 'created_at'>): Promise<LinkItem | null> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/links`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(link)
      });
      if (res.ok) {
        const data = await res.json();
        return data[0];
      }
    } catch (e) {
      console.error("Erro ao salvar link no Supabase:", e);
    }
    return null;
  },

  // Incrementar clique no link
  async incrementClick(slug: string, currentClicks: number) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/links?slug=eq.${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clicks: currentClicks + 1 })
      });
    } catch (e) {
      console.error("Erro ao incrementar clique:", e);
    }
  },

  // Excluir link
  async deleteLink(id: string) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/links?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
    } catch (e) {
      console.error("Erro ao deletar link:", e);
    }
  }
};
