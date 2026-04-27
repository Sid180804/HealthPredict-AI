import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Header from "../components/Header";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ModelEvaluationPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/model/evaluation`).then((res) => setMetrics(res.data)).catch(() => setMetrics(null));
  }, []);

  const chartData = metrics
    ? [
        { name: "Accuracy", value: metrics.accuracy * 100 },
        { name: "Precision", value: metrics.precision * 100 },
        { name: "Recall", value: metrics.recall * 100 },
        { name: "F1 Score", value: metrics.f1_score * 100 },
      ]
    : [];

  const cm = metrics?.confusion_matrix || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Model Evaluation</h1>
        <p className="text-slate-600 mb-8">
          Data science & research quality metrics. Research-paper ready.
        </p>

        {metrics ? (
          <div className="space-y-8">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-teal-50 rounded-xl">
                  <p className="text-sm text-slate-600">Accuracy</p>
                  <p className="text-2xl font-bold text-teal-600">{(metrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-cyan-50 rounded-xl">
                  <p className="text-sm text-slate-600">Precision</p>
                  <p className="text-2xl font-bold text-cyan-600">{(metrics.precision * 100).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-slate-600">Recall</p>
                  <p className="text-2xl font-bold text-blue-600">{(metrics.recall * 100).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="text-sm text-slate-600">F1 Score</p>
                  <p className="text-2xl font-bold text-indigo-600">{(metrics.f1_score * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Confusion Matrix</h2>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-sm text-slate-600">True Positive</p>
                  <p className="text-2xl font-bold text-green-600">{cm.true_positive ?? 0}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <p className="text-sm text-slate-600">False Positive</p>
                  <p className="text-2xl font-bold text-red-600">{cm.false_positive ?? 0}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl text-center">
                  <p className="text-sm text-slate-600">False Negative</p>
                  <p className="text-2xl font-bold text-orange-600">{cm.false_negative ?? 0}</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-xl text-center">
                  <p className="text-sm text-slate-600">True Negative</p>
                  <p className="text-2xl font-bold text-teal-600">{cm.true_negative ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 h-80">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Metrics Visualization</h2>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#14b8a6" name="Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Note</h2>
              <p className="text-slate-600">{metrics.note}</p>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center text-slate-500">
            Loading evaluation metrics...
          </div>
        )}
      </main>
    </div>
  );
}
