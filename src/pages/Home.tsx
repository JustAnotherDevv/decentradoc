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

function Home() {
  const [jobsLoading, setJobsLoading] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docTrustedWallets, setDocTrustedWallets] = useState("");
  const { address, isConnected } = useAccount();

  const idriss = new IdrissCrypto();

  const ResolveOptions = {
    coin: null,
    network: "evm",
  };

  const [operatorList, setOperatorList] = useState([
    {
      title: "Test",
      description: "test description ",
      tags: "solidity, smart contract, audit",
      owner: "0x4444F618BA8E99435E721abF3c611D5105A407e9",
      lastModified: "Thu Dec 01 2022 16:17:07",
    },
  ]);

  const listItems = operatorList.map((i, index) => (
    <tr className="hover self-center center" key={index}>
      <td className="">{i.title}</td>
      <td className="">{i.description}</td>
      <td className="">{truncateStr(i.owner.toString(), 4)}</td>
      <td className="">{i.lastModified.toString()}</td>
      <td className="">
        <button className="btn btn-sm btn-success" onClick={() => fetchDocs()}>
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
    if (!Web3.utils.isAddress(docTrustedWallets)) {
      const resolved = await idriss.resolve(docTrustedWallets, ResolveOptions);
      if (resolved["Metamask ETH"])
        setDocTrustedWallets(resolved["Metamask ETH"]);
    }
  }

  async function fetchDocs() {
    const { Buckets } = await s3.listBuckets({}).promise();
    console.log(Buckets);

    const signature = await signMessage({
      message: "gm wagmi frens",
    });

    const signingAddress = await ethers.utils.verifyMessage(
      "gm wagmi frens",
      signature
    );

    console.log(signature + " /  " + signingAddress);

    //const data = await s3.send(
    //  new ListObjectsCommand({ Delimiter: "/", Bucket: Buckets[0].Name })
    //);

    //console.log(await s3.listObjects({ Bucket: Buckets[0] }).promise());
    console.log(await s3.listObjects({ Bucket: "document-bucket" }).promise());

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
    if (docContent == "" || docTitle == "") return;

    let file = new Blob([docContent], { type: "text/plain" });

    const params = {
      Bucket: "document-bucket",
      Key: `${address}/${docTitle}`,
      Body: file,
    };

    await s3
      .upload(params, {
        partSize: 64 * 1024 * 1024,
      })
      .promise();
  }

  function DocContainer() {
    return (
      <div className="overflow-x-auto grid place-items-center mt-20">
        <input
          type="text"
          placeholder="Title..."
          className="input input-bordered w-full max-w-xs m-5"
          onChange={(e) => setDocTitle(e.target.value)}
          value={docTitle}
        />
        <input
          type="text"
          placeholder="Doc content..."
          className="input input-bordered w-full max-w-xs m-5"
          onChange={(e) => setDocContent(e.target.value)}
          value={docContent}
        />
        <div className="w-1/2">
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
        <table className="table w-1/2 text-white">
          <thead className="bg-success">
            <tr>
              <th className="bg-transparent">Name</th>
              <th className="bg-transparent">Description</th>
              <th className="bg-transparent">Owner</th>
              <th className="bg-transparent">Last modified</th>
              <th className="bg-transparent"></th>
            </tr>
          </thead>
          <tbody>{jobsLoading ? "Loading…" : listItems}</tbody>
        </table>
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
