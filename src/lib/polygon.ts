import { ethers } from "ethers";

// Polygon USDC (native) contract
export const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
export const USDC_DECIMALS = 6;

// Minimal ERC-20 ABI for transfer + balanceOf
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

export function getProvider() {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error("ALCHEMY_API_KEY not set");
  return new ethers.JsonRpcProvider(
    `https://polygon-mainnet.g.alchemy.com/v2/${key}`
  );
}

export function getHotWallet() {
  const pk = process.env.HOT_WALLET_PRIVATE_KEY;
  if (!pk) throw new Error("HOT_WALLET_PRIVATE_KEY not set");
  return new ethers.Wallet(pk, getProvider());
}

export function getUsdcContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);
}

/** Convert a human-readable amount (e.g. 1.50) to USDC smallest unit (1500000) */
export function toUsdcUnits(amount: number): bigint {
  return ethers.parseUnits(amount.toFixed(USDC_DECIMALS), USDC_DECIMALS);
}

/** Convert USDC smallest unit back to human-readable */
export function fromUsdcUnits(units: bigint): number {
  return Number(ethers.formatUnits(units, USDC_DECIMALS));
}

/** Send USDC from hot wallet to a destination address */
export async function sendUsdc(to: string, amount: number) {
  const wallet = getHotWallet();
  const usdc = getUsdcContract(wallet);
  const units = toUsdcUnits(amount);

  const tx = await usdc.transfer(to, units);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, gasUsed: receipt.gasUsed.toString() };
}

/** Check USDC balance of the hot wallet */
export async function getHotWalletUsdcBalance(): Promise<number> {
  const wallet = getHotWallet();
  const usdc = getUsdcContract(getProvider());
  const balance = await usdc.balanceOf(wallet.address);
  return fromUsdcUnits(balance);
}
