export interface DocumentState {
  file: File | null;
  hash: string | null;
  isReviewing: boolean;
  isSigning: boolean;
  isSigningOnChain: boolean;
  signature: string | null;
  transactionHash?: string | null;
  blockNumber?: number;
  timestamp?: number;
  error: string | null;
}

export interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
}

export interface DocumentReviewProps {
  file: File;
  hash: string;
  onSign: () => void;
  onSignOnChain: (result: SigningResult) => void;
  onDiscard: () => void;
  onClose: () => void;
  isSigning: boolean;
  isSigningOnChain: boolean;
}

export interface SigningResult {
  signature: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface VerificationResult {
  isVerified: boolean;
  details?: StoredDocument;
  error?: string;
}

export interface StoredDocument {
  signedHash: string;
  originalHash: string;
  signature: string;
  walletAddress: string;
  timestamp: string;
  transactionHash?: string;
  blockNumber?: string;
  networkId?: string;
}