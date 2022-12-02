import { useState } from "react";
import logo from "./logo.svg";
import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/layout/Navbar";
import FooterContent from "./components/layout/FooterContent";
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";

import { Web3Modal, Web3Button } from "@web3modal/react";

import { useConnected, ConnectButton, useConnectModal } from "@web3modal/react";

import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
  useAccount,
} from "wagmi";
import Home from "./pages/Home";
import Web3 from "web3";

function App() {
  const chains = [chain.goerli];

  // Wagmi client
  const { provider } = configureChains(chains, [
    walletConnectProvider({
      projectId: `${import.meta.env.VITE_WALLECT_CONNECT_PROJECT_ID}`,
      themeColor: "green",
    }),
  ]);
  const wagmiClient = createClient({
    autoConnect: true,
    connectors: modalConnectors({ appName: "web3Modal", chains }),
    provider,
  });

  // Web3Modal Ethereum Client
  const ethereumClient = new EthereumClient(wagmiClient, chains);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/test",
      element: <div>Hello world!</div>,
    },
  ]);

  return (
    <div className="App">
      <Web3Modal
        projectId={`${import.meta.env.VITE_WALLECT_CONNECT_PROJECT_ID}`}
        themeColor="green"
        themeBackground="themeColor"
        ethereumClient={ethereumClient}
      />
      <WagmiConfig client={wagmiClient}>
        <div className="flex flex-col h-screen justify-between">
          <Navbar />
          <main className="">
            <RouterProvider router={router} />
          </main>
          <FooterContent />
        </div>
      </WagmiConfig>
    </div>
  );
}

export default App;
