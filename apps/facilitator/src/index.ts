import { base58 } from "@scure/base";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { x402Facilitator } from "@x402/core/facilitator";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from "@x402/core/types";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { toFacilitatorSvmSigner } from "@x402/svm";
import { ExactSvmScheme } from "@x402/svm/exact/facilitator";
import dotenv from "dotenv";
import express from "express";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

dotenv.config();

// Configuration
const PORT = process.env.PORT || "4022";

// Validate required environment variables
if (!process.env.EVM_PRIVATE_KEY) {
  console.error("❌ EVM_PRIVATE_KEY environment variable is required");
  process.exit(1);
}
if (!process.env.SVM_PRIVATE_KEY) {
  console.error("❌ SVM_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

// Initialize the EVM account from private key
const evmAccount = privateKeyToAccount(
  process.env.EVM_PRIVATE_KEY as `0x${string}`,
);
console.info(`⚡ EVM facilitator wallet: ${evmAccount.address}`);

// Initialize the SVM account from private key
const svmAccount = await createKeyPairSignerFromBytes(
  base58.decode(process.env.SVM_PRIVATE_KEY as string),
);
console.info(`⚡ SVM facilitator wallet: ${svmAccount.address}`);

// Create viem clients for both Base mainnet and Base Sepolia
const baseMainnetClient = createWalletClient({
  account: evmAccount,
  chain: base,
  transport: http("https://mainnet.base.org"),
}).extend(publicActions);

const baseSepoliaClient = createWalletClient({
  account: evmAccount,
  chain: baseSepolia,
  transport: http(),
}).extend(publicActions);

// Helper to create an EVM signer from a viem client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createEvmSigner(client: any) {
  return toFacilitatorEvmSigner({
    getCode: (args: { address: `0x${string}` }) => client.getCode(args),
    address: evmAccount.address,
    readContract: (args: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
    }) =>
      client.readContract({
        ...args,
        args: args.args || [],
      }),
    verifyTypedData: (args: {
      address: `0x${string}`;
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
      signature: `0x${string}`;
    }) => client.verifyTypedData(args as Parameters<typeof client.verifyTypedData>[0]),
    writeContract: (args: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args: readonly unknown[];
    }) =>
      client.writeContract({
        ...args,
        args: args.args || [],
      }),
    sendTransaction: (args: { to: `0x${string}`; data: `0x${string}` }) =>
      client.sendTransaction(args),
    waitForTransactionReceipt: (args: { hash: `0x${string}` }) =>
      client.waitForTransactionReceipt(args),
  });
}

const mainnetSigner = createEvmSigner(baseMainnetClient);
const sepoliaSigner = createEvmSigner(baseSepoliaClient);

// SVM signer handles all Solana networks with automatic RPC creation
const svmSigner = toFacilitatorSvmSigner(svmAccount);

// Initialize the x402 Facilitator with lifecycle hooks
const facilitator = new x402Facilitator()
  .onBeforeVerify(async (context) => {
    console.log(`[verify:before] network=${context.requirements?.network}`);
  })
  .onAfterVerify(async (context) => {
    console.log(`[verify:after] valid=${context.result?.isValid}`);
  })
  .onVerifyFailure(async (context) => {
    console.error(`[verify:failure]`, context.error);
  })
  .onBeforeSettle(async (context) => {
    console.log(`[settle:before] network=${context.requirements?.network}`);
  })
  .onAfterSettle(async (context) => {
    console.log(`[settle:after] success=${context.result?.success} tx=${context.result?.transaction}`);
  })
  .onSettleFailure(async (context) => {
    console.error(`[settle:failure]`, context.error);
  });

// Register EVM networks (Base mainnet + Sepolia)
facilitator.register(
  "eip155:8453",
  new ExactEvmScheme(mainnetSigner, { deployERC4337WithEIP6492: true }),
);
facilitator.register(
  "eip155:84532",
  new ExactEvmScheme(sepoliaSigner, { deployERC4337WithEIP6492: true }),
);

// Register SVM networks (Solana mainnet + devnet)
facilitator.register(
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  new ExactSvmScheme(svmSigner),
);
facilitator.register(
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  new ExactSvmScheme(svmSigner),
);

console.info("✅ Registered networks:");
console.info("   EVM:  eip155:8453 (Base), eip155:84532 (Base Sepolia)");
console.info("   SVM:  solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp (mainnet), solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1 (devnet)");

// Initialize Express app
const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    wallet: evmAccount.address,
    networks: [
      "eip155:8453",
      "eip155:84532",
      "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    ],
    uptime: process.uptime(),
  });
});

// GET /supported — list supported schemes/networks
app.get("/supported", async (_req, res) => {
  try {
    const response = facilitator.getSupported();
    res.json(response);
  } catch (error) {
    console.error("Supported error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /verify — verify a payment payload
app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body as {
      paymentPayload: PaymentPayload;
      paymentRequirements: PaymentRequirements;
    };

    if (!paymentPayload || !paymentRequirements) {
      res.status(400).json({
        error: "Missing paymentPayload or paymentRequirements",
      });
      return;
    }

    const response: VerifyResponse = await facilitator.verify(
      paymentPayload,
      paymentRequirements,
    );

    res.json(response);
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /settle — settle payment on-chain
app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    if (!paymentPayload || !paymentRequirements) {
      res.status(400).json({
        error: "Missing paymentPayload or paymentRequirements",
      });
      return;
    }

    const response: SettleResponse = await facilitator.settle(
      paymentPayload as PaymentPayload,
      paymentRequirements as PaymentRequirements,
    );

    res.json(response);
  } catch (error) {
    console.error("Settle error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Settlement aborted:")
    ) {
      res.json({
        success: false,
        errorReason: error.message.replace("Settlement aborted: ", ""),
        network: req.body?.paymentPayload?.network || "unknown",
      } as SettleResponse);
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the server
app.listen(parseInt(PORT), () => {
  console.log(`🚀 Facilitator listening on http://localhost:${PORT}`);
});
