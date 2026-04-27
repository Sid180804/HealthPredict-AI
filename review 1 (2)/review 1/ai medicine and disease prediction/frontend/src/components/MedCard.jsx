import React from "react";

export default function MedCard({ meds }) {
  if (!meds || meds.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Commonly Prescribed by Doctors for This Condition
      </h2>
      <p className="text-xs text-amber-700 mb-4">This system does NOT prescribe. Consult a doctor. Order only with valid prescription.</p>

      <div className="space-y-4">
        {meds.map((med, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${
              med.suitable === false
                ? "bg-red-50 border-red-300"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">
                {med.name}
              </h3>
              {med.suitable === false && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                  NOT SUITABLE
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Dosage</p>
                <p className="font-medium text-gray-900">{med.dosage}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Frequency</p>
                <p className="font-medium text-gray-900">{med.frequency}</p>
              </div>
            </div>

            {med.warning && (
              <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">⚠ Warning:</span> {med.warning}
                </p>
              </div>
            )}

            {med.contraindications && med.contraindications.length > 0 && (
              <div className="space-y-1">
                {med.contraindications.map((contra, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded ${
                      contra.includes("CONTRANDICATED")
                        ? "bg-red-100 border border-red-300"
                        : "bg-orange-50 border border-orange-200"
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        contra.includes("CONTRANDICATED")
                          ? "text-red-900 font-bold"
                          : "text-orange-800"
                      }`}
                    >
                      {contra.includes("CONTRANDICATED") ? "🚫 " : "⚠️ "}
                      {contra}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 font-medium">
          ⚠️ This system does not replace professional medical advice. Medicines shown are for reference only. Order only with valid doctor prescription.
        </p>
      </div>
    </div>
  );
}
