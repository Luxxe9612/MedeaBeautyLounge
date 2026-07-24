import { useCallback, useEffect, useState } from "react";
import { db, storage } from "../firebase";
import { useAuth } from "../auth/auth-context";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

async function getGalleryItems() {
  const galleryQuery = query(
    collection(db, "gallery"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(galleryQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function getBeforeAfterItems() {
  const beforeAfterQuery = query(
    collection(db, "beforeAfter"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(beforeAfterQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export default function AdminMedea() {
  const { user, logout } = useAuth();

  const [gallery, setGallery] = useState([]);
  const [beforeAfter, setBeforeAfter] = useState([]);
  const [loading, setLoading] = useState(false);

  const [baTitle, setBaTitle] = useState("");
  const [baDescription, setBaDescription] = useState("");
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);

  const loadGallery = useCallback(async () => {
    setGallery(await getGalleryItems());
  }, []);

  const loadBeforeAfter = useCallback(async () => {
    setBeforeAfter(await getBeforeAfterItems());
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAdminContent() {
      try {
        const [galleryItems, beforeAfterItems] = await Promise.all([
          getGalleryItems(),
          getBeforeAfterItems(),
        ]);

        if (active) {
          setGallery(galleryItems);
          setBeforeAfter(beforeAfterItems);
        }
      } catch (error) {
        console.error("Errore durante il caricamento dei contenuti admin.", error);
      }
    }

    void loadAdminContent();

    return () => {
      active = false;
    };
  }, []);

  const uploadImage = async (file, folder) => {
    const safeName = file.name.replaceAll(" ", "-").toLowerCase();
    const path = `${folder}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, path);

    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);

    return { url, path };
  };

  const addGalleryImages = async (files) => {
    if (!files || files.length === 0) return;

    setLoading(true);

    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadImage(file, "gallery");

        await addDoc(collection(db, "gallery"), {
          src: uploaded.url,
          storagePath: uploaded.path,
          title: file.name,
          createdAt: serverTimestamp(),
        });
      }

      await loadGallery();
      alert("Foto Gallery caricate correttamente.");
    } catch (error) {
      console.error(error);
      alert("Errore durante il caricamento delle foto. Controlla regole Storage/Firestore.");
    } finally {
      setLoading(false);
    }
  };

  const addBeforeAfter = async (e) => {
    e.preventDefault();

    if (!baTitle || !beforeFile || !afterFile) {
      alert("Inserisci titolo, foto prima e foto dopo");
      return;
    }

    setLoading(true);

    try {
      const before = await uploadImage(beforeFile, "before-after");
      const after = await uploadImage(afterFile, "before-after");

      await addDoc(collection(db, "beforeAfter"), {
        title: baTitle,
        description: baDescription,
        before: before.url,
        after: after.url,
        beforePath: before.path,
        afterPath: after.path,
        createdAt: serverTimestamp(),
      });

      setBaTitle("");
      setBaDescription("");
      setBeforeFile(null);
      setAfterFile(null);
      e.target.reset();

      await loadBeforeAfter();
      alert("Prima/Dopo aggiunto correttamente.");
    } catch (error) {
      console.error(error);
      alert("Errore durante il caricamento del Prima/Dopo. Controlla regole Storage/Firestore.");
    } finally {
      setLoading(false);
    }
  };

  const removeGallery = async (item) => {
    if (!confirm("Eliminare questa foto dalla Gallery?")) return;

    try {
      await deleteDoc(doc(db, "gallery", item.id));
      if (item.storagePath) await deleteObject(ref(storage, item.storagePath)).catch(() => {});
      await loadGallery();
    } catch (error) {
      console.error(error);
      alert("Errore durante l'eliminazione.");
    }
  };

  const removeBeforeAfter = async (item) => {
    if (!confirm("Eliminare questo Prima/Dopo?")) return;

    try {
      await deleteDoc(doc(db, "beforeAfter", item.id));
      if (item.beforePath) await deleteObject(ref(storage, item.beforePath)).catch(() => {});
      if (item.afterPath) await deleteObject(ref(storage, item.afterPath)).catch(() => {});
      await loadBeforeAfter();
    } catch (error) {
      console.error(error);
      alert("Errore durante l'eliminazione.");
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Pannello Admin</p>
          <h1 style={styles.title}>Gestione Medea</h1>
          <p style={styles.text}>Accesso: {user.email}</p>
        </div>

        <button onClick={logout} style={styles.darkButton}>Logout</button>
      </div>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Gallery</h2>
        <p style={styles.text}>Carica una o più foto. Appariranno nella pagina Gallery per tutti i visitatori.</p>

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={loading}
          onChange={(e) => addGalleryImages(e.target.files)}
          style={styles.input}
        />

        {loading && <p style={styles.text}>Caricamento in corso...</p>}

        <div style={styles.grid}>
          {gallery.map((item) => (
            <div key={item.id} style={styles.previewCard}>
              <img src={item.src} alt={item.title} style={styles.previewImg} />
              <button onClick={() => removeGallery(item)} style={styles.removeButton}>Elimina</button>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Prima e Dopo</h2>
        <p style={styles.text}>Aggiungi coppie di immagini Prima/Dopo per la Home.</p>

        <form onSubmit={addBeforeAfter} style={styles.formGrid}>
          <input
            type="text"
            placeholder="Titolo es. Trattamento viso"
            value={baTitle}
            onChange={(e) => setBaTitle(e.target.value)}
            style={styles.input}
          />

          <textarea
            placeholder="Descrizione breve"
            value={baDescription}
            onChange={(e) => setBaDescription(e.target.value)}
            style={{ ...styles.input, minHeight: "110px" }}
          />

          <label style={styles.label}>Foto Prima</label>
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(e) => setBeforeFile(e.target.files[0])}
            style={styles.input}
          />

          <label style={styles.label}>Foto Dopo</label>
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(e) => setAfterFile(e.target.files[0])}
            style={styles.input}
          />

          <button disabled={loading} style={styles.button}>
            {loading ? "Caricamento..." : "Aggiungi Prima/Dopo"}
          </button>
        </form>

        <div style={styles.grid}>
          {beforeAfter.map((item) => (
            <div key={item.id} style={styles.previewCard}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <img src={item.before} alt="Prima" style={styles.previewImg} />
                <img src={item.after} alt="Dopo" style={styles.previewImg} />
              </div>

              <h3>{item.title}</h3>
              <button onClick={() => removeBeforeAfter(item)} style={styles.removeButton}>Elimina</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f7f4f1", padding: "48px 24px", color: "#1d1716" },
  header: { maxWidth: "1200px", margin: "0 auto 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" },
  card: { maxWidth: "1200px", margin: "0 auto 32px", background: "#fffaf5", padding: "34px", borderRadius: "32px", boxShadow: "0 20px 60px rgba(29,23,22,0.08)" },
  title: { fontFamily: "Georgia, serif", fontSize: "48px", margin: "0 0 14px" },
  sectionTitle: { fontFamily: "Georgia, serif", fontSize: "34px", margin: "0 0 10px" },
  kicker: { color: "#736357", textTransform: "uppercase", letterSpacing: "4px", fontWeight: "900" },
  text: { color: "#6d5e57", lineHeight: 1.7 },
  input: { width: "100%", padding: "16px 18px", borderRadius: "16px", border: "1px solid rgba(115,99,87,0.2)", margin: "10px 0 18px", fontSize: "16px" },
  label: { fontWeight: "900", color: "#736357" },
  button: { background: "#736357", color: "#fff", border: "none", borderRadius: "999px", padding: "16px 28px", fontWeight: "900", cursor: "pointer" },
  darkButton: { background: "#1d1716", color: "#fff", border: "none", borderRadius: "999px", padding: "14px 24px", fontWeight: "900", cursor: "pointer" },
  formGrid: { display: "grid", gap: "6px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginTop: "24px" },
  previewCard: { background: "#f7f4f1", padding: "14px", borderRadius: "22px", border: "1px solid rgba(115,99,87,0.16)" },
  previewImg: { width: "100%", height: "180px", objectFit: "cover", borderRadius: "16px" },
  removeButton: { marginTop: "12px", background: "#1d1716", color: "#fff", border: "none", borderRadius: "999px", padding: "10px 16px", fontWeight: "900", cursor: "pointer" },
};
