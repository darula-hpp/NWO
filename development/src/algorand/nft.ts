import { Wallet } from "algorand-session-wallet";
import { CreateToken, getToken } from "./algorand";

export function ipfsURL(cid: string): string {
  return cid;
}

export class Token {
  id: number;
  name: string;
  unitName: string;
  url: any;
  metadataHash: string;
  total: number;
  decimals: number;
  creator: string;
  manager: string;
  reserve: string;
  clawback: string;
  freeze: string;
  defaultFrozen: boolean;

  constructor(t: any) {
    this.id = t.id || 0;
    this.name = t.name || "";
    this.unitName = t.unitName || "";
    this.url = t.url || "";
    this.metadataHash = t.metadataHash || "";
    this.total = t.total || 0;
    this.decimals = t.decimals || 0;
    this.creator = t.creator || "";
    this.manager = t.manager || "";
    this.reserve = t.reserve || "";
    this.clawback = t.clawback || "";
    this.freeze = t.freeze || "";
    this.defaultFrozen = t.defaultFrozen || false;
  }

  static fromParams(t: any): Token {
    const p = t.params;
    return new Token({
      id: t.index,
      name: p.name || "",
      unitName: p["unit-name"] || "",
      url: p.url || "",
      metadataHash: p["metadata-hash"] || "",
      total: p.total || 0,
      decimals: p.decimals || 0,
      creator: p.creator || "",
      manager: p.manager || "",
      reserve: p.reserve || "",
      clawback: p.clawback || "",
      freeze: p.freeze || "",
      defaultFrozen: p["default-frozen"] || false,
    }) as Token;
  }
  valid(): boolean {
    return this.id > 0 && this.total > 0 && this.url !== "";
  }
}

export class NFT {
  token: Token = new Token({});
  constructor(token: Token) {
    this.token = token;
  }

  static async create(
    wallet: Wallet,
    activeConf: number,
    cid: string,
    certname: string
  ): Promise<NFT> {
    console.log("Called");
    console.log({ cid })
    console.log(activeConf)
    console.log(certname)
    console.log(wallet)
    const asset_id = await CreateToken(
      wallet,
      activeConf,
      ipfsURL(cid),
      certname
    );
    console.log("AssetID: " + asset_id);
    localStorage.setItem("token_id", asset_id.toString());
    localStorage.token_id = asset_id.toString();
    return await NFT.fromAssetId(activeConf, asset_id);
  }

  static async fromAssetId(activeConf: number, assetId: number): Promise<NFT> {
    return await getToken(activeConf, assetId);
  }
}
