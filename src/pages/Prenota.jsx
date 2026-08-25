import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BookingForm from "../components/BookingForm";
import ConfirmModal from "../components/ConfirmModal";

function Prenota() {
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const navigate = useNavigate();

  const handleBookingSubmit = (data) => {
    setBookingData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/");
  };

  return (
    <div className="site" style={{ background: "#f7efe8", minHeight: "100vh" }}>
      {/* Navbar semplice */}
      <nav
        style={{
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "transparent",
            border: "1px solid #c8a46a",
            color: "#1d1716",
            padding: "12px 24px",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: "800",
            fontSize: "14px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c8a46a";
            e.currentTarget.style.color = "#1d1716";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#1d1716";
          }}
        >
          <ArrowLeft size={18} />
          Torna in home
        </button>
      </nav>

      {/* Hero form */}
      <section
        style={{
          maxWidth: "800px",
          margin: "40px auto",
          padding: "0 32px",
          textAlign: "center",
        }}
      >

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: "1",
            color: "#1d1716",
            marginBottom: "16px",
          }}
        >
          Prenota la tua esperienza beauty
        </h1>

        <p
          style={{
            fontSize: "19px",
            color: "#6d5e57",
            lineHeight: "1.7",
            maxWidth: "560px",
            margin: "0 auto 50px",
          }}
        >
          Compila il form per richiedere un appuntamento. Riceverai la conferma dopo la verifica di Medea; WhatsApp resta facoltativo.
        </p>

        <BookingForm onSubmit={handleBookingSubmit} />
      </section>

      {/* Footer mini */}
      <footer
        style={{
          background: "#1d1716",
          color: "white",
          padding: "40px 32px",
          marginTop: "100px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#e9d7c6", fontSize: "14px" }}>
          © 2026 Medea Beauty Lounge • Palermo
        </p>
      </footer>

      {/* Modale conferma */}
      {showModal && (
        <ConfirmModal
          data={bookingData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default Prenota;
