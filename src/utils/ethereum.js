import { ethers } from 'ethers';

let provider;

export async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            return provider;
        } catch (error) {
            throw new Error('User denied access to connect with Metamask');
        }
    } else {
        throw new Error('Metamask extension not found');
    }
}

export function getProvider() {
    if (!provider) {
        throw new Error('Wallet not connected');
    }
    return provider;
}