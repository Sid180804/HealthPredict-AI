import React from "react";

export default function HistoryPanel({ history }) {
  const exportToPDF = (item) => {
    // Mock PDF export - in production, use a library like jsPDF
    const content = `
HealthPredict AI - Diagnosis Report
====================================

Disease: ${item.disease}
Confidence: ${(item.confidence * 100).toFixed(1)}%
Severity: ${item.severity || "Not specified"}
Date: ${item.date}

---
This is a mock PDF export. In production, this would generate a proper PDF document.
    `;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnosis-report-${item.disease.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Diagnosis History
        </h2>
        {history && history.length > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {history.length}
          </span>
        )}
      </div>

      {(!history || history.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No previous predictions yet.</p>
          <p className="text-sm text-gray-400">
            Your diagnosis history will appear here
          </p>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.disease}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {(item.confidence * 100).toFixed(0)}%
                  </div>
                  {item.severity && (
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => exportToPDF(item)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                📄 Export Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
