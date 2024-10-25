import { ethers } from 'ethers';
import { generateHash, formatSignatureMessage } from './document';

export interface SigningResult {
  signature: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
const POLYGON_RPC = 'https://polygon-rpc.com';

export async function checkAndSwitchNetwork(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== POLYGON_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_CHAIN_ID }],
        });
      } catch (error: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (error.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: POLYGON_CHAIN_ID,
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: [POLYGON_RPC],
              blockExplorerUrls: ['https://polygonscan.com/']
            }]
          });
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to switch network:', error);
    throw new Error('Failed to switch to Polygon network. Please try again.');
  }
}

export async function signDocumentOnChain(
  file: File,
  walletAddress: string
): Promise<SigningResult> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    if (signer.address.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Connected wallet does not match the signing wallet');
    }

    const timestamp = Date.now();
    const hash = await generateHash(file);
    const message = formatSignatureMessage(hash, timestamp);
    
    // Create transaction with message in data field
    const tx = await signer.sendTransaction({
      to: "0x0000000000000000000000000000000000000000",
      value: BigInt(0),
      data: ethers.toUtf8Bytes(message),
      gasLimit: BigInt(100000), // Set a reasonable gas limit
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error('Transaction failed to confirm');
    }

    console.log('Transaction confirmed:', receipt);

    return {
      signature: message,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      timestamp: timestamp
    };
  } catch (error: any) {
    console.error('Blockchain signing error:', error);
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction was rejected. Please try again.');
    }
    throw new Error(error.message || 'Failed to sign document on blockchain');
  }
}

export async function verifyOnChainSignature(
  transactionHash: string
): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const tx = await provider.getTransaction(transactionHash);
    
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const receipt = await provider.getTransactionReceipt(transactionHash);
    return receipt !== null && receipt.status === 1;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}