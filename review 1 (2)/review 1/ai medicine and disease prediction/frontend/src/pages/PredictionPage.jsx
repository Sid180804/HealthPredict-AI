import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import SymptomSelector from "../components/SymptomSelector";
import PredictionCard from "../components/PredictionCard";
import MedCard from "../components/MedCard";
import DoctorFinder from "../components/DoctorFinder";
import HistoryPanel from "../components/HistoryPanel";
import MedicineDelivery from "../components/MedicineDelivery";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function PredictionPage() {
  const { user } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [freeText, setFreeText] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [meds, setMeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [explainableReason, setExplainableReason] = useState("");
  const [featureImportance, setFeatureImportance] = useState([]);
  const [urgency, setUrgency] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasEmergency, setHasEmergency] = useState(false);
  const [topDisease, setTopDisease] = useState("");

  const handleFreeTextParse = (text) => {
    // Parse free text and add to selected symptoms
    // The backend will handle the actual parsing
    setFreeText(text);
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0 && !freeText) {
      alert("Please select at least one symptom or enter a description.");
      return;
    }

    try {
      setLoading(true);
      setHasEmergency(false);

      const res = await axios.post(`${API_BASE}/api/ai/predict`, {
        symptoms: selectedSymptoms,
        free_text: freeText,
      });

      const preds = res.data.predictions || [];
      const medsResp = res.data.meds || [];
      const doctorsResp = res.data.doctors || [];

      setPredictions(preds);
      setMeds(medsResp);
      setDoctors(doctorsResp);
      setHospitals(res.data.hospitals || []);
      setHasEmergency(res.data.has_emergency || false);
      setTopDisease(res.data.top_disease || "");
      setExplainableReason(res.data.explainable_reason || "");
      setFeatureImportance(res.data.feature_importance || []);
      setUrgency(res.data.urgency || "consult_doctor");

      if (preds.length > 0) {
        const top = preds[0];
        const newEntry = {
          disease: top.disease,
          confidence: top.prob,
          severity: top.severity || "low",
          date: new Date().toLocaleString(),
        };
        setHistory([newEntry, ...history]);
      }
    } catch (err) {
      console.error("Prediction error:", err);
      alert("Error connecting to backend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Intelligent Symptom Analysis
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Select your symptoms or describe them in natural language. Our AI
            engine will analyze and provide personalized recommendations.
          </p>
        </div>

        {/* Emergency Alert */}
        {hasEmergency && (
          <div className="mb-6 p-6 bg-red-100 border-2 border-red-500 rounded-2xl animate-pulse-glow">
            <div className="flex items-start gap-4">
              <span className="text-4xl">??</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-xl mb-2">
                  Emergency – Seek Immediate Medical Care
                </h3>
                <p className="text-red-800 mb-4">
                  Your symptoms may indicate a medical emergency. Please seek immediate medical care or call emergency services.
                </p>
                {hospitals.length > 0 && (
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="font-semibold text-slate-800 mb-2">Nearby Hospitals</p>
                    <div className="space-y-2">
                      {hospitals.map((h) => (
                        <div key={h.id} className="flex justify-between text-sm">
                          <span className="font-medium">{h.name}</span>
                          <a href={`tel:${h.phone}`} className="text-teal-600 hover:underline">{h.phone}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr,1.3fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <SymptomSelector
              selected={selectedSymptoms}
              setSelected={setSelectedSymptoms}
              onFreeTextSubmit={handleFreeTextParse}
            />

            <button
              onClick={analyzeSymptoms}
              disabled={loading || (selectedSymptoms.length === 0 && !freeText)}
              className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-white font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                "?? Analyze Symptoms"
              )}
            </button>

            {predictions.length > 0 && (
              <>
                <PredictionCard predictions={predictions} urgency={urgency} explainableReason={explainableReason} featureImportance={featureImportance} />
                <MedCard meds={meds} />
                {meds.length > 0 && <MedicineDelivery meds={meds} />}
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <DoctorFinder doctors={doctors} disease={topDisease} />
            <HistoryPanel history={history} />
          </div>
        </div>
      </main>
    </div>
  );
}
