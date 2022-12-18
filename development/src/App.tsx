import { SessionWallet } from "algorand-session-wallet";
import { useState } from "react";
import { conf, sessionGetActiveConf } from "./algorand/config";
import Connect from "./components/Connect";

const App = () => {
  const activeConf = sessionGetActiveConf();
  const sw = new SessionWallet(conf[activeConf].network);
  const [sessionWallet, setSessionWallet] = useState(sw);
  const [accts, setAccounts] = useState(sw.accountList());
  const [connected, setConnected] = useState(sw.connected());

  function updateWallet(sw: SessionWallet) {
    setSessionWallet(sw);
    setAccounts(sw.accountList());
    setConnected(sw.connected());
  }
  return (
    <>
      <Connect
        darkMode={false}
        sessionWallet={sessionWallet}
        accts={accts}
        connected={connected}
        updateWallet={updateWallet} sw={undefined} activeConfig={function (wallet: any, activeConfig: any): unknown {
          throw new Error("Function not implemented.");
        } }      />
    </>
  );
};

export default App;
