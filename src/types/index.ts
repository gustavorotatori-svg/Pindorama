export interface Prospect {
  id: string;
  name: string;
  type: 'bar' | 'restaurante' | 'adega' | 'loja_bebidas' | 'souvenir' | 'hotel' | 'catering' | 'clube';
  address: string;
  city: string;
  region: 'sp_metro' | 'abcd' | 'baixada_santista' | 'litoral_norte';
  neighborhood?: string;
  phone: string;
  email: string;
  website?: string;
  googleRating: number;
  googleReviews: number;
  status: 'lead' | 'email1' | 'email2' | 'email3' | 'positivo' | 'negociacao' | 'fechado' | 'perdido';
  qualified: boolean;
  createdAt: Date;
  updatedAt: Date;
  nextAction?: Date;
  notes?: string;
}

export interface Interaction {
  id: string;
  prospectId: string;
  type: 'email' | 'call' | 'note';
  subject: string;
  content: string;
  sentAt: Date;
  status: 'sent' | 'opened' | 'clicked' | 'replied';
  emailSequence?: 1 | 2 | 3;
}
