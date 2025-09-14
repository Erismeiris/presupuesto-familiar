export interface User {
    uid: string;
    email?: string;
    name: string;   
    password?: string;
}

// Interface for user profile
export interface UserProfile {
  id?: string;
  userId: string;
  name: string;
  color: string;
  photoURL: string;
  isSharingExpenses: boolean; // Cambiado para mayor claridad
  sharedWithUsers?: string[]; // Cambiado a userId en lugar de email
  currency: string;
  emailVerified?: boolean;
}


export interface Gastos {
  id?: string;
  categoria: string;
  date: string;
  descripcion: string;
  monto: number;
  userId: string; // Usar string en lugar de User["uid"]
  sharedWith?: string[]; // Array de UserIds con los que se compartió
  name: string; //Eliminamos userName y dejamos solo name.
}

interface GastosUsuario {
  [gastoId: string]: Gastos;
}


export interface UserSearchResult {
  exists: boolean;
  user?: {
    uid: string;
    email: string;
    name: string;
  };
}

export interface EmailValidationState {
  email: string;
  isValidating: boolean;
  userExists: boolean | null;
  userName?: string;
  canSendInvitation: boolean;
  validationMessage: string;
}