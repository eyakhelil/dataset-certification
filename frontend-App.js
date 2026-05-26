import { useState } from "react";
import { ethers } from "ethers";
import DatasetRegistry from "./DatasetRegistry.json";

const CONTRACT_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tokens, setTokens] = useState(0);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Visiteur");
  const [assignAddr, setAssignAddr] = useState("");
  const [assignRole, setAssignRole] = useState("1");

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
      await loadRole(c, addr);
    } catch (e) {
      alert("Erreur connexion: " + e.message);
    }
  };

  const loadRole = async (c, addr) => {
    try {
      const r = await c.getRole(addr);
      setRole(r);
    } catch (e) {
      console.error("Erreur role:", e);
    }
  };

  const loadDatasets = async (c) => {
    try {
      const count = await c.datasetCount();
      const list = [];
      for (let i = 1; i <= Number(count); i++) {
        const d = await c.getDataset(i);
        if (d[6]) {
          const avg = await c.getAverageRating(i);
          list.push({
            id: Number(d[0]), name: d[1], description: d[2],
            owner: d[3], ratingCount: Number(d[5]), average: Number(avg)
          });
        }
      }
      setDatasets(list);
    } catch (e) {
      console.error("Erreur datasets:", e);
    }
  };

  const loadTokens = async (c, addr) => {
    try {
      const t = await c.tokenBalance(addr);
      setTokens(Number(t));
    } catch (e) {
      console.error("Erreur tokens:", e);
    }
  };

  const addDataset = async () => {
    if (!name || !description) return alert("Remplis tous les champs !");
    try {
      setLoading(true);
      const tx = await contract.addDataset(name, description);
      await tx.wait();
      setName(""); setDescription("");
      await loadDatasets(contract);
    } catch (e) {
      alert("Erreur: " + (e.reason || e.message));
    } finally { setLoading(false); }
  };

  const deleteDataset = async (id) => {
    try {
      setLoading(true);
      const tx = await contract.deleteDataset(id);
      await tx.wait();
      await loadDatasets(contract);
    } catch (e) {
      alert("Erreur: " + (e.reason || e.message));
    } finally { setLoading(false); }
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
      alert("Erreur: " + (e.reason || "Deja note ?"));
    } finally { setLoading(false); }
  };

  const handleAssignRole = async () => {
    if (!assignAddr) return alert("Entre une adresse !");
    try {
      setLoading(true);
      const tx = await contract.assignRole(assignAddr, Number(assignRole));
      await tx.wait();
      alert("Role assigne avec succes !");
      setAssignAddr("");
    } catch (e) {
      alert("Erreur: " + (e.reason || e.message));
    } finally { setLoading(false); }
  };

  const roleBadge = (r) => {
    const colors = { Admin: "#e74c3c", Evaluateur: "#3498db", Visiteur: "#95a5a6" };
    return (
      <span style={{ background: colors[r] || "#95a5a6", color: "white",
        padding: "2px 10px", borderRadius: 12, fontSize: 13, fontWeight: "bold" }}>
        {r}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 850, margin: "0 auto", padding: 20, fontFamily: "Arial" }}>
      <h1>🔗 Plateforme de Certification de Datasets</h1>

      {!account ? (
        <button onClick={connectWallet} style={btnStyle("#3498db")}>
          🦊 Connecter MetaMask
        </button>
      ) : (
        <>
          {/* INFO COMPTE */}
          <div style={cardStyle}>
            <p>✅ <b>Compte :</b> {account}</p>
            <p>🪙 <b>Tokens :</b> {tokens}</p>
            <p>🔑 <b>Rôle :</b> {roleBadge(role)}</p>
          </div>

          {/* ADMIN - GESTION DES ROLES */}
          {role === "Admin" && (
            <div style={{...cardStyle, border: "2px solid #e74c3c"}}>
              <h2>👑 Gestion des Rôles (Admin)</h2>
              <input placeholder="Adresse du compte (0x...)" value={assignAddr}
                onChange={e => setAssignAddr(e.target.value)} style={inputStyle} />
              <select value={assignRole} onChange={e => setAssignRole(e.target.value)}
                style={{ padding: 8, marginBottom: 8, borderRadius: 4, border: "1px solid #ccc", marginRight: 10 }}>
                <option value="0">Visiteur</option>
                <option value="1">Evaluateur</option>
                <option value="2">Admin</option>
              </select>
              <button onClick={handleAssignRole} disabled={loading} style={btnStyle("#e74c3c")}>
                {loading ? "..." : "Assigner le rôle"}
              </button>
            </div>
          )}

          {/* ADMIN - AJOUTER DATASET */}
          {role === "Admin" && (
            <div style={{...cardStyle, border: "2px solid #2ecc71"}}>
              <h2>➕ Ajouter un Dataset (Admin)</h2>
              <input placeholder="Nom du dataset" value={name}
                onChange={e => setName(e.target.value)} style={inputStyle} />
              <input placeholder="Description" value={description}
                onChange={e => setDescription(e.target.value)} style={inputStyle} />
              <button onClick={addDataset} disabled={loading} style={btnStyle("#2ecc71")}>
                {loading ? "En cours..." : "Ajouter"}
              </button>
            </div>
          )}

          {/* LISTE DES DATASETS */}
          <h2>📋 Datasets disponibles</h2>
          {datasets.length === 0 && <p>Aucun dataset pour l'instant.</p>}
          {datasets.map(d => (
            <div key={d.id} style={cardStyle}>
              <h3>#{d.id} — {d.name}</h3>
              <p>{d.description}</p>
              <p>👤 {d.owner.slice(0,10)}...</p>
              <p>⭐ Moyenne : {d.ratingCount > 0 ? d.average + "/5" : "Pas encore noté"}
                ({d.ratingCount} vote{d.ratingCount > 1 ? "s" : ""})</p>

              {/* NOTATION - Evaluateur et Admin */}
              {(role === "Evaluateur" || role === "Admin") && (
                <div style={{ marginTop: 8 }}>
                  <select onChange={e => setRatings({...ratings, [d.id]: Number(e.target.value)})}>
                    <option value="">-- Choisir une note --</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
                  </select>
                  <button onClick={() => rateDataset(d.id)} disabled={loading}
                    style={{...btnStyle("#e67e22"), marginLeft: 10}}>
                    {loading ? "..." : "Noter (+10 tokens)"}
                  </button>
                </div>
              )}

              {/* SUPPRIMER - Admin seulement */}
              {role === "Admin" && (
                <button onClick={() => deleteDataset(d.id)} disabled={loading}
                  style={{...btnStyle("#e74c3c"), marginTop: 8}}>
                  🗑️ Supprimer
                </button>
              )}

              {/* VISITEUR */}
              {role === "Visiteur" && (
                <p style={{ color: "#95a5a6", fontSize: 13 }}>
                  👁️ Mode lecture seule — Contactez l'admin pour obtenir le rôle Evaluateur
                </p>
              )}
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
