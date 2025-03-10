


export interface User {
    uid: string;
    email: string;
    name?: string;   
    password?: string;
}
    
    

//Interface for user
export interface UserProfile {
   id?: string;
   userId: User["uid"] | string;
   name: User["name"] | string;
   color: string;   
   photoURL: string;
   sharedExpense: boolean;
   emailShared?: string[];
   currency: string;
   emailVerified?: boolean;
    
}


