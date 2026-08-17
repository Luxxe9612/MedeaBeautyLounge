import { CheckCircle, X, MessageCircle } from "lucide-react";

function ConfirmModal({ data, onClose }) {
  const handleWhatsApp = () => {
    if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(29, 23, 22, 0.65)",
        backdropFilter: "blur(12px)",
        animation: "modalFadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          background: "#fffaf5",
          borderRadius: "34px",
          padding: "48px",
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 30px 80px rgba(29,23,22,0.2)",
          border: "1px solid rgba(200,164,106,0.2)",
          animation: "modalSlideUp 0.4s ease",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            borderRadius: "999px",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f7efe8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
          }}
        >
          <X size={18} color="#1d1716" />
        </button>

        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(200,164,106,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <CheckCircle size={40} color="#c8a46a" />
        </div>

        <h2
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "32px",
            color: "#1d1716",
            marginBottom: "12px",
            lineHeight: "1.1",
          }}
        >
          Richiesta ricevuta
        </h2>

        <p
          style={{
            color: "#6d5e57",
            fontSize: "16px",
            lineHeight: "1.7",
            marginBottom: "28px",
          }}
        >
          Grazie <strong style={{ color: "#1d1716" }}>{data.nome}</strong>! Medea Beauty Lounge verificherà la richiesta e ti contatterà per la conferma.
        </p>

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "28px",
            textAlign: "left",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ fontSize: "13px", color: "#6d5e57", marginBottom: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
            Riepilogo prenotazione
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#1d1716", fontWeight: "800" }}>{data.tipoLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6d5e57" }}>Data:</span>
              <span style={{ fontSize: "14px", color: "#1d1716", fontWeight: "800" }}>{data.data}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6d5e57" }}>Ora:</span>
              <span style={{ fontSize: "14px", color: "#1d1716", fontWeight: "800" }}>{data.ora}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "#6d5e57" }}>Telefono:</span>
              <span style={{ fontSize: "14px", color: "#1d1716", fontWeight: "800" }}>{data.telefono}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(200,164,106,0.1)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "28px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#1d1716", lineHeight: "1.6" }}>
            {data.whatsappUrl
              ? <><strong>In alternativa:</strong> puoi aprire WhatsApp e inviare il riepilogo della richiesta.</>
              : "WhatsApp non è ancora configurato. La richiesta è stata comunque ricevuta."}
          </p>
        </div>

        {data.whatsappUrl ? <button
          onClick={handleWhatsApp}
          style={{
            width: "100%",
            padding: "18px 32px",
            borderRadius: "999px",
            border: "none",
            background: "#25D366",
            color: "white",
            fontWeight: "900",
            fontSize: "16px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(37,211,102,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <MessageCircle size={20} />
          Apri WhatsApp
        </button> : null}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px 32px",
            borderRadius: "999px",
            border: "2px solid rgba(0,0,0,0.08)",
            background: "transparent",
            color: "#6d5e57",
            fontWeight: "800",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Torna in home
        </button>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default ConfirmModal;
