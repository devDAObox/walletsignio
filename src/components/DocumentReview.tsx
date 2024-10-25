import React, { useState } from 'react';
import { FileCheck, Trash2, Link, X, Loader2, ArrowRight } from 'lucide-react';
import { signDocumentOnChain, checkAndSwitchNetwork } from '../utils/blockchain';
import type { DocumentReviewProps } from '../types';

export function DocumentReview({ 
  file, 
  hash,
  onSign, 
  onSignOnChain,
  onDiscard, 
  onClose, 
  isSigning,
  isSigningOnChain 
}: DocumentReviewProps) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [signingStep, setSigningStep] = useState<'idle' | 'network' | 'signing' | 'confirming'>('idle');

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleOnChainSign = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to sign documents on-chain');
      return;
    }

    try {
      setError(null);
      setSigningStep('network');
      await checkAndSwitchNetwork();
      
      const walletAddress = window.ethereum.selectedAddress;
      if (!walletAddress) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      setSigningStep('signing');
      const result = await signDocumentOnChain(file, walletAddress);
      setSigningStep('confirming');
      onSignOnChain(result);
    } catch (error: any) {
      console.error('Signing failed:', error);
      setError(error.message || 'Failed to sign document on-chain. Please try again.');
      setSigningStep('idle');
    }
  };

  const handleOffChainSign = async () => {
    if (!window.ethereum?.selectedAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError(null);
      const timestamp = new Date().toISOString();
      const message = `By signing this document, I hereby confirm that I have read and understand its content, consent to use electronic records and electronic signatures, and agree to be legally bound by its terms.

Timestamp: ${timestamp}

Original document hash: ${hash}`;
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, window.ethereum.selectedAddress],
      });

      onSign(signature);
    } catch (error: any) {
      console.error('Off-chain signing failed:', error);
      setError(error.message || 'Failed to sign document. Please try again.');
    }
  };

  const renderSigningStatus = () => {
    switch (signingStep) {
      case 'network':
        return (
          <div className="flex items-center gap-2 text-cyber-light">
            <Loader2 className="animate-spin" size={16} />
            <span>Switching to Polygon Network...</span>
          </div>
        );
      case 'signing':
        return (
          <div className="flex items-center gap-2 text-cyber-light">
            <Loader2 className="animate-spin" size={16} />
            <span>Waiting for signature...</span>
          </div>
        );
      case 'confirming':
        return (
          <div className="flex items-center gap-2 text-cyber-success">
            <Loader2 className="animate-spin" size={16} />
            <span>Confirming transaction...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-cyber-dark/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-cyber-dark border border-cyber-light/30 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col cyber-border">
        <div className="p-4 border-b border-cyber-light/30 flex items-center justify-between">
          <h3 className="text-lg font-medium text-cyber-light glow-text">Review Document</h3>
          <button
            onClick={onClose}
            className="text-cyber-light/70 hover:text-cyber-light"
            disabled={isSigning || isSigningOnChain}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-cyber-error/10 border border-cyber-error/30 rounded text-cyber-error text-sm">
            {error}
          </div>
        )}

        {signingStep !== 'idle' && (
          <div className="m-4 p-3 bg-cyber-dark border border-cyber-light/30 rounded">
            {renderSigningStatus()}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 p-4 bg-cyber-dark/50 border border-cyber-light/30 rounded-lg">
            <p className="text-cyber-light text-sm">
              File: {file.name}
            </p>
            <p className="text-cyber-light/70 text-xs mt-1">
              Size: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>

          <iframe
            src={previewUrl}
            className="w-full h-[60vh] rounded-lg border border-cyber-light/30"
            title="PDF Preview"
          />

          <div className="mt-6 p-4 bg-cyber-dark/50 border border-cyber-light/30 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 h-4 w-4 text-cyber-light rounded border-cyber-light/30 bg-cyber-dark focus:ring-cyber-light"
                disabled={isSigning || isSigningOnChain}
              />
              <span className="text-sm text-cyber-light/90 leading-relaxed">
                I am the owner of the connected blockchain wallet. By signing this document, 
                I hereby confirm that I have read and understand its content, consent to use 
                electronic records and electronic signatures, and agree to be legally bound 
                by its terms.
              </span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-cyber-light/30 flex justify-end gap-3">
          <button
            onClick={onDiscard}
            disabled={isSigning || isSigningOnChain || signingStep !== 'idle'}
            className="cyber-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            <Trash2 size={16} />
            Discard
          </button>
          <button
            onClick={handleOffChainSign}
            disabled={isSigning || isSigningOnChain || !consentChecked || signingStep !== 'idle'}
            className="cyber-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            {isSigning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing Off-Chain...
              </>
            ) : (
              <>
                <FileCheck size={16} />
                Sign Off-Chain
              </>
            )}
          </button>
          <button
            onClick={handleOnChainSign}
            disabled={isSigning || isSigningOnChain || !consentChecked || signingStep !== 'idle'}
            className="cyber-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-cyber-light/10"
          >
            {isSigningOnChain ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing On-Chain...
              </>
            ) : (
              <>
                <Link size={16} />
                Sign On-Chain
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}