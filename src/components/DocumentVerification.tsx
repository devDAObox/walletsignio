import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Shield, CheckCircle2, XCircle, Upload, ExternalLink, AlertCircle } from 'lucide-react';
import { verifyDocument } from '../utils/document';
import type { StoredDocument } from '../services/db';

export function DocumentVerification() {
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean;
    details?: StoredDocument;
    error?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsVerifying(true);
    try {
      const result = await verifyDocument(acceptedFiles[0]);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        isVerified: false,
        error: error instanceof Error ? error.message : 'Verification failed. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  // Format UTC timestamp
  const formatUTCTimestamp = (isoString: string) => {
    try {
      return isoString.replace('T', ' ').slice(0, 19) + ' UTC';
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-cyber-glow/5 border border-cyber-glow/20 rounded-lg p-4 flex items-start gap-3">
        <Shield className="text-cyber-glow mt-1" />
        <div>
          <h3 className="font-medium text-cyber-glow">Verify Signed Document</h3>
          <p className="text-sm text-cyber-text">
            Upload a signed PDF document to verify its authenticity and signature details.
          </p>
        </div>
      </div>

      {!verificationResult && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-cyber-glow bg-cyber-glow/5' : 'border-cyber-text/30 hover:border-cyber-text/50'}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-cyber-text/70" />
          <p className="mt-2 text-sm font-medium text-cyber-text">
            {isDragActive ? 'Drop the signed PDF here' : 'Drag & drop a signed PDF file here'}
          </p>
          <p className="mt-1 text-xs text-cyber-text/70">
            or click to select a file
          </p>
        </div>
      )}

      {isVerifying && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-glow mx-auto"></div>
          <p className="mt-4 text-sm text-cyber-text">Verifying document...</p>
        </div>
      )}

      {verificationResult && (
        <div className={`rounded-lg p-4 space-y-4 ${
          verificationResult.isVerified 
            ? 'bg-cyber-success/10 border border-cyber-success/30' 
            : 'bg-cyber-error/10 border border-cyber-error/30'
        }`}>
          <div className="flex items-start gap-3">
            {verificationResult.isVerified ? (
              <CheckCircle2 className="text-cyber-success mt-1" />
            ) : (
              <XCircle className="text-cyber-error mt-1" />
            )}
            <div>
              <h3 className={`font-medium ${
                verificationResult.isVerified ? 'text-cyber-success' : 'text-cyber-error'
              }`}>
                {verificationResult.isVerified
                  ? 'Document Verified Successfully'
                  : 'Document Verification Failed'}
              </h3>
              <p className={`text-sm mt-1 ${
                verificationResult.isVerified ? 'text-cyber-success/80' : 'text-cyber-error/80'
              }`}>
                {verificationResult.isVerified
                  ? 'This document is authentic and has been signed through our platform.'
                  : verificationResult.error}
              </p>
            </div>
          </div>

          {verificationResult.isVerified && verificationResult.details && (
            <div className="bg-cyber-dark/50 rounded-lg p-4 space-y-3 mt-4 border border-cyber-glow/20">
              <div>
                <h4 className="text-sm font-medium text-cyber-text">Signer's Wallet Address</h4>
                <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-glow/10 break-all text-cyber-glow">
                  {verificationResult.details.walletAddress}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-cyber-text">Signing Time</h4>
                <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-glow/10 text-cyber-glow">
                  {formatUTCTimestamp(verificationResult.details.timestamp)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-cyber-text">Original Document Hash</h4>
                <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-glow/10 break-all text-cyber-glow">
                  {verificationResult.details.originalHash}
                </p>
              </div>
              {verificationResult.details.transactionHash && (
                <div>
                  <h4 className="text-sm font-medium text-cyber-text">Transaction Hash</h4>
                  <div className="flex items-center gap-2">
                    <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-glow/10 break-all flex-1 text-cyber-glow">
                      {verificationResult.details.transactionHash}
                    </p>
                    <a
                      href={`https://polygonscan.com/tx/${verificationResult.details.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-glow hover:text-cyber-glow/80"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button
              onClick={() => setVerificationResult(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyber-text bg-cyber-dark/50 border border-cyber-glow/20 rounded-lg hover:bg-cyber-dark/70 hover:border-cyber-glow/30"
            >
              <Upload size={16} />
              Verify Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}