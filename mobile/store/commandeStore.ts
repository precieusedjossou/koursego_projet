// store/commandeStore.ts
import { create } from 'zustand';
import type { DemandeCourse, Article, TypeCourse } from '../types';

interface CommandeState {
  // Formulaire nouvelle commande
  typeCourse: TypeCourse;
  articles: Article[];
  adresseLivraison: string;
  adresseDepart: string;
  instructions: string;
  descriptionColis: string;

  // Commande en cours (après confirmation)
  commandeActive: DemandeCourse | null;

  // Setters
  setTypeCourse: (type: TypeCourse) => void;
  setArticles: (articles: Article[]) => void;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  setAdresseLivraison: (adresse: string) => void;
  setAdresseDepart: (adresse: string) => void;
  setInstructions: (instructions: string) => void;
  setDescriptionColis: (desc: string) => void;
  setCommandeActive: (commande: DemandeCourse | null) => void;
  resetForm: () => void;
}

const defaultArticle = (): Article => ({
  id: Date.now().toString(),
  nom: '',
  quantite: 1,
  magasin: '',
});

export const useCommandeStore = create<CommandeState>((set) => ({
  typeCourse: 'achat',
  articles: [defaultArticle()],
  adresseLivraison: '',
  adresseDepart: '',
  instructions: '',
  descriptionColis: '',
  commandeActive: null,

  setTypeCourse: (typeCourse) => set({ typeCourse }),
  setArticles: (articles) => set({ articles }),
  addArticle: (article) =>
    set((state) => ({ articles: [...state.articles, article] })),
  removeArticle: (id) =>
    set((state) => ({ articles: state.articles.filter((a) => a.id !== id) })),
  updateArticle: (id, updates) =>
    set((state) => ({
      articles: state.articles.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  setAdresseLivraison: (adresseLivraison) => set({ adresseLivraison }),
  setAdresseDepart: (adresseDepart) => set({ adresseDepart }),
  setInstructions: (instructions) => set({ instructions }),
  setDescriptionColis: (descriptionColis) => set({ descriptionColis }),
  setCommandeActive: (commandeActive) => set({ commandeActive }),
  resetForm: () =>
    set({
      typeCourse: 'achat',
      articles: [defaultArticle()],
      adresseLivraison: '',
      adresseDepart: '',
      instructions: '',
      descriptionColis: '',
    }),
}));
