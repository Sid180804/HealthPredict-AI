import React from "react";
import { Link } from "react-router-dom";

export default function MedicineDelivery({ meds }) {
  if (!meds || meds.length === 0) {
    return null;
  }

  /* No medicine without prescription - per legal requirements */
    return (
    <div className="glass p-6 rounded-2xl">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Order Medicines (Prescription Required)
      </h2>
      <p className="text-slate-600 mb-4">
        Medicines can only be ordered with a valid doctor prescription. Upload your prescription to order.
      </p>
      <Link
        to="/prescription"
        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition"
      >
        📄 Upload Prescription & Order
      </Link>
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 font-medium">
          ⚠️ No medicine without prescription. This system does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
}
