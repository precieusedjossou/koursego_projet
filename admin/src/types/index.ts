// src/types/index.ts

export type UserRole = 'client' | 'coursier' | 'admin';
export type StatutCompte = 'actif' | 'suspendu' | 'en_attente';
export type StatutValidation = 'en_attente' | 'valide' | 'rejete';
export type StatutDemande = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse';

export interface Utilisateur {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  otp_verifie: boolean;
  date_inscription: string;
  statut_compte: StatutCompte;
  role_actif: UserRole;
  est_aussi_coursier: boolean;
  avatar_url?: string;
}

export interface Livreur {
  id_livreur: string;
  id_utilisateur: string;
  utilisateur?: Utilisateur;
  statut_validation: StatutValidation;
  disponibilite: boolean;
  type_document: 'CIP' | 'carte_identite';
  numero_document: string;
  photo_document?: string;
  photo_selfie?: string;
  date_validation?: string;
  note_moyenne?: number;
  nombre_courses?: number;
}

export interface DemandeCourse {
  id_demande: string;
  id_client: string;
  client?: Utilisateur;
  type_course: 'achat' | 'recuperation_colis';
  description_articles?: string;
  adresse_livraison: string;
  estimation_prix: number;
  commission_coursier: number;
  commission_plateforme: number;
  date_demande: string;
  statut_demande: StatutDemande;
}

export interface Course {
  id_course: string;
  id_demande: string;
  id_livreur: string;
  demande?: DemandeCourse;
  livreur?: Livreur;
  statut_course: string;
  date_debut?: string;
  date_fin?: string;
}

export interface Paiement {
  id_paiement: string;
  id_demande: string;
  montant_total: number;
  moyen_paiement: string;
  statut_paiement: StatutPaiement;
  date_paiement: string;
}

export interface StatsAdmin {
  total_commandes: number;
  commandes_en_cours: number;
  total_coursiers: number;
  coursiers_valides: number;
  coursiers_en_attente: number;
  total_clients: number;
  revenus_total: number;
  revenus_mois: number;
}
