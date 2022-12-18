type Config = {
  network: string; // The network to use for creating nfts
  storageToken: string; // The token provided by web3.storage
  ipfsGateway: string; // The IPFS gateway url for retrieving files
  algod: string; // The Algod api url to use
  blockExplorer: string; // The Block Explorer to allow linking out to
};
export const conf = require("../config.json") as Config[];
const activeConfKey = "active-conf";
export function sessionGetActiveConf(): number {
  const ac = sessionStorage.getItem(activeConfKey);
  if (ac === undefined || ac === null) return 0;
  return parseInt(ac);
}
