import { useState } from "react";
import { ethers } from "ethers";
import DatasetRegistry from "./DatasetRegistry.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tokens, setTokens] = useState(0);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Installe MetaMask !");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);
      const c = new ethers.Contract(CONTRACT_ADDRESS, DatasetRegistry.abi, signer);
      setContract(c);
      await loadDatasets(c);
      await loadTokens(c, addr);
    } catch (e) {
      alert("Erreur connexion: " + e.message);
    }
  };

  const loadDatasets = async (c) => {
    try {
      const count = await c.datasetCount();
      const list = [];
      for (let i = 1; i <= Number(count); i++) {
        const d = await c.getDataset(i);
        const avg = await c.getAverageRating(i);
        list.push({
          id: Number(d[0]), name: d[1], description: d[2],
          owner: d[3], ratingCount: Number(d[5]), average: Number(avg)
        });
      }
      setDatasets(list);
    } catch (e) {
      console.error("Erreur chargement datasets:", e);
    }
  };

  const loadTokens = async (c, addr) => {
    try {
      const t = await c.tokenBalance(addr);
      setTokens(Number(t));
    } catch (e) {
      console.error("Erreur chargement tokens:", e);
    }
  };

  const addDataset = async () => {
    if (!name || !description) return alert("Remplis tous les champs !");
    try {
      setLoading(true);
      const tx = await contract.addDataset(name, description);
      await tx.wait();
      setName("");
      setDescription("");
      await loadDatasets(contract);
    } catch (e) {
      alert("Erreur: " + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const rateDataset = async (id) => {
    const rating = ratings[id];
    if (!rating) return alert("Choisis une note !");
    try {
      setLoading(true);
      const tx = await contract.rateDataset(id, rating);
      await tx.wait();
      await loadDatasets(contract);
      await loadTokens(contract, account);
    } catch (e) {
      alert("Erreur: " + (e.reason || "Déjà noté ?"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "Arial" }}>
      <h1>🔗 Plateforme de Certification de Datasets</h1>

      {!account ? (
        <button onClick={connectWallet} style={btnStyle("#3498db")}>
          🦊 Connecter MetaMask
        </button>
      ) : (
        <>
          <div style={cardStyle}>
            <p>✅ <b>Compte :</b> {account}</p>
            <p>🪙 <b>Tokens :</b> {tokens}</p>
          </div>

          <div style={cardStyle}>
            <h2>➕ Ajouter un Dataset</h2>
            <input placeholder="Nom du dataset" value={name}
              onChange={e => setName(e.target.value)} style={inputStyle} />
            <input placeholder="Description" value={description}
              onChange={e => setDescription(e.target.value)} style={inputStyle} />
            <button onClick={addDataset} disabled={loading} style={btnStyle("#2ecc71")}>
              {loading ? "En cours..." : "Ajouter"}
            </button>
          </div>

          <h2>📋 Datasets disponibles</h2>
          {datasets.length === 0 && <p>Aucun dataset pour l'instant.</p>}
          {datasets.map(d => (
            <div key={d.id} style={cardStyle}>
              <h3>#{d.id} — {d.name}</h3>
              <p>{d.description}</p>
              <p>👤 {d.owner.slice(0,10)}...</p>
              <p>⭐ Moyenne : {d.ratingCount > 0 ? d.average + "/5" : "Pas encore noté"} ({d.ratingCount} vote{d.ratingCount > 1 ? "s" : ""})</p>
              <select onChange={e => setRatings({...ratings, [d.id]: Number(e.target.value)})}>
                <option value="">-- Choisir une note --</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
              </select>
              <button onClick={() => rateDataset(d.id)} disabled={loading}
                style={{...btnStyle("#e67e22"), marginLeft: 10}}>
                {loading ? "..." : "Noter (+10 tokens)"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const cardStyle = { background: "#f5f5f5", borderRadius: 8, padding: 16, marginBottom: 16 };
const inputStyle = { display: "block", width: "100%", padding: 8, marginBottom: 8, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box" };
const btnStyle = (color) => ({ background: color, color: "white", border: "none", padding: "10px 20px", borderRadius: 4, cursor: "pointer", fontSize: 14 });

export default App;
