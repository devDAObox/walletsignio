import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  Shield, 
  Lock, 
  CheckCircle2, 
  Link, 
  Clock, 
  UserCheck 
} from 'lucide-react';
import { WalletConnect } from './components/WalletConnect';
import { DocumentReview } from './components/DocumentReview';
import { SigningStatus } from './components/SigningStatus';
import { DocumentVerification } from './components/DocumentVerification';
import { generateHash } from './utils/document';
import type { DocumentState } from './types';

export default function App() {
  // State and handlers remain unchanged
  const [documentState, setDocumentState] = useState<DocumentState>({
    file: null,
    hash: null,
    signature: null,
    transactionHash: null,
    blockNumber: undefined,
    timestamp: undefined,
    isReviewing: false,
    isSigning: false,
    isSigningOnChain: false,
    error: null,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      setDocumentState(prev => ({
        ...prev,
        error: 'Please upload a PDF file',
      }));
      return;
    }

    try {
      const hash = await generateHash(file);
      setDocumentState(prev => ({
        ...prev,
        file,
        hash,
        isReviewing: true,
        error: null,
      }));
    } catch (error) {
      console.error('Error processing file:', error);
      setDocumentState(prev => ({
        ...prev,
        error: 'Failed to process the file. Please try again.',
      }));
    }
  }, []);

  const handleSigningComplete = (
    signature: string, 
    transactionHash?: string,
    blockNumber?: number,
    timestamp?: number
  ) => {
    setDocumentState(prev => ({
      ...prev,
      signature,
      transactionHash: transactionHash || null,
      blockNumber,
      timestamp,
      isSigning: false,
      isSigningOnChain: false,
      isReviewing: false,
      error: null,
    }));
  };

  const handleDiscard = () => {
    setDocumentState({
      file: null,
      hash: null,
      signature: null,
      transactionHash: null,
      blockNumber: undefined,
      timestamp: undefined,
      isReviewing: false,
      isSigning: false,
      isSigningOnChain: false,
      error: null,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-cyber-dark text-white flex flex-col">
      <header className="border-b border-cyber-light/20 bg-cyber-dark/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-cyber-accent">WalletSign</p>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-cyber-light neon-text">
              Sign Documents With Your Crypto Wallet
            </h1>
            <p className="text-lg text-cyber-text/80 font-bold mb-2">
              Securely. Anonymously. Legally binding.
            </p>
            <p className="text-lg text-cyber-text/80">
              Securely sign any document with your blockchain wallet. Choose between off-chain or on-chain signature for enhanced verification. Zero data collected.
            </p>
          </div>

          <div className="bg-cyber-glow/5 border border-cyber-glow/20 rounded-lg p-4 flex items-start gap-3">
            <Shield className="text-cyber-glow mt-1" />
            <div>
              <h2 className="font-medium text-cyber-glow">Sign Document With Your Wallet</h2>
              <p className="text-sm text-cyber-text">
                Upload a document below to sign it with your wallet.
              </p>
            </div>
          </div>

          {documentState.error && (
            <div className="bg-red-900/20 border border-red-500 text-red-100 px-4 py-3 rounded">
              {documentState.error}
            </div>
          )}

          {!documentState.signature && !documentState.isReviewing && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors
                ${isDragActive ? 'border-cyber-accent bg-cyber-accent/10' : 'border-cyber-light/30 hover:border-cyber-light/50'}`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  {isDragActive ? (
                    <Upload className="h-12 w-12 text-cyber-accent" />
                  ) : (
                    <FileText className="h-12 w-12 text-cyber-light/50" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? 'Drop your PDF here'
                      : 'Drag and drop your PDF here, or click to select'}
                  </p>
                  <p className="text-sm text-cyber-light/70 mt-1">Only PDF files are supported</p>
                </div>
              </div>
            </div>
          )}

          {documentState.isReviewing && documentState.file && documentState.hash && (
            <DocumentReview
              file={documentState.file}
              hash={documentState.hash}
              onSign={handleSigningComplete}
              onSignOnChain={(result) => handleSigningComplete(
                result.signature,
                result.transactionHash,
                result.blockNumber,
                result.timestamp
              )}
              onDiscard={handleDiscard}
              onClose={handleDiscard}
              isSigning={documentState.isSigning}
              isSigningOnChain={documentState.isSigningOnChain}
            />
          )}

          {documentState.signature && documentState.file && documentState.hash && (
            <SigningStatus
              file={documentState.file}
              hash={documentState.hash}
              signature={documentState.signature}
              transactionHash={documentState.transactionHash}
              blockNumber={documentState.blockNumber}
              timestamp={documentState.timestamp}
              onSignAnother={handleDiscard}
            />
          )}

          <DocumentVerification />

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-cyber-light mb-4">
                Secure Document Signing
              </h2>
              <p className="text-lg text-cyber-text/80">
                Sign documents with your blockchain wallet. Secure, verifiable, and tamper-proof.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-6 space-y-4">
                <div className="bg-cyber-light/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Lock className="text-cyber-light h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-light">Secure & Private</h3>
                <p className="text-cyber-text/80 text-sm">
                  Documents never leave your device. Only cryptographic hashes are stored.
                </p>
              </div>

              <div className="bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-6 space-y-4">
                <div className="bg-cyber-light/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <CheckCircle2 className="text-cyber-light h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-light">Legally Binding</h3>
                <p className="text-cyber-text/80 text-sm">
                  Binding signatures, generated via your blockchain wallet.
                </p>
              </div>

              <div className="bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-6 space-y-4">
                <div className="bg-cyber-light/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Link className="text-cyber-light h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-light">Easy Verification</h3>
                <p className="text-cyber-text/80 text-sm">
                  Instantly verify signed documents with our built-in verification tool.
                </p>
              </div>

              <div className="bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-6 space-y-4">
                <div className="bg-cyber-light/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Shield className="text-cyber-light h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-light">Sign On/Off Chain</h3>
                <p className="text-cyber-text/80 text-sm">
                  Choose off-chain signing for simplicity, or send an on-chain signature to the Polygon network for enhanced verification.
                </p>
              </div>

              <div className="bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-6 space-y-4">
                <div className="bg-cyber-light/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Clock className="text-cyber-light h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-light">Free to Use</h3>
                <p className="text-cyber-text/80 text-sm">
                  No hidden costs. You only pay MATIC gas fee when sending on-chain transactions.
                </p>
              </div>

              <div className="bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-6 space-y-4">
                <div className="bg-cyber-light/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <UserCheck className="text-cyber-light h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-light">Anonymity</h3>
                <p className="text-cyber-text/80 text-sm">
                  Sign documents anonymously, identified via wallet ownership.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-cyber-light/20 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-cyber-light/70">
              Made with ❤️ by <a href="https://DAObox.io" target="_blank" rel="noopener noreferrer" className="text-cyber-light hover:text-cyber-light/80">DAObox</a>
            </p>
            <div className="flex items-center gap-6">
              <a href="https://strapi.aurum.law/uploads/Wallet_Sign_io_Legal_Notice_634db58940.pdf" target="_blank" rel="noopener noreferrer" className="text-cyber-light hover:text-cyber-light/70"
              >Legal Notice
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}