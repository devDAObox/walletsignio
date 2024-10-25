import React, { useState } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { generateSignedPDF } from '../utils/document';

interface SigningStatusProps {
  file: File;
  hash: string;
  signature: string;
  transactionHash: string | null;
  blockNumber?: number;
  timestamp?: number;
  onSignAnother: () => void;
}

export function SigningStatus({ 
  file, 
  hash, 
  signature, 
  transactionHash,
  blockNumber,
  timestamp,
  onSignAnother 
}: SigningStatusProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const walletAddress = window.ethereum?.selectedAddress;
      if (!walletAddress) {
        throw new Error('No wallet connected');
      }

      // Ensure all required parameters are present
      if (!file || !signature) {
        throw new Error('Missing required signing data');
      }

      const { pdfBytes } = await generateSignedPDF(
        file,
        signature,
        walletAddress,
        transactionHash || undefined,
        blockNumber,
        timestamp || Date.now()
      );

      // Create and download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error generating signed PDF:', error);
      setError(error.message || 'Failed to generate signed PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="cyber-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-cyber-light neon-text">Document Signed Successfully</h2>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="cyber-button px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download size={16} />
              Download Signed Document
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-cyber-error/10 border border-cyber-error/30 rounded p-3 text-cyber-error text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-cyber-light">Document Hash</h3>
          <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-light/20 break-all text-cyber-text">
            {hash}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-cyber-light">Wallet Address</h3>
          <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-light/20 break-all text-cyber-text">
            {window.ethereum?.selectedAddress || 'Not connected'}
          </p>
        </div>

        {transactionHash ? (
          <div className="mt-4 bg-cyber-dark/50 border border-cyber-light/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-cyber-light mb-2">
              Blockchain Transaction Details
            </h3>
            <div className="space-y-2">
              <div>
                <h4 className="text-xs font-medium text-cyber-light/80">Network</h4>
                <p className="text-xs text-cyber-text">Polygon Mainnet</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-cyber-light/80">Block Number</h4>
                <p className="text-xs text-cyber-text">{blockNumber || 'Pending'}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-cyber-light/80">Transaction Hash</h4>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono bg-cyber-dark/70 p-2 rounded border border-cyber-light/20 break-all flex-1 text-cyber-text">
                    {transactionHash}
                  </p>
                  <a
                    href={`https://polygonscan.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-light hover:text-cyber-light/80 transition-colors"
                    title="View on PolygonScan"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
              <p className="text-xs text-cyber-light/70 mt-2">
                This document was signed on-chain. The transaction hash above can be used to verify the signature on the Polygon blockchain.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-cyber-light">Signature</h3>
            <p className="mt-1 text-xs font-mono bg-cyber-dark/50 p-2 rounded border border-cyber-light/20 break-all text-cyber-text">
              {signature}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onSignAnother}
        className="mt-6 w-full cyber-button px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
      >
        Sign Another Document
      </button>
    </div>
  );
}