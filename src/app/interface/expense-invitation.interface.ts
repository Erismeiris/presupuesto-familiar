export interface ExpenseInvitation {
   id: string;
  fromUserId: string;
  toUserEmail: string;
  toUserId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at?: string;
  fromUser?: {
    uid: string;
    name: string;
    email: string;
  };
  toUser?: {
    uid: string;
    name: string;
    email: string;
  };
}

export interface SendInvitationRequest {
  fromUserId: string;
  toUserEmail: string;
}

export interface SendInvitationResponse {
  message: string;
  invitation: {
    id: string;
    toUserEmail: string;
    status: 'pending';
    userExists: boolean;
  };
}

export interface RespondInvitationRequest {
  invitationId: string;
  response: 'accepted' | 'rejected';
  toUserId: string;
}

export interface RespondInvitationResponse {
  message: string;
  invitation: {
    id: string;
    status: 'accepted' | 'rejected';
    responded_at: string;
  };
}

export interface InvitationsListResponse {
  invitations: ExpenseInvitation[];
}
