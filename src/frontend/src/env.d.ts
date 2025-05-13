/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DONATION_TOKEN_ADDRESS: string;
  readonly VITE_LIMITED_DONATION_ADDRESS: string;
  readonly VITE_TOKEN_FAUCET_ADDRESS: string;
  readonly VITE_KRNL_ENTRY_ID: string;
  readonly VITE_KRNL_ACCESS_TOKEN: string;
  readonly VITE_TRANSACTION_LIMIT_KERNEL_ID: string;
  readonly VITE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 