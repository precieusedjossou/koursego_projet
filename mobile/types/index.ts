// types/index.ts — Types globaux KourseGO

export type UserRole = 'client' | 'coursier';
export type TypeCourse = 'achat' | 'recuperation_colis';
export type StatutDemande = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';
export type StatutCourse = 'demarree' | 'en_cours' | 'terminee' | 'annulee';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse';

export interface Utilisateur {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  otp_verifie: boolean;
  date_inscription: string;
  statut_compte: 'actif' | 'suspendu' | 'en_attente';
  role_actif: UserRole;
  est_aussi_coursier: boolean;
  avatar_url?: string;
}

export interface Livreur {
  id_livreur: string;
  id_utilisateur: string;
  statut_validation: 'en_attente' | 'valide' | 'rejete';
  disponibilite: boolean;
  type_document: 'CIP' | 'carte_identite';
  numero_document: string;
  photo_document?: string;
  photo_selfie?: string;
  date_validation?: string;
  note_moyenne?: number;
  nombre_courses?: number;
  gains_total?: number;
}

export interface Article {
  id: string;
  nom: string;
  quantite: number;
  prix_estime?: number;
  magasin?: string;
  note?: string;
}

export interface DemandeCourse {
  id_demande: string;
  id_client: string;
  type_course: TypeCourse;
  description_articles?: string;
  articles?: Article[];
  magasins?: string;
  adresse_livraison: string;
  adresse_depart?: string;
  instructions?: string;
  estimation_prix: number;
  commission_coursier: number;
  commission_plateforme: number;
  date_demande: string;
  statut_demande: StatutDemande;
  client?: Utilisateur;
}

export interface Course {
  id_course: string;
  id_demande: string;
  id_livreur: string;
  statut_course: StatutCourse;
  date_debut?: string;
  date_fin?: string;
  demande?: DemandeCourse;
  livreur?: Livreur & { utilisateur?: Utilisateur };
}

export interface Message {
  id_message: string;
  id_conversation: string;
  id_expediteur: string;
  contenu: string;
  type_message: 'texte' | 'image';
  date_envoi: string;
  expediteur?: Utilisateur;
}

export interface Conversation {
  id_conversation: string;
  id_course: string;
  date_creation: string;
  statut_conversation: 'active' | 'fermee';
  messages?: Message[];
}

export interface Paiement {
  id_paiement: string;
  id_demande: string;
  montant_articles: number;
  montant_commission: number;
  montant_plateforme: number;
  montant_total: number;
  moyen_paiement: 'MoMo' | 'carte' | 'especes';
  preuve_paiement?: string;
  statut_paiement: StatutPaiement;
  date_paiement: string;
}

export interface LocalisationCourse {
  id_suivi: string;
  id_course: string;
  latitude: number;
  longitude: number;
  date_position: string;
}

export interface Avis {
  id_avis: string;
  id_course: string;
  id_client: string;
  note: number;
  commentaire?: string;
  date_avis: string;
}

export interface Notification {
  id: string;
  titre: string;
  message: string;
  type: 'commande' | 'message' | 'paiement' | 'systeme' | 'securite';
  lu: boolean;
  date: string;
}
