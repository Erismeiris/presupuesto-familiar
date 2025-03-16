export interface User {
    uid: string;
    email: string;
    name: string;   
    password?: string;
}

// Interface for user profile
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

export interface Expense {
    id: string; // Added id to uniquely identify each expense
    amount: number;
    description: string;
    ownerId: User["uid"]; // Reference to the user who owns the expense
}

export interface UserDetail {
    name: string;
    sharedWith: string[]; // Array of user IDs with whom the expenses are shared
    expenses: {
        [key: string]: Expense;
    };
}

export interface UserData {
    users: {
        [key: string]: UserDetail;
    };
}

export interface Gastos {
    id: string;
    categoria: string;
    date: string;
    descripcion: string;
    monto: number;
    producto: string;
    tasa_de_cambio: number;
    userId: User["uid"]; // Reference to the user who made the expense
}

/* {
    "users": {
      "user1": {
        "name": "Juan",
        "sharedWith": ["user2"],
        "expenses": {
          "expense1": {
            "id": "expense1",
            "amount": 100,
            "description": "Groceries",
            "ownerId": "user1"
          }
        }
      },
      "user2": {
        "name": "Ana",
        "sharedWith": ["user1"],
        "expenses": {
          "expense2": {
            "id": "expense2",
            "amount": 50,
            "description": "Gasoline",
            "ownerId": "user2"
          }
        }
      }
    }
  }
 */