import CryptoJS from 'crypto-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { getDocument, storeDocument } from '../services/db';
import type { StoredDocument } from '../services/db';
import type { SigningResult } from './blockchain';
import { ethers } from 'ethers';

const POLYGON_RPC = 'https://polygon-rpc.com';

// Use a cryptographically secure random salt for each session
const SALT = crypto.getRandomValues(new Uint8Array(32));

// Generate hash for original document
export async function generateHash(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    
    // Create a salted hash using HMAC-SHA256
    const hmacHash = CryptoJS.HmacSHA256(wordArray, CryptoJS.lib.WordArray.create(SALT));
    
    // Double hash for additional security
    return CryptoJS.SHA256(hmacHash).toString();
  } catch (error) {
    console.error('Error generating hash:', error);
    throw new Error('Failed to generate document hash');
  }
}

// Format the signature message
export function formatSignatureMessage(hash: string, timestamp: number): string {
  return `By signing this document, I hereby confirm that I have read and understand its content, consent to use electronic records and electronic signatures, and agree to be legally bound by its terms.

Timestamp: ${new Date(timestamp).toISOString()}

Original document hash: ${hash}`;
}

// Generate the final signed PDF with embedded signature page
export async function generateSignedPDF(
  originalFile: File,
  signature: string,
  walletAddress: string,
  transactionHash?: string,
  blockNumber?: number,
  timestamp?: number
): Promise<{ pdfBytes: Uint8Array; finalHash: string }> {
  try {
    const originalArrayBuffer = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(originalArrayBuffer);
    
    const protocolPage = pdfDoc.addPage();
    const { width, height } = protocolPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    protocolPage.drawRectangle({
      x: 40,
      y: height - 80,
      width: width - 80,
      height: 50,
      color: rgb(0.95, 0.97, 1)
    });
    
    protocolPage.drawText('DIGITAL SIGNATURE PROTOCOL', {
      x: 50,
      y: height - 50,
      size: 24,
      font,
      color: rgb(0.25, 0.53, 0.96)
    });

    protocolPage.drawText('Signed via WalletSign (walletsign.io)', {
      x: 50,
      y: height - 110,
      size: 14,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4)
    });

    const signTime = timestamp ? new Date(timestamp) : new Date();
    const utcTimestamp = signTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    
    const details = [
      { label: "Signer's Wallet Address:", value: walletAddress },
      { label: 'Signature Timestamp:', value: utcTimestamp },
      { label: 'Original Document Hash:', value: await generateHash(originalFile) }
    ];

    if (transactionHash) {
      details.push(
        { label: 'Transaction Hash:', value: transactionHash },
        { label: 'Network:', value: 'Polygon Mainnet' },
        { label: 'Block Number:', value: blockNumber?.toString() || 'Pending' }
      );

      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
      try {
        const tx = await provider.getTransaction(transactionHash);
        if (tx?.data) {
          details.push({
            label: 'Transaction Data:',
            value: ethers.toUtf8String(tx.data)
          });
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      }
    }

    let yPosition = height - 170;
    for (const detail of details) {
      protocolPage.drawText(detail.label, {
        x: 50,
        y: yPosition,
        size: 14,
        font,
        color: rgb(0.25, 0.53, 0.96)
      });

      const frameY = yPosition - 35;
      protocolPage.drawRectangle({
        x: 50,
        y: frameY,
        width: width - 100,
        height: 30,
        borderColor: rgb(0.25, 0.53, 0.96),
        borderWidth: 1,
        color: rgb(1, 1, 1)
      });

      const maxWidth = width - 120;
      const words = detail.value.split(' ');
      let line = '';
      let lineY = frameY + 8;

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const textWidth = regularFont.widthOfTextAtSize(testLine, 12);

        if (textWidth > maxWidth && line) {
          protocolPage.drawText(line, {
            x: 60,
            y: lineY,
            size: 12,
            font: regularFont,
            color: rgb(0, 0, 0)
          });
          line = word;
          lineY -= 15;
        } else {
          line = testLine;
        }
      }

      if (line) {
        protocolPage.drawText(line, {
          x: 60,
          y: lineY,
          size: 12,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
      }

      yPosition = frameY - 40;
    }

    const instructionsY = 100;
    protocolPage.drawText('Verification Instructions:', {
      x: 50,
      y: instructionsY,
      size: 14,
      font,
      color: rgb(0.25, 0.53, 0.96)
    });

    const instructions = [
      'To verify this document, visit walletsign.io and use the verification tool.',
      'Upload this complete PDF file (including this signature protocol page). The',
      'platform will verify the document\'s authenticity and display all signature',
      'details.'
    ];

    instructions.forEach((line, index) => {
      protocolPage.drawText(line, {
        x: 50,
        y: instructionsY - 25 - (index * 20),
        size: 12,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4)
      });
    });

    const pdfBytes = await pdfDoc.save();
    
    // Generate final hash of the complete signed document using HMAC-SHA256
    const finalWordArray = CryptoJS.lib.WordArray.create(pdfBytes);
    const hmacHash = CryptoJS.HmacSHA256(finalWordArray, CryptoJS.lib.WordArray.create(SALT));
    const finalHash = CryptoJS.SHA256(hmacHash).toString();

    await storeDocument({
      signedHash: finalHash,
      originalHash: await generateHash(originalFile),
      signature,
      walletAddress,
      timestamp: signTime.toISOString(),
      transactionHash,
      blockNumber: blockNumber?.toString(),
      networkId: transactionHash ? '0x89' : undefined
    });

    return { pdfBytes, finalHash };
  } catch (error) {
    console.error('Error generating signed PDF:', error);
    throw new Error('Failed to generate signed PDF document');
  }
}

// Verify the document's authenticity
export async function verifyDocument(file: File): Promise<{
  isVerified: boolean;
  details?: StoredDocument;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    
    // Generate verification hash using the same method as signing
    const hmacHash = CryptoJS.HmacSHA256(wordArray, CryptoJS.lib.WordArray.create(SALT));
    const verificationHash = CryptoJS.SHA256(hmacHash).toString();

    const storedDoc = await getDocument(verificationHash);

    if (!storedDoc) {
      return {
        isVerified: false,
        error: 'Document not found in our records. Please ensure this is a complete WalletSign-generated document.',
      };
    }

    if (storedDoc.transactionHash) {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
      const tx = await provider.getTransaction(storedDoc.transactionHash);
      
      if (!tx) {
        return {
          isVerified: false,
          error: 'Transaction not found on blockchain. The document might be tampered with.',
        };
      }

      const txData = ethers.toUtf8String(tx.data);
      if (!txData.includes(storedDoc.originalHash)) {
        return {
          isVerified: false,
          error: 'Transaction data mismatch. The document might be tampered with.',
        };
      }

      const receipt = await provider.getTransactionReceipt(storedDoc.transactionHash);
      if (!receipt || receipt.status !== 1) {
        return {
          isVerified: false,
          error: 'Transaction failed or was reverted on the blockchain.',
        };
      }
    }

    return {
      isVerified: true,
      details: storedDoc,
    };
  } catch (error) {
    console.error('Error verifying document:', error);
    return {
      isVerified: false,
      error: 'Failed to verify document. Please try again.',
    };
  }
}