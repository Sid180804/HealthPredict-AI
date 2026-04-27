import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PredictionCard({ predictions, urgency, explainableReason, featureImportance }) {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Predicted Conditions
      </h2>

      <div className="space-y-3">
        {predictions.map((p, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${
              index === 0 ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {p.disease}
                  </h3>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                      TOP MATCH
                    </span>
                  )}
                </div>
                {p.severity && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg">{getSeverityIcon(p.severity)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                        p.severity
                      )}`}
                    >
                      {p.severity.toUpperCase()} SEVERITY
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {(p.prob * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">confidence</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  index === 0 ? "bg-blue-600" : "bg-gray-400"
                }`}
                style={{ width: `${p.prob * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {explainableReason && (
        <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <p className="text-sm font-semibold text-teal-900 mb-2">Explainable AI – Why this prediction?</p>
          <p className="text-sm text-teal-800">{explainableReason}</p>
        </div>
      )}
      {featureImportance && featureImportance.length > 0 && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <p className="text-sm font-semibold text-slate-800 mb-3">Feature Importance</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={featureImportance} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" domain={[0, 1]} />
              <YAxis type="category" dataKey="symptom" width={70} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="importance" fill="#14b8a6" name="Importance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 font-medium">
          ⚠️ This system does not replace professional medical advice. Always consult a doctor for proper diagnosis.
        </p>
      </div>
    </div>
  );
}
