import { Button } from "@chakra-ui/react";
import { SessionWallet } from "algorand-session-wallet";
import algosdk from "algosdk";
import React, { useState } from "react";
import { fundAccount } from "../algorand/algorand";
import { NFT } from "../algorand/nft";
export type MinterProps = {
  activeConfig: number;
  sw: SessionWallet;
};

const Nft = (props: MinterProps) => {
  const meturl = "https://mdnft.onrender.com/getdata";
  const [createdId, setCreatedId] = useState(false);
  const [nft, setNFT] = useState<any>();
  const createNft = async () => {
    const result = await NFT.create(
      props.sw.wallet,
      props.activeConfig,
      meturl,
      "Cosmos"
    );
    console.log("nft in");
    setCreatedId(true);
    console.log({ result });
    console.log(createdId);
    if (result) {
    }

    return result;
  };

  const executeNft = async () => {
    await createNft();
    const id = localStorage.getItem("token_id");
    if (id) {
      console.log({ id });
      fundAccount(
        props.sw.wallet,
        props.activeConfig,
        algosdk.generateAccount(),
        parseInt(id)
      );
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          executeNft();
        }}
      >
        Create Nft
      </Button>
    </>
  );
};

export default Nft;
