import { useState } from "react";
import { Web3Modal, Web3Button } from "@web3modal/react";
import { truncateStr } from "../../utils";
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
  useAccount,
} from "wagmi";

function Navbar() {
  const { address, isConnected } = useAccount();
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">DecentraDoc</a>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal p-0">
          <li>
            <a>Home</a>
          </li>
          <li tabIndex={0}>
            <a>
              Docs
              <svg
                className="fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
              </svg>
            </a>
            <ul className="p-2 bg-base-100">
              <li>
                <a>Submenu 1</a>
              </li>
              <li>
                <a>Submenu 2</a>
              </li>
            </ul>
          </li>
          <li>
            {!address ? (
              <p>Loading profile...</p>
            ) : (
              <a>{truncateStr(address.toString(), 4)}</a>
            )}
          </li>
          <li>
            <Web3Button className="" themeColor="green" />
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
