import { useEffect, useState } from "react";
import { truncateStr } from "../utils";
import S3, { ListObjectsCommand } from "aws-sdk/clients/s3";
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
  useAccount,
} from "wagmi";
import { IdrissCrypto } from "idriss-crypto/lib/browser";
import { Web3 } from "web3";
import { signMessage } from "@wagmi/core";
import { ethers } from "ethers";
import { Web3Modal, Web3Button } from "@web3modal/react";
import Web3Utils from "web3-utils";

function Home() {
  const [jobsLoading, setJobsLoading] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docTrustedWallets, setDocTrustedWallets] = useState("");
  const { address, isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);

  const idriss = new IdrissCrypto();

  const ResolveOptions = {
    coin: null,
    network: "evm",
  };

  const [fileList, setFileList] = useState([]);

  const listItems = fileList.map((i, index) => (
    <tr className="hover self-center center" key={index}>
      <td className="">{i.name}</td>
      <td className="">{i.lastModified.toString().substr(0, 10)}</td>
      <td className="">
        <button
          className="btn btn-sm btn-success"
          onClick={() => window.open(i.url)}
        >
          Get
        </button>
      </td>
    </tr>
  ));

  const s3 = new S3({
    accessKeyId: `${import.meta.env.VITE_ACCESS_KEY}`,
    secretAccessKey: `${import.meta.env.VITE_SECRET_KEY}`,
    endpoint: `${import.meta.env.VITE_ENDPOINT}`,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    connectTimeout: 0,
    httpOptions: { timeout: 0 },
  });

  async function ResolveIdriss() {
    if (!Web3Utils.isAddress(docTrustedWallets)) {
      const resolved = await idriss.resolve(docTrustedWallets, ResolveOptions);
      if (resolved["Metamask ETH"])
        setDocTrustedWallets(resolved["Metamask ETH"]);
    }
  }

  async function fetchDocs() {
    const { Buckets } = await s3.listBuckets({}).promise();
    console.log(Buckets);

    console.log(await s3.listObjects({ Bucket: "document-bucket" }).promise());

    if (docContent == "" || docTitle == "") return;

    const selectedObject = await s3
      .getObject({ Bucket: "document-bucket", Key: `${address}/${docTitle}` })
      .promise();

    console.log(selectedObject);

    var bytes = new Uint8Array(selectedObject); // pass your byte response to this constructor

    var blob = new Blob([selectedObject.Body], { type: "text/plain" }); // change resultByte to bytes

    const reader = new FileReader();
    await reader.readAsText(blob);

    reader.addEventListener("loadend", (e) => {
      const text = e.srcElement.result;
      console.log(text);
    });
  }

  async function uploadDoc() {
    if (
      docContent == "" ||
      docTitle == "" ||
      !Web3Utils.isAddress(docTrustedWallets)
    )
      return;

    const response = await fetch(
      `/api/upload?walletAddress=${address}&title=${docTitle}&content=${docContent}&trusted=${docTrustedWallets}`
    );
    let file = new Blob([docContent], { type: "text/plain" });

    const params = {
      Bucket: "document-bucket",
      Key: `${address}/${docTitle}.txt`,
      Body: file,
    };

    await s3
      .upload(params, {
        partSize: 64 * 1024 * 1024,
      })
      .promise();
  }

  async function verifySignature() {
    const response = await fetch(`/api/nonce?walletAddress=${address}`);

    const { nonce } = await response.json();

    if (response.status !== 200) {
      throw Error(nonce.message);
    }
    console.log(JSON.stringify(nonce));

    const signature = await signMessage({
      message: nonce,
    });

    const finalRes = await fetch(
      `/api/verify?walletAddress=${address}&signedNonce=${signature}`
    );

    const { success, docs } = await finalRes.json();

    setFileList(docs);

    console.log(JSON.stringify(success), JSON.stringify(docs));

    //const signingAddress = await ethers.utils.verifyMessage(nonce, signature);
  }

  function DocContainer() {
    return (
      <div className="overflow-x-auto grid place-items-center mt-20 mb-10">
        <label
          className="btn btn-square btn-success absolute top-20 mt-20"
          onClick={() => setShowModal(!showModal)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="currentColor"
            className="bi bi-plus"
            viewBox="0 0 16 16"
          >
            {" "}
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />{" "}
          </svg>
        </label>
        <input type="checkbox" id="my-modal-4" className="modal-toggle" />
        {!showModal ? (
          <div> </div>
        ) : (
          <div className="absolute z-40">
            <div className="modal-box relative" htmlFor="">
              <h3 className="text-lg font-bold">Add new document</h3>
              <input
                type="text"
                placeholder="Title..."
                className="input input-bordered w-full max-w-xs m-5 h-25"
                onChange={(e) => setDocTitle(e.target.value)}
                value={docTitle}
              />
              <textarea
                className="textarea textarea-bordered w-full max-w-xs m-5"
                placeholder="Document content..."
                onChange={(e) => setDocContent(e.target.value)}
                value={docContent}
              ></textarea>
              <div className="">
                <input
                  type="text"
                  placeholder="Add address (supports Idriss.xyz)"
                  className="input input-bordered w-full max-w-xs m-5"
                  onChange={(e) => setDocTrustedWallets(e.target.value)}
                  value={docTrustedWallets}
                />
                <button
                  className="btn btn-sm btn-success mb-5"
                  onClick={() => ResolveIdriss()}
                >
                  Add
                </button>
              </div>
              <button
                className="btn btn-sm btn-success mb-5"
                onClick={() => uploadDoc()}
              >
                Upload
              </button>
            </div>
          </div>
        )}

        <table className="table w-1/2 text-white">
          <thead className="bg-success">
            <tr>
              <th className="bg-transparent">Name</th>
              <th className="bg-transparent">Last modified</th>
              <th className="bg-transparent"></th>
            </tr>
          </thead>
          <tbody>{jobsLoading ? "Loading…" : listItems}</tbody>
        </table>
        {!fileList.length == 0 ? (
          <button
            className="btn btn-sm btn-success my-10"
            onClick={() => verifySignature()}
          >
            Reload
          </button>
        ) : (
          <button
            className="btn btn-sm btn-success my-10"
            onClick={() => verifySignature()}
          >
            Verify
          </button>
        )}
      </div>
    );
  }

  useEffect(() => {}, []);

  return (
    <div>
      <div className="">
        {!address ? (
          <div className="overflow-x-auto grid place-items-center mt-20">
            <p className="mb-5">Connect wallet to access documents...</p>
            <Web3Button className="" themeColor="green" />
          </div>
        ) : (
          <DocContainer />
        )}
      </div>
    </div>
  );
}

export default Home;
