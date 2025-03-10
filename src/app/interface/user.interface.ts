


export interface User {
    uid: string;
    email: string;
    name?: string;   
    password?: string;
}
    
    

//Interface for user
export interface UserProfile {
   user: User;
   colorPalette: string;
   email: string;
   displayName?: string;
   photoURL?: string;
   tipoMoneda?: string;
   emailVerified?: boolean;
    
}


